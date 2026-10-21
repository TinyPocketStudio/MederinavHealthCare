// Booking emails, sent through Brevo (EU) after a booking is saved.
// Without BREVO_API_KEY (local testing) emails are printed to the console instead of sent.
import { DATA, allTreatments } from "./site-data.js";
import { clinicNow, fromMin, parseDate } from "./schedule.js";

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(DATA.clinic.address);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const loc = (obj, field, lang) => (lang !== "sv" && obj[lang] && obj[lang][field]) || obj[field];
const kr = (n, lang) => `${new Intl.NumberFormat(lang === "es" ? "es-ES" : "sv-SE").format(n)} kr`;
const longDate = (date, lang) =>
  new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "sv-SE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })
    .format(parseDate(date));

// Same rule as the website: campaign price applies until the campaign's end date.
function priceOf(treatment) {
  const end = DATA.campaign && DATA.campaign.endDate;
  const active = end && clinicNow().date <= end;
  return active && treatment.campaignPrice ? treatment.campaignPrice : treatment.price;
}

const TEXT = {
  sv: {
    subject: ({ treatment, date, time }) => `Bokningsbekräftelse: ${treatment}, ${date} kl. ${time}`,
    hello: (first) => `Hej ${first}!`,
    intro: "Tack för din bokning hos Mederinav Health Care. Här är dina uppgifter:",
    treatment: "Behandling", practitioner: "Behandlare", date: "Datum", time: "Tid", price: "Pris", reference: "Bokningsnummer",
    address: "Adress", map: "Öppna i kartan",
    cancel: ({ phone }) => `Behöver du avboka eller flytta tiden? Avbokning är kostnadsfri senast 24 timmar innan. Ring oss på ${phone} eller svara på det här mejlet.`,
    outro: "Varmt välkommen!",
    cancelledSubject: ({ treatment, date, time }) => `Avbokad: ${treatment}, ${date} kl. ${time}`,
    cancelledIntro: "Din tid hos Mederinav Health Care har avbokats:",
    rebook: ({ phone }) => `Vill du boka en ny tid? Boka på www.mederinavhealthcare.se/boka, ring oss på ${phone} eller svara på det här mejlet.`,
    regards: "Vänliga hälsningar,",
  },
  es: {
    subject: ({ treatment, date, time }) => `Confirmación de reserva: ${treatment}, ${date} a las ${time}`,
    hello: (first) => `¡Hola, ${first}!`,
    intro: "Gracias por tu reserva en Mederinav Health Care. Estos son los detalles:",
    treatment: "Tratamiento", practitioner: "Profesional", date: "Fecha", time: "Hora", price: "Precio", reference: "Número de reserva",
    address: "Dirección", map: "Abrir en el mapa",
    cancel: ({ phone }) => `¿Necesitas cancelar o cambiar la cita? La cancelación es gratuita hasta 24 horas antes. Llámanos al ${phone} o responde a este correo.`,
    outro: "¡Te esperamos!",
    cancelledSubject: ({ treatment, date, time }) => `Cita cancelada: ${treatment}, ${date} a las ${time}`,
    cancelledIntro: "Tu cita en Mederinav Health Care ha sido cancelada:",
    rebook: ({ phone }) => `¿Quieres reservar una nueva cita? Reserva en www.mederinavhealthcare.se/boka, llámanos al ${phone} o responde a este correo.`,
    regards: "Saludos cordiales,",
  },
};

function detailsTable(rows) {
  const tr = rows.map(([k, v]) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#56686b;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;color:#0e1a1c;font-weight:600">${esc(v)}</td></tr>`).join("");
  return `<table role="presentation" style="border-collapse:collapse;margin:16px 0">${tr}</table>`;
}

function layout(inner) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#effdfd;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#364649">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px">
<p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#0e1a1c">Mederinav Health Care</p>
${inner}
</div></body></html>`;
}

function patientEmail(b) {
  const T = TEXT[b.lang] || TEXT.sv;
  const rows = [
    [T.treatment, `${b.treatmentName} (${b.duration} min)`],
    [T.practitioner, b.practitionerName],
    [T.date, b.dateLong],
    [T.time, `${b.time}–${b.endTime}`],
    [T.price, b.price],
    [T.reference, b.reference],
  ];
  const phone = DATA.clinic.phoneDisplay;
  const html = layout(`
<p style="margin:0 0 8px">${esc(T.hello(b.first))}</p>
<p style="margin:0">${esc(T.intro)}</p>
${detailsTable(rows)}
<p style="margin:0 0 4px"><strong>${esc(T.address)}:</strong> ${esc(DATA.clinic.address)}<br><a href="${MAPS_URL}" style="color:#1e5d63">${esc(T.map)}</a></p>
<p style="margin:16px 0">${esc(T.cancel({ phone }))}</p>
<p style="margin:0">${esc(T.outro)}<br>Mederinav Health Care</p>`);
  const text = [
    T.hello(b.first), "", T.intro, "",
    ...rows.map(([k, v]) => `${k}: ${v}`), "",
    `${T.address}: ${DATA.clinic.address}`, MAPS_URL, "",
    T.cancel({ phone }), "", T.outro, "Mederinav Health Care",
  ].join("\n");
  return { subject: T.subject({ treatment: b.treatmentName, date: b.dateLong, time: b.time }), html, text };
}

function cancellationEmail(b) {
  const T = TEXT[b.lang] || TEXT.sv;
  const rows = [
    [T.treatment, `${b.treatmentName} (${b.duration} min)`],
    [T.practitioner, b.practitionerName],
    [T.date, b.dateLong],
    [T.time, `${b.time}–${b.endTime}`],
    [T.reference, b.reference],
  ];
  const phone = DATA.clinic.phoneDisplay;
  const html = layout(`
<p style="margin:0 0 8px">${esc(T.hello(b.first))}</p>
<p style="margin:0">${esc(T.cancelledIntro)}</p>
${detailsTable(rows)}
<p style="margin:16px 0">${esc(T.rebook({ phone }))}</p>
<p style="margin:0">${esc(T.regards)}<br>Mederinav Health Care</p>`);
  const text = [
    T.hello(b.first), "", T.cancelledIntro, "",
    ...rows.map(([k, v]) => `${k}: ${v}`), "",
    T.rebook({ phone }), "", T.regards, "Mederinav Health Care",
  ].join("\n");
  return { subject: T.cancelledSubject({ treatment: b.treatmentName, date: b.dateLong, time: b.time }), html, text };
}

function clinicEmail(b) {
  const rows = [
    ["Datum", b.dateLongSv],
    ["Tid", `${b.time}–${b.endTime}`],
    ["Behandling", `${b.treatmentNameSv} (${b.duration} min)`],
    ["Behandlare", b.practitionerName],
    ["Namn", b.name],
    ["Telefon", b.phone],
    ["E-post", b.email],
    ["Meddelande", b.message || "–"],
    ["Språk", b.lang === "es" ? "Spanska" : "Svenska"],
    ["Bokningsnummer", b.reference],
  ];
  const html = layout(`
<p style="margin:0">Ny bokning via webbplatsen:</p>
${detailsTable(rows)}
<p style="margin:0;color:#56686b;font-size:13px">Svara på det här mejlet för att skriva direkt till patienten. Tiden är redan markerad som upptagen i kalendern.</p>`);
  const text = ["Ny bokning via webbplatsen:", "", ...rows.map(([k, v]) => `${k}: ${v}`)].join("\n");
  return { subject: `Ny bokning: ${b.dateLongSv} kl. ${b.time} – ${b.treatmentNameSv} (${b.practitionerName})`, html, text };
}

async function send(env, { to, replyTo, subject, html, text, tag }) {
  if (!env.BREVO_API_KEY) {
    console.log(`[email not sent – no BREVO_API_KEY] to=${to.map((r) => r.email).join(",")} subject="${subject}"\n${text}`);
    return;
  }
  const res = await fetch(BREVO_URL, {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { name: env.MAIL_FROM_NAME || DATA.clinic.name, email: env.MAIL_FROM },
      to,
      replyTo,
      subject,
      htmlContent: html,
      textContent: text,
      tags: [tag],
    }),
  });
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`);
}

// Everything the templates need about one booking, in the patient's language.
function describe(booking) {
  // A booking may refer to a treatment that has since been removed from data.js –
  // then fall back to what the booking itself stored.
  const treatment = allTreatments().find((t) => t.id === booking.treatmentId)
    || { name: booking.treatmentId, duration: booking.duration || 30, price: null };
  const person = DATA.team.find((p) => p.id === booking.practitionerId) || { name: booking.practitionerId };
  const lang = booking.lang === "es" ? "es" : "sv";
  const duration = booking.duration || treatment.duration;
  return {
    ...booking,
    lang,
    first: booking.name.split(/\s+/)[0],
    treatmentName: loc(treatment, "name", lang),
    treatmentNameSv: treatment.name,
    practitionerName: person.name,
    duration,
    dateLong: longDate(booking.date, lang),
    dateLongSv: longDate(booking.date, "sv"),
    endTime: fromMin(booking.startMin + duration),
    price: treatment.price == null ? "–" : kr(priceOf(treatment), lang),
  };
}

const patientReplyTo = (env) => ({ email: env.MAIL_REPLY_TO || DATA.clinic.email, name: DATA.clinic.name });

/**
 * Sends the patient confirmation and (unless clinic = false, e.g. for phone bookings made
 * by staff) the clinic notification. Errors are logged, never thrown to the patient.
 */
export async function sendBookingEmails(env, booking, { clinic = true } = {}) {
  const b = describe(booking);

  const jobs = [];
  const patient = patientEmail(b);
  jobs.push(send(env, {
    to: [{ email: b.email, name: b.name }],
    replyTo: patientReplyTo(env),
    ...patient,
    tag: "booking-confirmation",
  }));

  const clinicTo = clinic ? (env.CLINIC_NOTIFY_EMAIL || "").split(",").map((s) => s.trim()).filter(Boolean) : [];
  if (!clinic) {
    // Staff made this booking themselves – no "Ny bokning" email needed.
  } else if (clinicTo.length) {
    const clinic = clinicEmail(b);
    jobs.push(send(env, {
      to: clinicTo.map((email) => ({ email })),
      replyTo: { email: b.email, name: b.name },
      ...clinic,
      tag: "booking-clinic",
    }));
  } else {
    console.warn("CLINIC_NOTIFY_EMAIL is not set – no clinic notification sent");
  }

  const results = await Promise.allSettled(jobs);
  results.forEach((r) => { if (r.status === "rejected") console.error("Email failed:", r.reason && r.reason.message); });
}

/** Tells the patient their booking was cancelled (sent when staff tick "send email" when cancelling). */
export async function sendCancellationEmail(env, booking) {
  const b = describe(booking);
  try {
    await send(env, { to: [{ email: b.email, name: b.name }], replyTo: patientReplyTo(env), ...cancellationEmail(b), tag: "booking-cancelled" });
  } catch (err) {
    console.error("Cancellation email failed:", err.message);
  }
}
