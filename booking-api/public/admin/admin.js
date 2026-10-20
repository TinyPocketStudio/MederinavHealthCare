/* Mederinav – staff page. Talks to /admin/api/* (booking-api/src/admin.js). */
(function () {
  "use strict";

  const API = "/admin/api";
  const $ = (id) => document.getElementById(id);
  const DAYS = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
  const MONTHS = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];

  /* ---------- Dates (local, as "YYYY-MM-DD") ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const monday = (d) => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7));
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const hm = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const isoWeek = (d) => {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
    return Math.ceil(((t - new Date(Date.UTC(t.getUTCFullYear(), 0, 1))) / 864e5 + 1) / 7);
  };
  const longDate = (s) => { const d = parse(s); return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- State ---------- */
  let config = null;
  let week = monday(new Date());
  let data = { bookings: [], blocks: [] };
  let cancelling = null;
  const filterKey = "mederinav-staff-filter";

  const personName = (id) => (config.team.find((p) => p.id === id) || { name: id || "Hela kliniken" }).name;
  const treatments = () => config.categories.flatMap((c) => c.items);
  const treatmentById = (id) => treatments().find((t) => t.id === id);

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

  function setStatus(text, isError) {
    const el = $("status");
    el.textContent = text || "";
    el.classList.toggle("is-error", !!isError);
  }

  function showAuthError() {
    $("days").innerHTML = `<div class="day"><p><strong>Du är inte inloggad eller har inte behörighet.</strong></p>
      <p class="empty">Ladda om sidan och logga in med din e-postadress. Hör av dig till den som administrerar sidan om problemet kvarstår.</p></div>`;
    document.querySelectorAll(".toolbar button, .toolbar select, .toolbar input").forEach((el) => { el.disabled = true; });
  }

  /* ---------- Week view ---------- */
  async function loadWeek() {
    const from = ymd(week);
    const to = ymd(addDays(week, 6));
    const end = addDays(week, 6);
    $("week-label").innerHTML = `Vecka ${isoWeek(week)}<small>${week.getDate()} ${MONTHS[week.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}</small>`;
    try {
      data = await api(`/bookings?from=${from}&to=${to}`);
      render();
    } catch (err) {
      if (err.status === 401) return showAuthError();
      $("days").innerHTML = `<div class="day"><p class="empty">Det gick inte att hämta bokningarna.</p>
        <button class="btn" type="button" id="retry">Försök igen</button></div>`;
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
        <h2 id="d-${date}">${cap(longDate(date))}${date === today ? ' <span class="badge-today">Idag</span>' : ""}
          <span class="count">${confirmed ? `${confirmed} ${confirmed === 1 ? "bokning" : "bokningar"}` : closed ? "Stängt" : "Inga bokningar"}</span></h2>
        ${items.length ? `<ul class="items">${items.map((it) => it.html).join("")}</ul>` : ""}
      </section>`);
    }
    $("days").innerHTML = html.join("") || `<div class="day"><p class="empty">Inga bokningar den här veckan.</p></div>`;
  }

  function bookingItem(b) {
    const t = treatmentById(b.treatmentId);
    const cancelled = b.status !== "confirmed";
    const who = b.source === "phone" ? `bokad av ${esc(b.createdBy || "personal")}` : "bokad via webben";
    const contact = [
      b.phone ? `<a href="tel:${esc(b.phone.replace(/[^\d+]/g, ""))}">${esc(b.phone)}</a>` : "",
      b.email ? `<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>` : "",
    ].filter(Boolean).join(" · ");
    return `<li class="item${cancelled ? " item--cancelled" : ""}">
      <div class="time">${hm(b.start)}<small>–${hm(b.end)}</small></div>
      <div class="body">
        <span><strong class="name">${esc(b.name)}</strong>${b.source === "phone" ? '<span class="tag">Telefon</span>' : ""}${cancelled ? '<span class="tag tag--cancelled">Avbokad</span>' : ""}${b.lang === "es" ? '<span class="tag">Spanska</span>' : ""}</span>
        <span class="line">${esc(t ? t.name : b.treatmentId)} · ${esc(personName(b.practitionerId))}</span>
        ${contact ? `<span class="line">${contact}</span>` : ""}
        ${b.message ? `<span class="msg">”${esc(b.message)}”</span>` : ""}
        <span class="meta">${esc(b.reference)} · ${who}${cancelled && b.cancelledBy ? ` · avbokad av ${esc(b.cancelledBy)}` : ""}</span>
      </div>
      ${cancelled ? "" : `<button class="btn btn--small btn--danger-ghost" type="button" data-cancel="${esc(b.reference)}">Avboka</button>`}
    </li>`;
  }

  function blockItem(b) {
    const allDay = b.start === 0 && b.end >= 1440;
    return `<li class="item item--block">
      <div class="time">${allDay ? "Hela dagen" : `${hm(b.start)}<small>–${hm(b.end)}</small>`}</div>
      <div class="body">
        <span><strong>Blockerad</strong> · ${esc(personName(b.practitionerId))}</span>
        ${b.note ? `<span class="line">${esc(b.note)}</span>` : ""}
        ${b.createdBy ? `<span class="meta">av ${esc(b.createdBy)}</span>` : ""}
      </div>
      <button class="btn btn--small" type="button" data-delete-block="${b.id}">Ta bort</button>
    </li>`;
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
  const errorText = (err, fallback) => {
    const labels = { name: "namn", phone: "telefon (minst 8 siffror)", email: "e-post", from: "från-datum", to: "till-datum", start: "från-tid", end: "till-tid", practitioner: "behandlare" };
    if (err.body && err.body.error === "slot_taken") return "Tiden är redan bokad eller blockerad. Välj en annan tid.";
    if (err.body && err.body.error === "invalid_slot") {
      const r = err.body.reason;
      return r === "past" ? "Tiden har redan passerat." : r === "closed" ? "Behandlaren arbetar inte den dagen, eller kliniken är stängd." : "Tiden ligger utanför öppettiderna.";
    }
    if (err.body && err.body.fields) return `Kontrollera: ${err.body.fields.map((f) => labels[f] || f).join(", ")}.`;
    return fallback;
  };

  /* ---------- New phone booking ---------- */
  const fb = $("form-booking");
  let dayData = { date: "", bookings: [], blocks: [] };

  function fillTreatments() {
    fb.treatment.innerHTML = config.categories.map((c) =>
      `<optgroup label="${esc(c.name)}">${c.items.map((t) => `<option value="${t.id}">${esc(t.name)} (${t.duration} min)</option>`).join("")}</optgroup>`).join("");
  }
  function fillPractitioners() {
    const t = treatmentById(fb.treatment.value);
    const keep = fb.practitioner.value;
    fb.practitioner.innerHTML = config.team.filter((p) => !t || t.practitioners.includes(p.id))
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
    const t = treatmentById(fb.treatment.value);
    const pid = fb.practitioner.value;
    const date = fb.date.value;
    const keep = fb.time.value;
    if (!t || !pid || !date) { fb.time.innerHTML = ""; return; }
    const d = parse(date);
    const hours = config.hours[d.getDay()];
    const person = config.team.find((p) => p.id === pid);
    if (!hours || !person.days.includes(d.getDay())) {
      fb.time.innerHTML = `<option value="">Stängt / arbetar inte denna dag</option>`;
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
    for (let m = toMin(hours[0]); m + t.duration <= toMin(hours[1]); m += config.slotMinutes) {
      const taken = busy.some((b) => b.start < m + t.duration && b.end > m);
      const past = isToday && m < nowMin;
      const label = `${hm(m)}–${hm(m + t.duration)}${taken ? " (upptagen)" : past ? " (passerad)" : ""}`;
      opts.push(`<option value="${hm(m)}"${taken || past ? " disabled" : ""}>${label}</option>`);
    }
    fb.time.innerHTML = opts.join("");
    if ([...fb.time.options].some((o) => o.value === keep && !o.disabled)) fb.time.value = keep;
    else { const first = [...fb.time.options].find((o) => !o.disabled); fb.time.value = first ? first.value : ""; }
  }

  $("open-booking").addEventListener("click", () => {
    fb.reset();
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
    if (!fb.time.value) { err.textContent = "Välj en ledig tid."; return; }
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
      setStatus(`Bokningen sparades (${res.reference}).${fb.sendConfirmation.checked && fb.email.value ? " Bekräftelse skickas till patienten." : ""}`);
      week = monday(parse(fb.date.value));
      await loadWeek();
    } catch (ex) {
      if (ex.status === 401) { $("dlg-booking").close(); return showAuthError(); }
      err.textContent = errorText(ex, "Bokningen kunde inte sparas. Försök igen.");
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

  $("open-block").addEventListener("click", () => {
    fk.reset();
    fk.practitioner.innerHTML = `<option value="">Hela kliniken</option>` + config.team.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
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
      let msg = `Tiden är blockerad (${res.created} ${res.created === 1 ? "dag" : "dagar"}).`;
      if (res.conflicts.length) {
        msg += ` OBS: ${res.conflicts.length} befintliga bokningar ligger i den tiden och är inte avbokade: `
          + res.conflicts.map((c) => `${c.name} ${c.date} ${hm(c.start)} (${c.reference})`).join(", ") + ".";
      }
      setStatus(msg, res.conflicts.length > 0);
      week = monday(parse(fk.from.value));
      await loadWeek();
    } catch (ex) {
      if (ex.status === 401) { $("dlg-block").close(); return showAuthError(); }
      fk.querySelector(".form-error").textContent = errorText(ex, "Det gick inte att blockera tiden. Försök igen.");
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
      const t = treatmentById(cancelling.treatmentId);
      $("cancel-summary").textContent = `${cancelling.name} – ${t ? t.name : ""}, ${longDate(cancelling.date)} kl. ${hm(cancelling.start)} hos ${personName(cancelling.practitionerId)} (${cancelling.reference}).`;
      const hasEmail = !!cancelling.email;
      fc.querySelector("[data-notify]").hidden = !hasEmail;
      fc.querySelector("[data-no-email]").hidden = hasEmail;
      fc.notify.checked = hasEmail;
      openDialog($("dlg-cancel"));
      return;
    }
    const blockBtn = e.target.closest("[data-delete-block]");
    if (blockBtn) {
      if (!confirm("Ta bort den blockerade tiden? Tiden blir bokningsbar igen.")) return;
      blockBtn.disabled = true;
      try {
        await api(`/blocks/${blockBtn.dataset.deleteBlock}`, { method: "DELETE" });
        setStatus("Den blockerade tiden är borttagen.");
        await loadWeek();
      } catch (ex) {
        if (ex.status === 401) return showAuthError();
        setStatus("Det gick inte att ta bort den blockerade tiden.", true);
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
      setStatus(`${cancelling.name}s tid är avbokad.${res.emailed ? " Avbokningsmejl skickas." : ""} Tiden är bokningsbar igen.`);
      await loadWeek();
    } catch (ex) {
      if (ex.status === 401) { $("dlg-cancel").close(); return showAuthError(); }
      fc.querySelector(".form-error").textContent = ex.status === 409 ? "Bokningen är redan avbokad." : "Det gick inte att avboka. Försök igen.";
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- Toolbar ---------- */
  $("prev").addEventListener("click", () => { week = addDays(week, -7); setStatus(""); loadWeek(); });
  $("next").addEventListener("click", () => { week = addDays(week, 7); setStatus(""); loadWeek(); });
  $("this-week").addEventListener("click", () => { week = monday(new Date()); setStatus(""); loadWeek(); });
  $("filter").addEventListener("change", () => { try { localStorage.setItem(filterKey, $("filter").value); } catch (e) { /* ignore */ } render(); });
  $("show-cancelled").addEventListener("change", render);

  /* ---------- Start ---------- */
  (async function init() {
    try {
      const [me, cfg] = await Promise.all([api("/me"), api("/config")]);
      config = cfg;
      $("who").textContent = me.email;
      $("filter").innerHTML = `<option value="">Alla behandlare</option>` + config.team.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
      try { const saved = localStorage.getItem(filterKey); if (saved && config.team.some((p) => p.id === saved)) $("filter").value = saved; } catch (e) { /* ignore */ }
      await loadWeek();
    } catch (err) {
      if (err.status === 401) return showAuthError();
      $("days").innerHTML = `<div class="day"><p class="empty">Sidan kunde inte laddas. Kontrollera internetanslutningen och ladda om.</p></div>`;
    }
  })();
})();
