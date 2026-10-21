/*
 * Mederinav booking API (Cloudflare Worker), served at https://api.mederinavhealthcare.se
 *
 *   GET  /availability?from=YYYY-MM-DD&to=YYYY-MM-DD   taken times (no personal data)
 *   POST /bookings                                     create a booking (+ confirmation emails)
 *   /admin/                                            staff page (behind Cloudflare Access)
 *   /admin/api/*                                       staff API, see admin.js
 *
 * Everything is re-checked here; the browser is never trusted.
 */
import { clinicNow, parseDate, validateSlot } from "./schedule.js";
import { sendBookingEmails } from "./email.js";
import { insertBooking } from "./store.js";
import { handleAdmin } from "./admin.js";

const MAX_RANGE_DAYS = 14;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// One person (same email or same phone number) may have at most this many upcoming bookings
// when booking on the website. Staff phone bookings are not limited. Change the number here.
const MAX_UPCOMING_PER_PERSON = 2;

// Make "Anna@Mail.se " and "anna@mail.se" – and "+46 70-123 45 67" and "0701234567" – count as the same.
const normEmail = (s) => String(s || "").trim().toLowerCase();
const normPhone = (s) => String(s || "").replace(/\D/g, "").replace(/^0046/, "0").replace(/^46/, "0");

async function upcomingBookingsFor(env, email, phone) {
  const { results } = await env.DB.prepare(
    `SELECT email, phone FROM bookings WHERE status = 'confirmed' AND date >= ?1`
  ).bind(clinicNow().date).all();
  const e = normEmail(email);
  const p = normPhone(phone);
  return results.filter((b) => (e && normEmail(b.email) === e) || (p && normPhone(b.phone) === p)).length;
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors },
  });
}

// Only the website itself may call the API from a browser.
function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const headers = { Vary: "Origin" };
  if (origin && allowed.includes(origin)) {
    Object.assign(headers, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    });
  }
  return headers;
}

async function availability(url, env, cors) {
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const fromDay = parseDate(from);
  const toDay = parseDate(to);
  if (!fromDay || !toDay || toDay < fromDay || (toDay - fromDay) / 86400000 > MAX_RANGE_DAYS) {
    return json({ error: "invalid_range" }, 400, cors);
  }
  const booked = await env.DB.prepare(
    `SELECT practitioner_id AS p, date, start_min AS start, start_min + duration AS end
       FROM bookings WHERE status = 'confirmed' AND date BETWEEN ?1 AND ?2`
  ).bind(from, to).all();
  const blocked = await env.DB.prepare(
    `SELECT practitioner_id AS p, date, start_min AS start, end_min AS end, 1 AS block
       FROM blocks WHERE date BETWEEN ?1 AND ?2`
  ).bind(from, to).all();
  return json({ busy: [...booked.results, ...blocked.results] }, 200, cors);
}

async function createBooking(request, env, ctx, cors) {
  let body;
  try { body = await request.json(); } catch { body = null; }
  if (!body || typeof body !== "object") return json({ error: "invalid", fields: ["body"] }, 400, cors);

  const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
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
  };

  // Same rules as the form in assets/js/booking.js
  const fields = [];
  if (input.name.split(/\s+/).length < 2) fields.push("name");
  if ((input.phone.match(/\d/g) || []).length < 8) fields.push("phone");
  if (!EMAIL_RE.test(input.email)) fields.push("email");
  if (body.consent !== true) fields.push("consent");
  if (fields.length) return json({ error: "invalid", fields }, 400, cors);

  const slot = validateSlot({ treatmentId: input.treatment, practitionerId: input.practitioner, date: input.date, time: input.time });
  if (slot.error) return json({ error: "invalid_slot", reason: slot.error }, 400, cors);

  if (await upcomingBookingsFor(env, input.email, input.phone) >= MAX_UPCOMING_PER_PERSON) {
    return json({ error: "too_many", max: MAX_UPCOMING_PER_PERSON }, 429, cors);
  }

  const reference = await insertBooking(env, {
    treatmentId: input.treatment, practitionerId: input.practitioner, date: input.date,
    start: slot.start, end: slot.end,
    name: input.name, phone: input.phone, email: input.email, message: input.message, lang: input.lang,
  });
  if (!reference) return json({ error: "slot_taken" }, 409, cors);

  // Emails go out in the background: the patient gets the booking number right away,
  // and an email problem can never undo a saved booking.
  ctx.waitUntil(sendBookingEmails(env, {
    reference,
    treatmentId: input.treatment,
    practitionerId: input.practitioner,
    date: input.date,
    time: input.time,
    startMin: slot.start,
    name: input.name,
    phone: input.phone,
    email: input.email,
    message: input.message,
    lang: input.lang,
  }).catch((err) => console.error("Booking emails failed:", err)));
  return json({ reference }, 201, cors);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    try {
      // Staff page API (the page itself, /admin/, is a static file in public/admin/).
      if (url.pathname.startsWith("/admin/api/")) return await handleAdmin(request, env, ctx, url);

      if (url.pathname === "/availability") {
        return request.method === "GET" ? await availability(url, env, cors) : json({ error: "method" }, 405, cors);
      }
      if (url.pathname === "/bookings") {
        return request.method === "POST" ? await createBooking(request, env, ctx, cors) : json({ error: "method" }, 405, cors);
      }
      return json({ error: "not_found" }, 404, cors);
    } catch (err) {
      console.error(err);
      return json({ error: "server" }, 500, cors);
    }
  },
};
