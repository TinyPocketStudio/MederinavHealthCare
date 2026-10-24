// Server-side checks that a requested time is really bookable.
// Mirrors daySlots() in assets/js/booking.js, but in the clinic's time zone.
import { DATA } from "./site-data.js";

const TIME_ZONE = "Europe/Stockholm";
const DAY_MS = 86400000;

const pad = (n) => String(n).padStart(2, "0");
export const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
export const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

// "YYYY-MM-DD" → Date at UTC midnight, or null if the string isn't a real date.
export function parseDate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? dt : null;
}
const dayNumber = (dt) => Math.floor(dt.getTime() / DAY_MS);

// Current date and minute-of-day in Stockholm (handles summer/winter time).
export function clinicNow(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(now).map((p) => [p.type, p.value])
  );
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return { date, day: dayNumber(parseDate(date)), minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

/**
 * Returns { start, end } in minutes if the slot can be booked, otherwise { error }.
 * error: treatment | practitioner | date | time | closed | past | too_soon | too_far
 *
 * treatments: the bookable treatments (loadTreatments() in catalog.js – hidden ones left out).
 * staff = true (phone bookings from the staff page): no minimum notice and no booking
 * window, but still within opening hours and never in the past.
 */
export function validateSlot({ treatmentId, practitionerId, date, time }, { treatments, staff = false, now = new Date() }) {
  const treatment = treatments.find((t) => t.id === treatmentId);
  if (!treatment) return { error: "treatment" };
  const person = DATA.team.find((p) => p.id === practitionerId);
  if (!person || !treatment.practitioners.includes(practitionerId)) return { error: "practitioner" };
  const day = parseDate(date);
  if (!day) return { error: "date" };
  if (typeof time !== "string" || !/^\d{2}:\d{2}$/.test(time)) return { error: "time" };

  const dow = day.getUTCDay();
  const hours = DATA.hours[dow];
  if (!hours || !person.days.includes(dow)) return { error: "closed" };

  const start = toMin(time);
  const end = start + treatment.duration;
  const open = toMin(hours[0]);
  const close = toMin(hours[1]);
  if (start < open || end > close || (start - open) % DATA.slotMinutes !== 0) return { error: "time" };

  const nowLocal = clinicNow(now);
  const slotKey = dayNumber(day) * 1440 + start;
  const nowKey = nowLocal.day * 1440 + nowLocal.minutes;
  if (staff) return slotKey < nowKey ? { error: "past" } : { start, end };
  if (slotKey < nowKey + DATA.minNoticeHours * 60) return { error: "too_soon" };
  // Same window as the calendar: this week plus (bookingWeeksAhead - 1) more weeks, Monday–Sunday.
  const weekday = new Date(nowLocal.day * DAY_MS).getUTCDay();
  const firstMonday = nowLocal.day - ((weekday + 6) % 7);
  if (dayNumber(day) > firstMonday + 7 * DATA.bookingWeeksAhead - 1) return { error: "too_far" };

  return { start, end };
}
