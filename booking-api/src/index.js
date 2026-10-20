/*
 * Mederinav booking API (Cloudflare Worker), served at https://api.mederinavhealthcare.se
 *
 *   GET  /availability?from=YYYY-MM-DD&to=YYYY-MM-DD   taken times (no personal data)
 *   POST /bookings                                     create a booking (+ confirmation emails)
 *
 * Everything is re-checked here; the browser is never trusted.
 */
import { parseDate, validateSlot } from "./schedule.js";
import { sendBookingEmails } from "./email.js";

const MAX_RANGE_DAYS = 14;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// No 0/O or 1/I so references are easy to read out over the phone.
const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

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

function newReference() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return "MH-" + Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("");
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
    `SELECT practitioner_id AS p, date, start_min AS start, end_min AS end
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

  // One statement = atomic: the row is only inserted if nothing overlaps at that moment,
  // so two people clicking the same time can never both get it.
  for (let attempt = 0; attempt < 3; attempt++) {
    const reference = newReference();
    try {
      const result = await env.DB.prepare(
        `INSERT INTO bookings (reference, treatment_id, practitioner_id, date, start_min, duration, name, phone, email, message, lang)
         SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11
          WHERE NOT EXISTS (SELECT 1 FROM bookings
                             WHERE practitioner_id = ?3 AND date = ?4 AND status = 'confirmed'
                               AND start_min < ?12 AND start_min + duration > ?5)
            AND NOT EXISTS (SELECT 1 FROM blocks
                             WHERE (practitioner_id = ?3 OR practitioner_id IS NULL) AND date = ?4
                               AND start_min < ?12 AND end_min > ?5)`
      ).bind(
        reference, input.treatment, input.practitioner, input.date, slot.start, slot.end - slot.start,
        input.name, input.phone, input.email, input.message, input.lang, slot.end
      ).run();
      if (!result.meta.changes) return json({ error: "slot_taken" }, 409, cors);
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
    } catch (err) {
      // Extremely unlikely: the random reference already exists. Try a new one.
      if (attempt < 2 && String(err).includes("UNIQUE")) continue;
      throw err;
    }
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    try {
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
