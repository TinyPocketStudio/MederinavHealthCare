// Saving bookings – shared by web bookings (index.js) and phone bookings (admin.js).

// No 0/O or 1/I so references are easy to read out over the phone.
const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function newReference() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return "MH-" + Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("");
}

/**
 * Inserts a booking only if the practitioner is free at that time.
 * One statement = atomic: two people clicking the same time can never both get it.
 * Returns the new reference, or null if the time is taken (booking or blocked time).
 */
export async function insertBooking(env, b) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const reference = newReference();
    try {
      const result = await env.DB.prepare(
        `INSERT INTO bookings (reference, treatment_id, practitioner_id, date, start_min, duration,
                               name, phone, email, message, lang, source, created_by)
         SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?13, ?14
          WHERE NOT EXISTS (SELECT 1 FROM bookings
                             WHERE practitioner_id = ?3 AND date = ?4 AND status = 'confirmed'
                               AND start_min < ?12 AND start_min + duration > ?5)
            AND NOT EXISTS (SELECT 1 FROM blocks
                             WHERE (practitioner_id = ?3 OR practitioner_id IS NULL) AND date = ?4
                               AND start_min < ?12 AND end_min > ?5)`
      ).bind(
        reference, b.treatmentId, b.practitionerId, b.date, b.start, b.end - b.start,
        b.name, b.phone, b.email, b.message, b.lang, b.end, b.source || "web", b.createdBy || ""
      ).run();
      return result.meta.changes ? reference : null;
    } catch (err) {
      // Extremely unlikely: the random reference already exists. Try a new one.
      if (attempt < 2 && String(err).includes("UNIQUE")) continue;
      throw err;
    }
  }
}
