/*
 * Staff API – used by the staff page at /admin/ (public/admin/).
 * Every request must come from a logged-in staff member (see auth.js).
 *
 *   GET    /admin/api/me                          who is logged in
 *   GET    /admin/api/config                      treatments, staff and opening hours (from data.js)
 *   GET    /admin/api/bookings?from=…&to=…        bookings + blocked time, all details
 *   POST   /admin/api/bookings                    phone booking
 *   POST   /admin/api/bookings/MH-XXXXXX/cancel   cancel { notify: true } emails the patient
 *   POST   /admin/api/blocks                      block time (one or several days)
 *   DELETE /admin/api/blocks/123                  remove blocked time
 */
import { staffUser } from "./auth.js";
import { DATA } from "./site-data.js";
import { fromMin, parseDate, toMin, validateSlot } from "./schedule.js";
import { insertBooking } from "./store.js";
import { sendBookingEmails, sendCancellationEmail } from "./email.js";

const MAX_LIST_DAYS = 62;
const MAX_BLOCK_DAYS = 62;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const DAY_MS = 86400000;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const ymd = (d) => d.toISOString().slice(0, 10);
const nowIso = () => new Date().toISOString().replace(/\.\d+Z$/, "Z");

async function readJson(request) {
  try { const b = await request.json(); return b && typeof b === "object" ? b : null; } catch { return null; }
}

function dateRange(url, maxDays) {
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const f = parseDate(from);
  const t = parseDate(to);
  if (!f || !t || t < f || (t - f) / DAY_MS > maxDays) return null;
  return { from, to };
}

function config() {
  return {
    clinic: { name: DATA.clinic.name, phoneDisplay: DATA.clinic.phoneDisplay },
    team: DATA.team.map((p) => ({ id: p.id, name: p.name, days: p.days })),
    categories: DATA.categories.map((c) => ({
      id: c.id, name: c.name,
      items: c.items.map((t) => ({ id: t.id, name: t.name, duration: t.duration, practitioners: t.practitioners })),
    })),
    hours: DATA.hours,
    slotMinutes: DATA.slotMinutes,
  };
}

async function listBookings(url, env) {
  const range = dateRange(url, MAX_LIST_DAYS);
  if (!range) return json({ error: "invalid_range" }, 400);
  const bookings = await env.DB.prepare(
    `SELECT reference, treatment_id AS treatmentId, practitioner_id AS practitionerId, date,
            start_min AS start, start_min + duration AS end, duration, status, source,
            name, phone, email, message, lang, created_at AS createdAt, created_by AS createdBy,
            cancelled_at AS cancelledAt, cancelled_by AS cancelledBy
       FROM bookings WHERE date BETWEEN ?1 AND ?2 ORDER BY date, start_min`
  ).bind(range.from, range.to).all();
  const blocks = await env.DB.prepare(
    `SELECT id, practitioner_id AS practitionerId, date, start_min AS start, end_min AS end, note,
            created_by AS createdBy
       FROM blocks WHERE date BETWEEN ?1 AND ?2 ORDER BY date, start_min`
  ).bind(range.from, range.to).all();
  return json({ bookings: bookings.results, blocks: blocks.results });
}

async function createPhoneBooking(request, env, ctx, user) {
  const body = await readJson(request);
  if (!body) return json({ error: "invalid", fields: ["body"] }, 400);
  const input = {
    treatment: str(body.treatment, 64),
    practitioner: str(body.practitioner, 64),
    date: str(body.date, 10),
    time: str(body.time, 5),
    name: str(body.name, 120),
    phone: str(body.phone, 40),
    email: str(body.email, 254),
    message: str(body.message, 1000),
    lang: body.lang === "es" ? "es" : "sv",
    sendConfirmation: body.sendConfirmation === true,
  };
  const fields = [];
  if (input.name.length < 2) fields.push("name");
  if ((input.phone.match(/\d/g) || []).length < 8) fields.push("phone");
  if (input.email && !EMAIL_RE.test(input.email)) fields.push("email");
  if (input.sendConfirmation && !input.email) fields.push("email");
  if (fields.length) return json({ error: "invalid", fields }, 400);

  const slot = validateSlot(
    { treatmentId: input.treatment, practitionerId: input.practitioner, date: input.date, time: input.time },
    { staff: true }
  );
  if (slot.error) return json({ error: "invalid_slot", reason: slot.error }, 400);

  const reference = await insertBooking(env, {
    treatmentId: input.treatment, practitionerId: input.practitioner, date: input.date,
    start: slot.start, end: slot.end,
    name: input.name, phone: input.phone, email: input.email, message: input.message, lang: input.lang,
    source: "phone", createdBy: user.email,
  });
  if (!reference) return json({ error: "slot_taken" }, 409);

  if (input.sendConfirmation) {
    ctx.waitUntil(sendBookingEmails(env, {
      reference, treatmentId: input.treatment, practitionerId: input.practitioner,
      date: input.date, time: input.time, startMin: slot.start,
      name: input.name, phone: input.phone, email: input.email, message: input.message, lang: input.lang,
    }, { clinic: false }).catch((err) => console.error("Phone booking email failed:", err)));
  }
  return json({ reference }, 201);
}

async function cancelBooking(request, env, ctx, user, reference) {
  const body = (await readJson(request)) || {};
  const booking = await env.DB.prepare(
    `SELECT reference, treatment_id AS treatmentId, practitioner_id AS practitionerId, date,
            start_min AS startMin, duration, name, phone, email, message, lang, status
       FROM bookings WHERE reference = ?1`
  ).bind(reference).first();
  if (!booking) return json({ error: "not_found" }, 404);
  if (booking.status !== "confirmed") return json({ error: "already_cancelled" }, 409);

  const result = await env.DB.prepare(
    `UPDATE bookings SET status = 'cancelled', cancelled_at = ?2, cancelled_by = ?3
      WHERE reference = ?1 AND status = 'confirmed'`
  ).bind(reference, nowIso(), user.email).run();
  if (!result.meta.changes) return json({ error: "already_cancelled" }, 409);

  const notify = body.notify === true && EMAIL_RE.test(booking.email || "");
  if (notify) {
    ctx.waitUntil(sendCancellationEmail(env, { ...booking, time: fromMin(booking.startMin) }));
  }
  return json({ cancelled: reference, emailed: notify });
}

async function createBlock(request, env, user) {
  const body = await readJson(request);
  if (!body) return json({ error: "invalid", fields: ["body"] }, 400);
  const practitioner = str(body.practitioner, 64) || null; // empty = whole clinic
  const from = str(body.from, 10);
  const to = str(body.to, 10) || from;
  const allDay = body.allDay === true;
  const startTime = str(body.start, 5);
  const endTime = str(body.end, 5);
  const note = str(body.note, 200);

  const fields = [];
  if (practitioner && !DATA.team.some((p) => p.id === practitioner)) fields.push("practitioner");
  const f = parseDate(from);
  const t = parseDate(to);
  if (!f) fields.push("from");
  if (!t || (f && t < f) || (f && t && (t - f) / DAY_MS >= MAX_BLOCK_DAYS)) fields.push("to");
  let start = 0;
  let end = 24 * 60;
  if (!allDay) {
    if (!TIME_RE.test(startTime)) fields.push("start");
    if (!TIME_RE.test(endTime)) fields.push("end");
    if (TIME_RE.test(startTime) && TIME_RE.test(endTime)) {
      start = toMin(startTime);
      end = toMin(endTime);
      if (end <= start) fields.push("end");
    }
  }
  if (fields.length) return json({ error: "invalid", fields }, 400);

  const days = [];
  for (let d = f.getTime(); d <= t.getTime(); d += DAY_MS) days.push(ymd(new Date(d)));
  await env.DB.batch(days.map((date) => env.DB.prepare(
    `INSERT INTO blocks (practitioner_id, date, start_min, end_min, note, created_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
  ).bind(practitioner, date, start, end, note, user.email)));

  // Bookings that already exist in the blocked time are NOT cancelled automatically –
  // the staff page lists them so staff can contact the patients.
  const conflicts = await env.DB.prepare(
    `SELECT reference, date, start_min AS start, name FROM bookings
      WHERE status = 'confirmed' AND date BETWEEN ?1 AND ?2
        AND (?3 IS NULL OR practitioner_id = ?3)
        AND start_min < ?5 AND start_min + duration > ?4
      ORDER BY date, start_min`
  ).bind(from, to, practitioner, start, end).all();
  return json({ created: days.length, conflicts: conflicts.results }, 201);
}

async function deleteBlock(env, id) {
  if (!/^\d+$/.test(id)) return json({ error: "not_found" }, 404);
  const result = await env.DB.prepare(`DELETE FROM blocks WHERE id = ?1`).bind(Number(id)).run();
  return result.meta.changes ? json({ deleted: Number(id) }) : json({ error: "not_found" }, 404);
}

export async function handleAdmin(request, env, ctx, url) {
  const user = await staffUser(request, env);
  if (!user) return json({ error: "unauthorized" }, 401);

  const path = url.pathname.slice("/admin/api".length);
  const method = request.method;

  if (path === "/me" && method === "GET") return json({ email: user.email });
  if (path === "/config" && method === "GET") return json(config());
  if (path === "/bookings" && method === "GET") return listBookings(url, env);
  if (path === "/bookings" && method === "POST") return createPhoneBooking(request, env, ctx, user);
  const cancel = path.match(/^\/bookings\/(MH-[A-Z0-9]{6})\/cancel$/);
  if (cancel && method === "POST") return cancelBooking(request, env, ctx, user, cancel[1]);
  if (path === "/blocks" && method === "POST") return createBlock(request, env, user);
  const block = path.match(/^\/blocks\/([^/]+)$/);
  if (block && method === "DELETE") return deleteBlock(env, block[1]);
  return json({ error: "not_found" }, 404);
}
