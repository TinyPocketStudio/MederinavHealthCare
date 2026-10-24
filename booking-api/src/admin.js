/*
 * Staff API – used by the staff page at /admin/ (public/admin/).
 * Every request must come from a logged-in staff member (see auth.js).
 *
 *   GET    /admin/api/me                          who is logged in
 *   GET    /admin/api/config                      treatments (hidden too), staff and opening hours
 *   POST   /admin/api/treatments                  add a treatment
 *   PUT    /admin/api/treatments/<id>             change a treatment (hidden: true hides it on the website)
 *   PUT    /admin/api/campaign                    campaign texts, dates and campaign prices
 *   PUT    /admin/api/campaign/image              upload the campaign picture (the image file is the body)
 *   DELETE /admin/api/campaign/image              go back to the default picture
 *   GET    /admin/api/gallery                     before & after cases (unpublished too) + whether the section is on
 *   PUT    /admin/api/gallery/settings            { visible } switches the whole section on or off
 *   POST   /admin/api/gallery                     add a case (multipart form: texts + before/after files)
 *   PUT    /admin/api/gallery/<id>                change a case (pictures only replaced when sent)
 *   DELETE /admin/api/gallery/<id>                delete a case and its pictures
 *   POST   /admin/api/gallery/<id>/move           { direction: -1 | 1 } earlier or later on the website
 *   GET    /admin/api/gallery/<id>/<before|after> a picture, for the staff page's previews
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
import {
  deleteCampaignImage, insertTreatment, loadCampaign, loadCatalog, loadTreatments, saveCampaign, saveCampaignImage,
  slugId, updateTreatment,
} from "./catalog.js";
import {
  deleteCase, findCase, galleryCategories, galleryVisible, insertCase, loadCaseImage, loadCases, moveCase,
  setGalleryVisible, updateCase,
} from "./gallery.js";
import { checkImage, imageResponse } from "./images.js";

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

async function config(env) {
  const [categories, campaign] = await Promise.all([loadCatalog(env, { includeHidden: true }), loadCampaign(env)]);
  return {
    clinic: { name: DATA.clinic.name, phoneDisplay: DATA.clinic.phoneDisplay },
    team: DATA.team.map((p) => ({ id: p.id, name: p.name, days: p.days })),
    categories: categories.map((c) => ({
      id: c.id, name: c.name, es: { name: (c.es && c.es.name) || c.name },
      items: c.items,
    })),
    hours: DATA.hours,
    slotMinutes: DATA.slotMinutes,
    campaign,
  };
}

/* ---------- Treatments ---------- */
const TEXT_MAX = 1000;
const wholeNumber = (v) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN);

// Checks the treatment form (new and edited treatments). Returns { treatment } or { fields } naming what is wrong.
function readTreatment(body) {
  const es = body.es && typeof body.es === "object" ? body.es : {};
  const t = {
    category: str(body.category, 64),
    name: str(body.name, 200),
    duration: wholeNumber(body.duration),
    price: wholeNumber(body.price),
    practitioners: Array.isArray(body.practitioners) ? [...new Set(body.practitioners.map((p) => str(p, 64)))] : [],
    description: str(body.description, TEXT_MAX + 1),
    suitable: str(body.suitable, TEXT_MAX + 1),
    es: { name: str(es.name, 200), description: str(es.description, TEXT_MAX + 1), suitable: str(es.suitable, TEXT_MAX + 1) },
    hidden: body.hidden === true,
  };
  const fields = [];
  if (t.name.length < 2 || t.name.length > 80) fields.push("name");
  if (!DATA.categories.some((c) => c.id === t.category)) fields.push("category");
  if (!Number.isInteger(t.duration) || t.duration < 5 || t.duration > 480) fields.push("duration");
  if (!Number.isInteger(t.price) || t.price < 0 || t.price > 100000) fields.push("price");
  if (!t.practitioners.length || !t.practitioners.every((id) => DATA.team.some((p) => p.id === id))) fields.push("practitioners");
  if (t.description.length > TEXT_MAX) fields.push("description");
  if (t.suitable.length > TEXT_MAX) fields.push("suitable");
  // Spanish is required: always a name, and a translation of every Swedish text that is filled in.
  if (t.es.name.length < 2 || t.es.name.length > 80) fields.push("nameEs");
  if (t.es.description.length > TEXT_MAX || (t.description && !t.es.description)) fields.push("descriptionEs");
  if (t.es.suitable.length > TEXT_MAX || (t.suitable && !t.es.suitable)) fields.push("suitableEs");
  return fields.length ? { fields } : { treatment: t };
}

async function createTreatment(request, env, user) {
  const body = await readJson(request);
  if (!body) return json({ error: "invalid", fields: ["body"] }, 400);
  const { treatment, fields } = readTreatment(body);
  if (fields) return json({ error: "invalid", fields }, 400);
  const taken = (await loadTreatments(env, { includeHidden: true })).map((t) => t.id);
  treatment.id = slugId(treatment.name, taken);
  await insertTreatment(env, treatment, user.email);
  return json({ treatment }, 201);
}

/* ---------- Campaign ---------- */
async function changeCampaign(request, env, user) {
  const body = await readJson(request);
  if (!body) return json({ error: "invalid", fields: ["body"] }, 400);
  const es = body.es && typeof body.es === "object" ? body.es : {};
  const c = {
    name: str(body.name, 100), title: str(body.title, 200), description: str(body.description, 600),
    startDate: str(body.startDate, 10), endDate: str(body.endDate, 10),
    es: { name: str(es.name, 100), title: str(es.title, 200), description: str(es.description, 600) },
  };
  const fields = [];
  if (c.name.length < 2 || c.name.length > 60) fields.push("name");
  if (c.title.length > 120) fields.push("title");
  if (c.description.length > 500) fields.push("description");
  // Spanish is required, as for treatments: always a name, and a translation of every Swedish text that is filled in.
  if (c.es.name.length < 2 || c.es.name.length > 60) fields.push("nameEs");
  if (c.es.title.length > 120 || (c.title && !c.es.title)) fields.push("titleEs");
  if (c.es.description.length > 500 || (c.description && !c.es.description)) fields.push("descriptionEs");
  const start = parseDate(c.startDate);
  const end = parseDate(c.endDate);
  if (!start) fields.push("startDate");
  if (!end || (start && end < start)) fields.push("endDate");

  // { treatmentId: campaign price } – only treatments that exist, each cheaper than its normal price.
  const all = await loadTreatments(env, { includeHidden: true });
  const prices = {};
  const raw = body.prices && typeof body.prices === "object" ? body.prices : {};
  const badPrices = [];
  for (const [id, value] of Object.entries(raw)) {
    const t = all.find((x) => x.id === id);
    const price = wholeNumber(value);
    if (!t || !Number.isInteger(price) || price < 0 || price >= t.price) badPrices.push(id);
    else prices[id] = price;
  }
  if (badPrices.length) fields.push("prices");
  if (fields.length) return json({ error: "invalid", fields, badPrices }, 400);

  await saveCampaign(env, c, prices, user.email);
  return json({ campaign: await loadCampaign(env) });
}

async function uploadCampaignImage(request, env, user) {
  const type = (request.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
  const bytes = new Uint8Array(await request.arrayBuffer());
  const problem = checkImage(type, bytes);
  if (problem) return json({ error: problem }, problem === "image_too_large" ? 413 : 415);
  const version = await saveCampaignImage(env, type, bytes, user.email);
  return json({ imageVersion: version }, 201);
}

/* ---------- Before & after gallery ---------- */
async function listGallery(env) {
  const [cases, visible] = await Promise.all([loadCases(env), galleryVisible(env)]);
  return json({ visible, cases, categories: galleryCategories() });
}

// Reads the multipart form from the staff page: texts as fields, pictures as files "before" / "after".
// Returns { gallery, images } or { fields } / { error, status }.
async function readCaseForm(request, existing) {
  let form;
  try { form = await request.formData(); } catch { return { fields: ["body"] }; }
  const field = (name, max) => str(form.get(name), max);
  const c = {
    category: field("category", 64),
    title: field("title", 200), detail: field("detail", 300),
    es: { title: field("titleEs", 200), detail: field("detailEs", 300) },
    consent: form.get("consent") === "true",
    visible: form.get("visible") === "true",
  };
  const images = {};
  for (const side of ["before", "after"]) {
    const file = form.get(side);
    if (!file || typeof file === "string" || !file.size) continue;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = (file.type || "").toLowerCase();
    const problem = checkImage(type, bytes);
    if (problem) return { error: problem, side, status: problem === "image_too_large" ? 413 : 415 };
    images[side] = { type, bytes };
  }
  const fields = [];
  if (c.title.length < 2 || c.title.length > 80) fields.push("title");
  if (c.detail.length > 120) fields.push("detail");
  if (!galleryCategories().some((g) => g.id === c.category)) fields.push("category");
  // Spanish is required, as elsewhere on the staff page.
  if (c.es.title.length < 2 || c.es.title.length > 80) fields.push("titleEs");
  if (c.es.detail.length > 120 || (c.detail && !c.es.detail)) fields.push("detailEs");
  // Publishing needs the patient's consent and both pictures.
  if (c.visible && !c.consent) fields.push("consent");
  if (c.visible && !images.before && !(existing && existing.beforeVersion)) fields.push("before");
  if (c.visible && !images.after && !(existing && existing.afterVersion)) fields.push("after");
  return fields.length ? { fields } : { gallery: c, images };
}

async function createCase(request, env, user) {
  const read = await readCaseForm(request, null);
  if (read.error) return json({ error: read.error, side: read.side }, read.status);
  if (read.fields) return json({ error: "invalid", fields: read.fields }, 400);
  const id = await insertCase(env, read.gallery, read.images, user.email);
  return json({ case: await findCase(env, id) }, 201);
}

async function changeCase(request, env, user, id) {
  const existing = await findCase(env, id);
  if (!existing) return json({ error: "not_found" }, 404);
  const read = await readCaseForm(request, existing);
  if (read.error) return json({ error: read.error, side: read.side }, read.status);
  if (read.fields) return json({ error: "invalid", fields: read.fields }, 400);
  await updateCase(env, id, read.gallery, read.images, user.email);
  return json({ case: await findCase(env, id) });
}

async function handleGallery(request, env, user, path, method) {
  if (path === "/gallery" && method === "GET") return listGallery(env);
  if (path === "/gallery" && method === "POST") return createCase(request, env, user);
  if (path === "/gallery/settings" && method === "PUT") {
    const body = await readJson(request);
    if (!body || typeof body.visible !== "boolean") return json({ error: "invalid", fields: ["visible"] }, 400);
    await setGalleryVisible(env, body.visible, user.email);
    return json({ visible: body.visible });
  }
  const m = path.match(/^\/gallery\/(\d{1,9})(?:\/(before|after|move))?$/);
  if (!m) return json({ error: "not_found" }, 404);
  const id = Number(m[1]);
  if (!m[2] && method === "PUT") return changeCase(request, env, user, id);
  if (!m[2] && method === "DELETE") return (await deleteCase(env, id)) ? json({ deleted: id }) : json({ error: "not_found" }, 404);
  if (m[2] === "move" && method === "POST") {
    const body = await readJson(request);
    const direction = body && (body.direction === -1 || body.direction === 1) ? body.direction : 0;
    if (!direction) return json({ error: "invalid", fields: ["direction"] }, 400);
    return (await moveCase(env, id, direction)) ? json({ moved: id }) : json({ error: "not_found" }, 404);
  }
  if ((m[2] === "before" || m[2] === "after") && method === "GET") {
    const res = imageResponse(await loadCaseImage(env, id, m[2]));
    res.headers.set("Cache-Control", "private, max-age=31536000, immutable"); // never in shared caches
    return res;
  }
  return json({ error: "not_found" }, 404);
}

async function changeTreatment(request, env, user, id) {
  const body = await readJson(request);
  if (!body) return json({ error: "invalid", fields: ["body"] }, 400);
  const { treatment, fields } = readTreatment(body);
  if (fields) return json({ error: "invalid", fields }, 400);
  treatment.id = id;
  return (await updateTreatment(env, treatment, user.email)) ? json({ treatment }) : json({ error: "not_found" }, 404);
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
    { treatments: await loadTreatments(env), staff: true }
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
  if (path === "/config" && method === "GET") return json(await config(env));
  if (path === "/treatments" && method === "POST") return createTreatment(request, env, user);
  const treatment = path.match(/^\/treatments\/([a-z0-9-]{1,64})$/);
  if (treatment && method === "PUT") return changeTreatment(request, env, user, treatment[1]);
  if (path === "/campaign" && method === "PUT") return changeCampaign(request, env, user);
  if (path === "/gallery" || path.startsWith("/gallery/")) return handleGallery(request, env, user, path, method);
  if (path === "/campaign/image" && method === "PUT") return uploadCampaignImage(request, env, user);
  if (path === "/campaign/image" && method === "DELETE") {
    await deleteCampaignImage(env, user.email);
    return json({ imageVersion: null });
  }
  if (path === "/bookings" && method === "GET") return listBookings(url, env);
  if (path === "/bookings" && method === "POST") return createPhoneBooking(request, env, ctx, user);
  const cancel = path.match(/^\/bookings\/(MH-[A-Z0-9]{6})\/cancel$/);
  if (cancel && method === "POST") return cancelBooking(request, env, ctx, user, cancel[1]);
  if (path === "/blocks" && method === "POST") return createBlock(request, env, user);
  const block = path.match(/^\/blocks\/([^/]+)$/);
  if (block && method === "DELETE") return deleteBlock(env, block[1]);
  return json({ error: "not_found" }, 404);
}
