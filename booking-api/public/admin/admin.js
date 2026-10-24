/* Mederinav – staff page. Talks to /admin/api/* (booking-api/src/admin.js). */
(function () {
  "use strict";

  const API = "/admin/api";
  const $ = (id) => document.getElementById(id);

  /* ---------- Language (Swedish / Spanish) ---------- */
  const TEXT = {
    sv: {
      days: ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"],
      months: ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"],
      dayMonth: (d, m) => `${d} ${m}`,
      lang: "Språk", logout: "Logga ut", prevWeek: "Föregående vecka", nextWeek: "Nästa vecka", thisWeek: "Denna vecka",
      bookings: "Bokningar", showPractitioner: "Visa behandlare", allPractitioners: "Alla behandlare", showCancelled: "Visa avbokade",
      newBookingBtn: "+ Ny bokning", blockTime: "Blockera tid", loading: "Hämtar bokningar…", newBooking: "Ny bokning",
      "f.treatment": "Behandling", "f.practitioner": "Behandlare", "f.date": "Datum", "f.time": "Tid", "f.name": "Namn",
      "f.phone": "Telefon", "f.email": "E-post", optional: "(valfritt)", "f.mailLang": "Språk för mejl", swedish: "Svenska", spanish: "Spanska",
      "f.message": "Meddelande / anteckning", "f.sendConfirmation": "Skicka bekräftelse till patientens e-post",
      cancel: "Avbryt", saveBooking: "Spara bokning",
      blockHint: "Blockerad tid kan inte bokas på webben, t.ex. semester, sjukdom eller lunch.",
      "f.appliesTo": "Gäller", "f.fromDate": "Från datum", "f.toDate": "Till och med", allDay: "Hela dagen",
      "f.fromTime": "Från kl.", "f.toTime": "Till kl.", "f.note": "Anteckning", "f.noteExample": "(t.ex. Semester)", block: "Blockera",
      cancelTitle: "Avboka tiden?", notifyPatient: "Skicka avbokningsmejl till patienten",
      noEmail: "Patienten har ingen e-postadress – ring och meddela i stället.", keepBooking: "Behåll tiden", cancelBooking: "Avboka",
      authTitle: "Du är inte inloggad eller har inte behörighet.",
      authText: "Ladda om sidan och logga in med din e-postadress. Hör av dig till den som administrerar sidan om problemet kvarstår.",
      week: "Vecka", loadError: "Det gick inte att hämta bokningarna.", retry: "Försök igen", today: "Idag",
      nBookings: (n) => `${n} ${n === 1 ? "bokning" : "bokningar"}`, closed: "Stängt", noBookings: "Inga bokningar",
      noBookingsWeek: "Inga bokningar den här veckan.", bookedBy: (who) => `bokad av ${who}`, staff: "personal", bookedWeb: "bokad via webben",
      tagPhone: "Telefon", tagCancelled: "Avbokad", tagSpanish: "Spanska", cancelledBy: (who) => `avbokad av ${who}`,
      blocked: "Blockerad", by: (who) => `av ${who}`, remove: "Ta bort", wholeClinic: "Hela kliniken",
      labels: { name: "namn", phone: "telefon (minst 8 siffror)", email: "e-post", from: "från-datum", to: "till-datum", start: "från-tid", end: "till-tid", practitioner: "behandlare" },
      slotTaken: "Tiden är redan bokad eller blockerad. Välj en annan tid.", slotPast: "Tiden har redan passerat.",
      slotClosed: "Behandlaren arbetar inte den dagen, eller kliniken är stängd.", slotHours: "Tiden ligger utanför öppettiderna.",
      check: (list) => `Kontrollera: ${list}.`, notWorking: "Stängt / arbetar inte denna dag", taken: "upptagen", passed: "passerad",
      pickTime: "Välj en ledig tid.", saved: (ref) => `Bokningen sparades (${ref}).`, confirmationSent: " Bekräftelse skickas till patienten.",
      saveError: "Bokningen kunde inte sparas. Försök igen.",
      blockedDone: (n) => `Tiden är blockerad (${n} ${n === 1 ? "dag" : "dagar"}).`,
      conflicts: (n, list) => ` OBS: ${n} befintliga bokningar ligger i den tiden och är inte avbokade: ${list}.`,
      blockError: "Det gick inte att blockera tiden. Försök igen.",
      confirmUnblock: "Ta bort den blockerade tiden? Tiden blir bokningsbar igen.", unblocked: "Den blockerade tiden är borttagen.",
      unblockError: "Det gick inte att ta bort den blockerade tiden.",
      cancelSummary: (b) => `${b.name} – ${b.treatment}, ${b.date} kl. ${b.time} hos ${b.person} (${b.ref}).`,
      cancelledDone: (name, emailed) => `${name}s tid är avbokad.${emailed ? " Avbokningsmejl skickas." : ""} Tiden är bokningsbar igen.`,
      alreadyCancelled: "Bokningen är redan avbokad.", cancelError: "Det gick inte att avboka. Försök igen.",
      pageError: "Sidan kunde inte laddas. Kontrollera internetanslutningen och ladda om.",
      view: "Vy", treatments: "Behandlingar", newTreatmentBtn: "+ Ny behandling", newTreatment: "Ny behandling", editTreatment: "Ändra behandling",
      treatmentsHint: "Ändringar syns på webbplatsen inom en minut. Dolda behandlingar syns inte och kan inte bokas, men gamla bokningar finns kvar.",
      "f.tName": "Namn", "f.category": "Kategori", "f.duration": "Längd (minuter)", "f.price": "Pris (kr)", "f.campaignPrice": "Kampanjpris (kr)",
      "f.performedBy": "Utförs av", "f.description": "Beskrivning", "f.suitable": "Passar dig som",
      "f.spanish": "Spanska texter (valfritt)", spanishHint: "Tomt fält = den svenska texten visas på den spanska sidan.",
      "f.hidden": "Dölj på webbplatsen", saveTreatment: "Spara behandling", edit: "Ändra",
      tagHidden: "Dold", tagCampaign: (price) => `Kampanj ${price}`, nTreatments: (n) => `${n} ${n === 1 ? "behandling" : "behandlingar"}`,
      treatmentSaved: (name) => `”${name}” är sparad.`, treatmentError: "Behandlingen kunde inte sparas. Försök igen.",
      treatmentLabels: {
        name: "namn (2–80 tecken)", category: "kategori", duration: "längd (5–480 minuter)", price: "pris",
        campaignPrice: "kampanjpris (lägre än priset)", practitioners: "utförs av (minst en)", description: "beskrivning",
        suitable: "passar dig som", nameEs: "spanskt namn", descriptionEs: "spansk beskrivning", suitableEs: "spanskt ”passar dig som”",
      },
    },
    es: {
      days: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
      months: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
      dayMonth: (d, m) => `${d} de ${m}`,
      lang: "Idioma", logout: "Cerrar sesión", prevWeek: "Semana anterior", nextWeek: "Semana siguiente", thisWeek: "Esta semana",
      bookings: "Reservas", showPractitioner: "Mostrar profesional", allPractitioners: "Todos los profesionales", showCancelled: "Mostrar canceladas",
      newBookingBtn: "+ Nueva reserva", blockTime: "Bloquear horario", loading: "Cargando reservas…", newBooking: "Nueva reserva",
      "f.treatment": "Tratamiento", "f.practitioner": "Profesional", "f.date": "Fecha", "f.time": "Hora", "f.name": "Nombre",
      "f.phone": "Teléfono", "f.email": "Correo electrónico", optional: "(opcional)", "f.mailLang": "Idioma del correo", swedish: "Sueco", spanish: "Español",
      "f.message": "Mensaje / nota", "f.sendConfirmation": "Enviar confirmación al correo del paciente",
      cancel: "Cancelar", saveBooking: "Guardar reserva",
      blockHint: "El horario bloqueado no se puede reservar en la web, p. ej. vacaciones, enfermedad o almuerzo.",
      "f.appliesTo": "Aplica a", "f.fromDate": "Desde (fecha)", "f.toDate": "Hasta (incluido)", allDay: "Todo el día",
      "f.fromTime": "Desde las", "f.toTime": "Hasta las", "f.note": "Nota", "f.noteExample": "(p. ej. Vacaciones)", block: "Bloquear",
      cancelTitle: "¿Cancelar la cita?", notifyPatient: "Enviar correo de cancelación al paciente",
      noEmail: "El paciente no tiene correo electrónico: llámale para avisar.", keepBooking: "Mantener la cita", cancelBooking: "Cancelar cita",
      authTitle: "No has iniciado sesión o no tienes permiso.",
      authText: "Recarga la página e inicia sesión con tu correo electrónico. Si el problema continúa, contacta con quien administra la página.",
      week: "Semana", loadError: "No se pudieron cargar las reservas.", retry: "Reintentar", today: "Hoy",
      nBookings: (n) => `${n} ${n === 1 ? "reserva" : "reservas"}`, closed: "Cerrado", noBookings: "Sin reservas",
      noBookingsWeek: "No hay reservas esta semana.", bookedBy: (who) => `reservada por ${who}`, staff: "el personal", bookedWeb: "reservada en la web",
      tagPhone: "Teléfono", tagCancelled: "Cancelada", tagSpanish: "Español", cancelledBy: (who) => `cancelada por ${who}`,
      blocked: "Bloqueado", by: (who) => `por ${who}`, remove: "Eliminar", wholeClinic: "Toda la clínica",
      labels: { name: "nombre", phone: "teléfono (mín. 8 dígitos)", email: "correo", from: "fecha de inicio", to: "fecha final", start: "hora de inicio", end: "hora final", practitioner: "profesional" },
      slotTaken: "La hora ya está reservada o bloqueada. Elige otra hora.", slotPast: "La hora ya ha pasado.",
      slotClosed: "El profesional no trabaja ese día o la clínica está cerrada.", slotHours: "La hora está fuera del horario de apertura.",
      check: (list) => `Revisa: ${list}.`, notWorking: "Cerrado / no trabaja este día", taken: "ocupada", passed: "pasada",
      pickTime: "Elige una hora libre.", saved: (ref) => `Reserva guardada (${ref}).`, confirmationSent: " Se enviará la confirmación al paciente.",
      saveError: "No se pudo guardar la reserva. Inténtalo de nuevo.",
      blockedDone: (n) => `Horario bloqueado (${n} ${n === 1 ? "día" : "días"}).`,
      conflicts: (n, list) => ` Atención: ${n} reservas existentes están en ese horario y no se han cancelado: ${list}.`,
      blockError: "No se pudo bloquear el horario. Inténtalo de nuevo.",
      confirmUnblock: "¿Eliminar el bloqueo? El horario volverá a estar disponible.", unblocked: "Bloqueo eliminado.",
      unblockError: "No se pudo eliminar el bloqueo.",
      cancelSummary: (b) => `${b.name} – ${b.treatment}, ${b.date} a las ${b.time} con ${b.person} (${b.ref}).`,
      cancelledDone: (name, emailed) => `La cita de ${name} está cancelada.${emailed ? " Se enviará un correo de cancelación." : ""} El horario vuelve a estar disponible.`,
      alreadyCancelled: "La reserva ya está cancelada.", cancelError: "No se pudo cancelar. Inténtalo de nuevo.",
      pageError: "No se pudo cargar la página. Comprueba la conexión a internet y recarga.",
      view: "Vista", treatments: "Tratamientos", newTreatmentBtn: "+ Nuevo tratamiento", newTreatment: "Nuevo tratamiento", editTreatment: "Editar tratamiento",
      treatmentsHint: "Los cambios aparecen en la web en un minuto. Los tratamientos ocultos no se muestran ni se pueden reservar, pero las reservas antiguas se conservan.",
      "f.tName": "Nombre", "f.category": "Categoría", "f.duration": "Duración (minutos)", "f.price": "Precio (kr)", "f.campaignPrice": "Precio de campaña (kr)",
      "f.performedBy": "Lo realiza", "f.description": "Descripción", "f.suitable": "Indicado para",
      "f.spanish": "Textos en español (opcional)", spanishHint: "Campo vacío = en la página en español se muestra el texto sueco.",
      "f.hidden": "Ocultar en la web", saveTreatment: "Guardar tratamiento", edit: "Editar",
      tagHidden: "Oculto", tagCampaign: (price) => `Campaña ${price}`, nTreatments: (n) => `${n} ${n === 1 ? "tratamiento" : "tratamientos"}`,
      treatmentSaved: (name) => `«${name}» se ha guardado.`, treatmentError: "No se pudo guardar el tratamiento. Inténtalo de nuevo.",
      treatmentLabels: {
        name: "nombre (2–80 caracteres)", category: "categoría", duration: "duración (5–480 minutos)", price: "precio",
        campaignPrice: "precio de campaña (menor que el precio)", practitioners: "lo realiza (al menos uno)", description: "descripción",
        suitable: "indicado para", nameEs: "nombre en español", descriptionEs: "descripción en español", suitableEs: "«indicado para» en español",
      },
    },
  };
  const langKey = "mederinav-staff-lang";
  let lang = (() => {
    try { const saved = localStorage.getItem(langKey); if (TEXT[saved]) return saved; } catch (e) { /* ignore */ }
    return /^es\b/i.test(navigator.language) ? "es" : "sv";
  })();
  const L = () => TEXT[lang];
  const t = (key, ...args) => { const v = L()[key]; return typeof v === "function" ? v(...args) : v; };
  // Treatment / category names in the current language (Swedish is the default in data.js).
  const loc = (obj) => (lang !== "sv" && obj.es && obj.es.name) || obj.name;

  function applyStaticText() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-t]").forEach((el) => { el.textContent = t(el.dataset.t); });
    document.querySelectorAll("[data-t-attr]").forEach((el) => {
      el.dataset.tAttr.split(";").forEach((pair) => { const [attr, key] = pair.split(":"); el.setAttribute(attr, t(key)); });
    });
    document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  }

  /* ---------- Dates (local, as "YYYY-MM-DD") ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const monday = (d) => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7));
  const toMin = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  const hm = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const isoWeek = (d) => {
    const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    x.setUTCDate(x.getUTCDate() + 4 - (x.getUTCDay() || 7));
    return Math.ceil(((x - new Date(Date.UTC(x.getUTCFullYear(), 0, 1))) / 864e5 + 1) / 7);
  };
  const dayMonth = (d) => t("dayMonth", d.getDate(), L().months[d.getMonth()]);
  const longDate = (s) => { const d = parse(s); return `${L().days[d.getDay()]} ${dayMonth(d)}`; };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- State ---------- */
  let config = null;
  let week = monday(new Date());
  let data = { bookings: [], blocks: [] };
  let loaded = false;
  let cancelling = null;
  const filterKey = "mederinav-staff-filter";

  const personName = (id) => (config.team.find((p) => p.id === id) || { name: id || t("wholeClinic") }).name;
  const treatments = () => config.categories.flatMap((c) => c.items);
  const treatmentById = (id) => treatments().find((x) => x.id === id);

  /* ---------- API ---------- */
  async function api(path, options = {}) {
    const res = await fetch(API + path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      credentials: "same-origin",
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) throw Object.assign(new Error("unauthorized"), { status: 401, body });
    if (!res.ok) throw Object.assign(new Error(body.error || `HTTP ${res.status}`), { status: res.status, body });
    return body;
  }

  function setStatus(text, isError, id = "status") {
    const el = $(id);
    el.textContent = text || "";
    el.classList.toggle("is-error", !!isError);
  }

  function showAuthError() {
    $("days").innerHTML = `<div class="day"><p><strong>${esc(t("authTitle"))}</strong></p>
      <p class="empty">${esc(t("authText"))}</p></div>`;
    document.querySelectorAll(".toolbar button, .toolbar select, .toolbar input").forEach((el) => { el.disabled = true; });
  }

  /* ---------- Week view ---------- */
  function renderWeekLabel() {
    const end = addDays(week, 6);
    $("week-label").innerHTML = `${esc(t("week"))} ${isoWeek(week)}<small>${esc(dayMonth(week))} – ${esc(dayMonth(end))} ${end.getFullYear()}</small>`;
  }

  async function loadWeek() {
    const from = ymd(week);
    const to = ymd(addDays(week, 6));
    renderWeekLabel();
    try {
      data = await api(`/bookings?from=${from}&to=${to}`);
      loaded = true;
      render();
    } catch (err) {
      if (err.status === 401) return showAuthError();
      $("days").innerHTML = `<div class="day"><p class="empty">${esc(t("loadError"))}</p>
        <button class="btn" type="button" id="retry">${esc(t("retry"))}</button></div>`;
      $("retry").addEventListener("click", loadWeek);
    }
  }

  function render() {
    const filter = $("filter").value;
    const showCancelled = $("show-cancelled").checked;
    const today = ymd(new Date());
    const html = [];

    for (let i = 0; i < 7; i++) {
      const date = ymd(addDays(week, i));
      const dow = addDays(week, i).getDay();
      const bookings = data.bookings.filter((b) => b.date === date && (!filter || b.practitionerId === filter) && (showCancelled || b.status === "confirmed"));
      const blocks = data.blocks.filter((b) => b.date === date && (!filter || !b.practitionerId || b.practitionerId === filter));
      const confirmed = bookings.filter((b) => b.status === "confirmed").length;
      const closed = !config.hours[dow];
      if (closed && !bookings.length && !blocks.length) continue; // hide closed days without anything on them

      const items = [
        ...blocks.map((b) => ({ start: b.start, html: blockItem(b) })),
        ...bookings.map((b) => ({ start: b.start, html: bookingItem(b) })),
      ].sort((a, b) => a.start - b.start);

      html.push(`<section class="day${date === today ? " is-today" : ""}" aria-labelledby="d-${date}">
        <h2 id="d-${date}">${esc(cap(longDate(date)))}${date === today ? ` <span class="badge-today">${esc(t("today"))}</span>` : ""}
          <span class="count">${esc(confirmed ? t("nBookings", confirmed) : closed ? t("closed") : t("noBookings"))}</span></h2>
        ${items.length ? `<ul class="items">${items.map((it) => it.html).join("")}</ul>` : ""}
      </section>`);
    }
    $("days").innerHTML = html.join("") || `<div class="day"><p class="empty">${esc(t("noBookingsWeek"))}</p></div>`;
  }

  function bookingItem(b) {
    const tr = treatmentById(b.treatmentId);
    const cancelled = b.status !== "confirmed";
    const who = b.source === "phone" ? t("bookedBy", esc(b.createdBy || t("staff"))) : t("bookedWeb");
    const contact = [
      b.phone ? `<a href="tel:${esc(b.phone.replace(/[^\d+]/g, ""))}">${esc(b.phone)}</a>` : "",
      b.email ? `<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>` : "",
    ].filter(Boolean).join(" · ");
    return `<li class="item${cancelled ? " item--cancelled" : ""}">
      <div class="time">${hm(b.start)}<small>–${hm(b.end)}</small></div>
      <div class="body">
        <span><strong class="name">${esc(b.name)}</strong>${b.source === "phone" ? `<span class="tag">${esc(t("tagPhone"))}</span>` : ""}${cancelled ? `<span class="tag tag--cancelled">${esc(t("tagCancelled"))}</span>` : ""}${b.lang === "es" ? `<span class="tag">${esc(t("tagSpanish"))}</span>` : ""}</span>
        <span class="line">${esc(tr ? loc(tr) : b.treatmentId)} · ${esc(personName(b.practitionerId))}</span>
        ${contact ? `<span class="line">${contact}</span>` : ""}
        ${b.message ? `<span class="msg">”${esc(b.message)}”</span>` : ""}
        <span class="meta">${esc(b.reference)} · ${who}${cancelled && b.cancelledBy ? ` · ${t("cancelledBy", esc(b.cancelledBy))}` : ""}</span>
      </div>
      ${cancelled ? "" : `<button class="btn btn--small btn--danger-ghost" type="button" data-cancel="${esc(b.reference)}">${esc(t("cancelBooking"))}</button>`}
    </li>`;
  }

  function blockItem(b) {
    const allDay = b.start === 0 && b.end >= 1440;
    return `<li class="item item--block">
      <div class="time">${allDay ? esc(t("allDay")) : `${hm(b.start)}<small>–${hm(b.end)}</small>`}</div>
      <div class="body">
        <span><strong>${esc(t("blocked"))}</strong> · ${esc(personName(b.practitionerId))}</span>
        ${b.note ? `<span class="line">${esc(b.note)}</span>` : ""}
        ${b.createdBy ? `<span class="meta">${t("by", esc(b.createdBy))}</span>` : ""}
      </div>
      <button class="btn btn--small" type="button" data-delete-block="${b.id}">${esc(t("remove"))}</button>
    </li>`;
  }

  function fillFilter() {
    const keep = $("filter").value;
    $("filter").innerHTML = `<option value="">${esc(t("allPractitioners"))}</option>` + config.team.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
    $("filter").value = keep;
  }

  /* ---------- Dialog helpers ---------- */
  function openDialog(dlg) {
    dlg.querySelector(".form-error").textContent = "";
    dlg.showModal();
  }
  document.querySelectorAll("dialog").forEach((dlg) => {
    dlg.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]") || e.target === dlg) dlg.close();
    });
  });
  const errorText = (err, fallback, labels = L().labels) => {
    if (err.body && err.body.error === "slot_taken") return t("slotTaken");
    if (err.body && err.body.error === "invalid_slot") {
      const r = err.body.reason;
      return r === "past" ? t("slotPast") : r === "closed" ? t("slotClosed") : t("slotHours");
    }
    if (err.body && err.body.fields) return t("check", err.body.fields.map((f) => labels[f] || f).join(", "));
    return fallback;
  };

  /* ---------- New phone booking ---------- */
  const fb = $("form-booking");
  let dayData = { date: "", bookings: [], blocks: [] };

  function fillTreatments() {
    const keep = fb.treatment.value;
    // Hidden treatments can't be booked.
    fb.treatment.innerHTML = config.categories.map((c) => {
      const items = c.items.filter((x) => !x.hidden);
      return items.length ? `<optgroup label="${esc(loc(c))}">${items.map((x) => `<option value="${x.id}">${esc(loc(x))} (${x.duration} min)</option>`).join("")}</optgroup>` : "";
    }).join("");
    if (keep) fb.treatment.value = keep;
  }
  function fillPractitioners() {
    const tr = treatmentById(fb.treatment.value);
    const keep = fb.practitioner.value;
    fb.practitioner.innerHTML = config.team.filter((p) => !tr || tr.practitioners.includes(p.id))
      .map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
    if ([...fb.practitioner.options].some((o) => o.value === keep)) fb.practitioner.value = keep;
  }
  async function loadDay() {
    const date = fb.date.value;
    if (!date) return;
    if (dayData.date !== date) {
      try {
        const d = await api(`/bookings?from=${date}&to=${date}`);
        dayData = { date, bookings: d.bookings, blocks: d.blocks };
      } catch (err) {
        dayData = { date, bookings: [], blocks: [] };
      }
    }
    fillTimes();
  }
  function fillTimes() {
    const tr = treatmentById(fb.treatment.value);
    const pid = fb.practitioner.value;
    const date = fb.date.value;
    const keep = fb.time.value;
    if (!tr || !pid || !date) { fb.time.innerHTML = ""; return; }
    const d = parse(date);
    const hours = config.hours[d.getDay()];
    const person = config.team.find((p) => p.id === pid);
    if (!hours || !person.days.includes(d.getDay())) {
      fb.time.innerHTML = `<option value="">${esc(t("notWorking"))}</option>`;
      return;
    }
    const now = new Date();
    const isToday = date === ymd(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const busy = [
      ...dayData.bookings.filter((b) => b.status === "confirmed" && b.practitionerId === pid),
      ...dayData.blocks.filter((b) => !b.practitionerId || b.practitionerId === pid),
    ];
    const opts = [];
    for (let m = toMin(hours[0]); m + tr.duration <= toMin(hours[1]); m += config.slotMinutes) {
      const taken = busy.some((b) => b.start < m + tr.duration && b.end > m);
      const past = isToday && m < nowMin;
      const label = `${hm(m)}–${hm(m + tr.duration)}${taken ? ` (${t("taken")})` : past ? ` (${t("passed")})` : ""}`;
      opts.push(`<option value="${hm(m)}"${taken || past ? " disabled" : ""}>${esc(label)}</option>`);
    }
    fb.time.innerHTML = opts.join("");
    if ([...fb.time.options].some((o) => o.value === keep && !o.disabled)) fb.time.value = keep;
    else { const first = [...fb.time.options].find((o) => !o.disabled); fb.time.value = first ? first.value : ""; }
  }

  $("open-booking").addEventListener("click", () => {
    fb.reset();
    fb.lang.value = lang;
    fillTreatments();
    fillPractitioners();
    const filter = $("filter").value;
    if (filter && [...fb.practitioner.options].some((o) => o.value === filter)) fb.practitioner.value = filter;
    const today = new Date();
    fb.date.value = ymd(week <= today && today <= addDays(week, 6) ? today : week);
    dayData = { date: "", bookings: [], blocks: [] };
    loadDay();
    openDialog($("dlg-booking"));
  });
  fb.treatment.addEventListener("change", () => { fillPractitioners(); fillTimes(); });
  fb.practitioner.addEventListener("change", fillTimes);
  fb.date.addEventListener("change", loadDay);
  fb.email.addEventListener("input", () => { if (fb.email.value.trim()) fb.sendConfirmation.checked = true; });

  fb.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = fb.querySelector(".form-error");
    if (!fb.time.value) { err.textContent = t("pickTime"); return; }
    const btn = fb.querySelector("[type=submit]");
    btn.disabled = true;
    try {
      const res = await api("/bookings", {
        method: "POST",
        body: JSON.stringify({
          treatment: fb.treatment.value, practitioner: fb.practitioner.value, date: fb.date.value, time: fb.time.value,
          name: fb.name.value, phone: fb.phone.value, email: fb.email.value, message: fb.message.value,
          lang: fb.lang.value, sendConfirmation: fb.sendConfirmation.checked,
        }),
      });
      $("dlg-booking").close();
      setStatus(t("saved", res.reference) + (fb.sendConfirmation.checked && fb.email.value ? t("confirmationSent") : ""));
      week = monday(parse(fb.date.value));
      await loadWeek();
    } catch (ex) {
      if (ex.status === 401) { $("dlg-booking").close(); return showAuthError(); }
      err.textContent = errorText(ex, t("saveError"));
      if (ex.body && ex.body.error === "slot_taken") { dayData.date = ""; loadDay(); }
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- Block time ---------- */
  const fk = $("form-block");
  const syncAllDay = () => { fk.querySelector("[data-times]").hidden = fk.allDay.checked; };
  fk.allDay.addEventListener("change", syncAllDay);
  fk.from.addEventListener("change", () => { if (!fk.to.value || fk.to.value < fk.from.value) fk.to.value = fk.from.value; });

  function fillBlockPractitioners() {
    const keep = fk.practitioner.value;
    fk.practitioner.innerHTML = `<option value="">${esc(t("wholeClinic"))}</option>` + config.team.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
    fk.practitioner.value = keep;
  }

  $("open-block").addEventListener("click", () => {
    fk.reset();
    fillBlockPractitioners();
    if ($("filter").value) fk.practitioner.value = $("filter").value;
    fk.from.value = ymd(new Date() < week ? week : new Date());
    fk.to.value = fk.from.value;
    syncAllDay();
    openDialog($("dlg-block"));
  });

  fk.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = fk.querySelector("[type=submit]");
    btn.disabled = true;
    try {
      const res = await api("/blocks", {
        method: "POST",
        body: JSON.stringify({
          practitioner: fk.practitioner.value, from: fk.from.value, to: fk.to.value || fk.from.value,
          allDay: fk.allDay.checked, start: fk.start.value, end: fk.end.value, note: fk.note.value,
        }),
      });
      $("dlg-block").close();
      let msg = t("blockedDone", res.created);
      if (res.conflicts.length) {
        msg += t("conflicts", res.conflicts.length, res.conflicts.map((c) => `${c.name} ${c.date} ${hm(c.start)} (${c.reference})`).join(", "));
      }
      setStatus(msg, res.conflicts.length > 0);
      week = monday(parse(fk.from.value));
      await loadWeek();
    } catch (ex) {
      if (ex.status === 401) { $("dlg-block").close(); return showAuthError(); }
      fk.querySelector(".form-error").textContent = errorText(ex, t("blockError"));
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- Cancel / unblock (buttons in the list) ---------- */
  const fc = $("form-cancel");
  $("days").addEventListener("click", async (e) => {
    const cancelBtn = e.target.closest("[data-cancel]");
    if (cancelBtn) {
      cancelling = data.bookings.find((b) => b.reference === cancelBtn.dataset.cancel);
      if (!cancelling) return;
      const tr = treatmentById(cancelling.treatmentId);
      $("cancel-summary").textContent = t("cancelSummary", {
        name: cancelling.name, treatment: tr ? loc(tr) : "", date: longDate(cancelling.date),
        time: hm(cancelling.start), person: personName(cancelling.practitionerId), ref: cancelling.reference,
      });
      const hasEmail = !!cancelling.email;
      fc.querySelector("[data-notify]").hidden = !hasEmail;
      fc.querySelector("[data-no-email]").hidden = hasEmail;
      fc.notify.checked = hasEmail;
      openDialog($("dlg-cancel"));
      return;
    }
    const blockBtn = e.target.closest("[data-delete-block]");
    if (blockBtn) {
      if (!confirm(t("confirmUnblock"))) return;
      blockBtn.disabled = true;
      try {
        await api(`/blocks/${blockBtn.dataset.deleteBlock}`, { method: "DELETE" });
        setStatus(t("unblocked"));
        await loadWeek();
      } catch (ex) {
        if (ex.status === 401) return showAuthError();
        setStatus(t("unblockError"), true);
        blockBtn.disabled = false;
      }
    }
  });

  fc.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!cancelling) return;
    const btn = fc.querySelector("[type=submit]");
    btn.disabled = true;
    try {
      const res = await api(`/bookings/${cancelling.reference}/cancel`, { method: "POST", body: JSON.stringify({ notify: fc.notify.checked }) });
      $("dlg-cancel").close();
      setStatus(t("cancelledDone", cancelling.name, res.emailed));
      await loadWeek();
    } catch (ex) {
      if (ex.status === 401) { $("dlg-cancel").close(); return showAuthError(); }
      fc.querySelector(".form-error").textContent = ex.status === 409 ? t("alreadyCancelled") : t("cancelError");
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- Treatments (add / edit / hide) ---------- */
  const ft = $("form-treatment");
  let editing = null; // id of the treatment being edited, null = new
  const kr = (n) => `${new Intl.NumberFormat(lang === "es" ? "es-ES" : "sv-SE").format(n)} kr`;

  function renderTreatments() {
    $("treatment-list").innerHTML = config.categories.map((c) => `
      <section class="day" aria-labelledby="c-${esc(c.id)}">
        <h2 id="c-${esc(c.id)}">${esc(loc(c))} <span class="count">${esc(t("nTreatments", c.items.length))}</span></h2>
        ${c.items.length ? `<ul class="items">${c.items.map(treatmentItem).join("")}</ul>` : ""}
      </section>`).join("");
  }

  function treatmentItem(x) {
    return `<li class="item item--treatment${x.hidden ? " item--hidden" : ""}">
      <div class="time">${esc(kr(x.price))}<small>${x.duration} min</small></div>
      <div class="body">
        <span><strong class="name">${esc(loc(x))}</strong>${x.hidden ? `<span class="tag tag--cancelled">${esc(t("tagHidden"))}</span>` : ""}${x.campaignPrice != null ? `<span class="tag">${esc(t("tagCampaign", kr(x.campaignPrice)))}</span>` : ""}</span>
        <span class="line">${esc(x.practitioners.map(personName).join(", "))}</span>
      </div>
      <button class="btn btn--small" type="button" data-edit-treatment="${esc(x.id)}">${esc(t("edit"))}</button>
    </li>`;
  }

  function openTreatment(x) {
    editing = x ? x.id : null;
    ft.reset();
    $("dlg-treatment-title").textContent = t(x ? "editTreatment" : "newTreatment");
    ft.category.innerHTML = config.categories.map((c) => `<option value="${esc(c.id)}">${esc(loc(c))}</option>`).join("");
    $("treatment-practitioners").innerHTML = config.team.map((p) =>
      `<label class="check"><input type="checkbox" name="practitioners" value="${esc(p.id)}"> ${esc(p.name)}</label>`).join("");
    ft.querySelector("[data-edit-only]").hidden = !x;
    ft.querySelector("details").open = false;
    if (x) {
      const es = x.es || {};
      ft.name.value = x.name;
      ft.category.value = x.category;
      ft.duration.value = x.duration;
      ft.price.value = x.price;
      ft.campaignPrice.value = x.campaignPrice != null ? x.campaignPrice : "";
      ft.querySelectorAll("[name=practitioners]").forEach((cb) => { cb.checked = x.practitioners.includes(cb.value); });
      ft.description.value = x.description || "";
      ft.suitable.value = x.suitable || "";
      ft.nameEs.value = es.name || "";
      ft.descriptionEs.value = es.description || "";
      ft.suitableEs.value = es.suitable || "";
      ft.hidden.checked = !!x.hidden;
      ft.querySelector("details").open = !!(es.name || es.description || es.suitable);
    } else {
      ft.duration.value = 30;
      if (config.team.length === 1) ft.querySelector("[name=practitioners]").checked = true;
    }
    openDialog($("dlg-treatment"));
  }

  $("open-treatment").addEventListener("click", () => openTreatment(null));
  $("treatment-list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-edit-treatment]");
    if (btn) openTreatment(treatmentById(btn.dataset.editTreatment));
  });

  ft.addEventListener("submit", async (e) => {
    e.preventDefault();
    ft.querySelector(".form-error").textContent = "";
    const btn = ft.querySelector("[type=submit]");
    btn.disabled = true;
    try {
      const body = {
        name: ft.name.value, category: ft.category.value, duration: ft.duration.value, price: ft.price.value,
        campaignPrice: ft.campaignPrice.value,
        practitioners: [...ft.querySelectorAll("[name=practitioners]:checked")].map((cb) => cb.value),
        description: ft.description.value, suitable: ft.suitable.value,
        es: { name: ft.nameEs.value, description: ft.descriptionEs.value, suitable: ft.suitableEs.value },
        hidden: editing ? ft.hidden.checked : false,
      };
      const res = editing
        ? await api(`/treatments/${encodeURIComponent(editing)}`, { method: "PUT", body: JSON.stringify(body) })
        : await api("/treatments", { method: "POST", body: JSON.stringify(body) });
      $("dlg-treatment").close();
      config = await api("/config");
      renderTreatments();
      setStatus(t("treatmentSaved", res.treatment.name), false, "t-status");
    } catch (ex) {
      if (ex.status === 401) { $("dlg-treatment").close(); return showAuthError(); }
      ft.querySelector(".form-error").textContent = errorText(ex, t("treatmentError"), L().treatmentLabels);
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- Views: Bokningar | Behandlingar ---------- */
  const viewKey = "mederinav-staff-view";
  function showView(view) {
    $("view-bookings").hidden = view !== "bookings";
    $("view-treatments").hidden = view !== "treatments";
    document.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
    if (view === "treatments" && config) renderTreatments();
    try { localStorage.setItem(viewKey, view); } catch (e) { /* ignore */ }
  }
  document.querySelectorAll("[data-view]").forEach((btn) => btn.addEventListener("click", () => showView(btn.dataset.view)));

  /* ---------- Toolbar ---------- */
  $("prev").addEventListener("click", () => { week = addDays(week, -7); setStatus(""); loadWeek(); });
  $("next").addEventListener("click", () => { week = addDays(week, 7); setStatus(""); loadWeek(); });
  $("this-week").addEventListener("click", () => { week = monday(new Date()); setStatus(""); loadWeek(); });
  $("filter").addEventListener("change", () => { try { localStorage.setItem(filterKey, $("filter").value); } catch (e) { /* ignore */ } render(); });
  $("show-cancelled").addEventListener("change", render);

  // SV / ES switch: re-translate everything on the page without reloading.
  document.querySelectorAll("[data-lang]").forEach((btn) => btn.addEventListener("click", () => {
    if (btn.dataset.lang === lang) return;
    lang = btn.dataset.lang;
    try { localStorage.setItem(langKey, lang); } catch (e) { /* ignore */ }
    applyStaticText();
    setStatus("");
    setStatus("", false, "t-status");
    if (!config) return;
    fillFilter();
    renderWeekLabel();
    if (loaded) render();
    if (!$("view-treatments").hidden) renderTreatments();
    if ($("dlg-booking").open) { fillTreatments(); fillTimes(); }
    if ($("dlg-block").open) fillBlockPractitioners();
  }));

  /* ---------- Start ---------- */
  applyStaticText();
  (async function init() {
    try {
      const [me, cfg] = await Promise.all([api("/me"), api("/config")]);
      config = cfg;
      $("who").textContent = me.email;
      fillFilter();
      try { const saved = localStorage.getItem(filterKey); if (saved && config.team.some((p) => p.id === saved)) $("filter").value = saved; } catch (e) { /* ignore */ }
      try { if (localStorage.getItem(viewKey) === "treatments") showView("treatments"); } catch (e) { /* ignore */ }
      await loadWeek();
    } catch (err) {
      if (err.status === 401) return showAuthError();
      $("days").innerHTML = `<div class="day"><p class="empty">${esc(t("pageError"))}</p></div>`;
    }
  })();
})();
