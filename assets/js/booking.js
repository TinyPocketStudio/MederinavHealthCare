/*
 * Mederinav Health Care – veckobaserad onlinebokning
 * ------------------------------------------------------------
 * DEMO-LÄGE: lediga tider simuleras i `isTaken()` och bokningar sparas
 * bara i besökarens webbläsare (localStorage) via `submitBooking()`.
 * Koppla dessa två funktioner till ert riktiga bokningssystem/API
 * innan sidan används skarpt.
 */
(function () {
  "use strict";

  const D = window.MEDERINAV;
  const UI = window.MederinavUI;
  const I18N = window.MederinavI18n;
  if (!D || !UI || !I18N || !document.getElementById("week-grid")) return;

  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "mederinav-bookings";
  const tr = I18N.t; // `t` is used below for the current treatment
  const loc = I18N.loc;

  /* ---------- Date helpers ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseYmd = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const startOfWeek = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const isoWeek = (d) => {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - y0) / 86400000 + 1) / 7);
  };
  const longDate = (d) => tr("date.long", { dow: tr("daysLower")[d.getDay()], day: d.getDate(), month: tr("months")[d.getMonth()] });
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- Availability (DEMO) ---------- */
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function loadBookings() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { return []; }
  }
  function storeBooking(b) {
    try { const all = loadBookings(); all.push(b); localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch (e) { /* storage unavailable */ }
  }

  // Byt ut mot ett anrop till ert bokningssystem.
  function isTaken(dateStr, time, pid, duration, stored) {
    const start = toMin(time);
    const end = start + duration;
    const clash = stored.some((b) => b.date === dateStr && b.practitioner === pid &&
      toMin(b.time) < end && toMin(b.time) + b.duration > start);
    if (clash) return true;
    for (let m = start; m < end; m += 30) {
      if (hash(`${dateStr}|${fromMin(m - (m % 30))}|${pid}`) % 100 < 36) return true;
    }
    return false;
  }

  // Byt ut mot ett POST-anrop till ert bokningssystem. Ska returnera en Promise.
  function submitBooking(payload) {
    return new Promise((resolve) => {
      setTimeout(() => {
        storeBooking({ date: payload.date, time: payload.time, practitioner: payload.practitioner, duration: payload.duration });
        resolve({ reference: `MH-${Date.now().toString(36).slice(-5).toUpperCase()}` });
      }, 900);
    });
  }

  /* ---------- State ---------- */
  const treatments = UI.allTreatments();
  const today = new Date();
  const firstWeek = startOfWeek(today);
  const lastWeek = addDays(firstWeek, 7 * (D.bookingWeeksAhead - 1));
  const state = {
    treatment: null,
    practitioner: "any",
    weekStart: firstWeek,
    slot: null,      // { date, time, practitioner }
    activeDay: null, // yyyy-mm-dd (mobile day tabs)
  };

  const els = {
    treatment: $("treatment"),
    practitioner: $("practitioner"),
    weekLabel: $("week-label"),
    prev: $("week-prev"),
    next: $("week-next"),
    todayBtn: $("week-today"),
    tabs: $("day-tabs"),
    grid: $("week-grid"),
    details: $("details-panel"),
    confirm: $("confirm-panel"),
    form: $("booking-form"),
    errorSummary: $("error-summary"),
    submit: $("submit-btn"),
    steps: document.querySelectorAll("#steps li"),
  };

  /* ---------- Selects ---------- */
  function fillTreatmentSelect() {
    const opts = [`<option value="">${tr("book.chooseTreatment")}</option>`];
    D.categories.forEach((cat) => {
      opts.push(`<optgroup label="${UI.escapeHtml(loc(cat, "name"))}">`);
      cat.items.forEach((t) => {
        opts.push(`<option value="${t.id}">${UI.escapeHtml(loc(t, "name"))} · ${t.duration} min · ${UI.kr(UI.effectivePrice(t))}</option>`);
      });
      opts.push("</optgroup>");
    });
    els.treatment.innerHTML = opts.join("");
    els.treatment.value = state.treatment || "";
  }

  function fillPractitionerSelect() {
    const t = currentTreatment();
    const eligible = D.team.filter((p) => !t || t.practitioners.includes(p.id));
    if (state.practitioner !== "any" && !eligible.some((p) => p.id === state.practitioner)) state.practitioner = "any";
    els.practitioner.innerHTML =
      `<option value="any">${tr("book.firstAvailable")}</option>` +
      eligible.map((p) => `<option value="${p.id}">${UI.escapeHtml(p.name)} – ${UI.escapeHtml(loc(p, "role"))}</option>`).join("");
    els.practitioner.value = state.practitioner;
  }

  const currentTreatment = () => treatments.find((t) => t.id === state.treatment) || null;

  /* ---------- Slot generation ---------- */
  function daySlots(date) {
    const t = currentTreatment();
    const dow = date.getDay();
    const hours = D.hours[dow];
    const dateStr = ymd(date);
    if (!hours) return { status: "closed", slots: [] };
    if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return { status: "past", slots: [] };
    const pids = (t ? t.practitioners : [])
      .filter((id) => state.practitioner === "any" || id === state.practitioner)
      .filter((id) => (D.team.find((p) => p.id === id) || { days: [] }).days.includes(dow));
    if (!pids.length) return { status: "unstaffed", slots: [] };

    const stored = loadBookings();
    const earliest = new Date(Date.now() + D.minNoticeHours * 3600000);
    const open = toMin(hours[0]);
    const close = toMin(hours[1]);
    const slots = [];
    for (let m = open; m + t.duration <= close; m += D.slotMinutes) {
      const time = fromMin(m);
      const at = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(m / 60), m % 60);
      if (at < earliest) continue;
      const pid = pids.find((id) => !isTaken(dateStr, time, id, t.duration, stored));
      if (pid) slots.push({ time, practitioner: pid });
    }
    return { status: slots.length ? "open" : "full", slots };
  }

  /* ---------- Rendering ---------- */
  function renderWeek() {
    const ws = state.weekStart;
    const we = addDays(ws, 6);
    const sameMonth = ws.getMonth() === we.getMonth();
    const months = tr(sameMonth ? "months" : "monthsShort");
    const range = tr("date.range", { d1: ws.getDate(), d2: we.getDate(), m1: months[ws.getMonth()], m2: months[we.getMonth()], year: we.getFullYear() });
    els.weekLabel.innerHTML = `${tr("book.week", { n: isoWeek(ws) })}<small>${range}</small>`;
    els.prev.disabled = ws <= firstWeek;
    els.next.disabled = ws >= lastWeek;
    els.todayBtn.disabled = ws.getTime() === firstWeek.getTime();

    if (!currentTreatment()) {
      els.tabs.innerHTML = "";
      els.grid.innerHTML = `<div class="empty-week" style="grid-column: 1 / -1;">
        <p>${tr("book.emptyPick")}</p></div>`;
      return;
    }

    const days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(ws, i);
      return { date, key: ymd(date), ...daySlots(date) };
    });

    const totalFree = days.reduce((n, d) => n + d.slots.length, 0);
    if (!days.some((d) => d.key === state.activeDay)) {
      const firstOpen = days.find((d) => d.slots.length);
      state.activeDay = (firstOpen || days.find((d) => d.key === ymd(today)) || days[0]).key;
    }

    // Mobile day tabs
    const dowShort = tr("daysShort");
    els.tabs.innerHTML = days.map((d) => {
      const n = d.slots.length;
      const label = tr("book.dayLabel", { date: cap(longDate(d.date)), n });
      return `<button type="button" class="day-tab${n ? "" : " is-none"}" data-day="${d.key}" aria-pressed="${d.key === state.activeDay}" aria-label="${label}">
        <span class="dow">${dowShort[d.date.getDay()]}</span>
        <span class="dnum">${d.date.getDate()}</span>
        <span class="dfree">${n ? tr("book.dayFree", { n }) : "–"}</span>
      </button>`;
    }).join("");

    if (!totalFree) {
      const canNext = ws < lastWeek;
      els.grid.innerHTML = `<div class="empty-week" style="grid-column: 1 / -1;">
        <p>${tr("book.noTimes", { week: isoWeek(ws) })}</p>
        ${canNext ? `<button type="button" class="btn btn--primary" data-action="next-week">${tr("book.showNextWeek")}</button>` : ""}</div>`;
      return;
    }

    const todayKey = ymd(today);
    els.grid.innerHTML = days.map((d) => {
      const cls = ["day-col", d.key === todayKey ? "is-today" : "", d.key === state.activeDay ? "is-active" : ""].join(" ");
      const head = `<div class="day-head"><span class="dow">${dowShort[d.date.getDay()]}</span><span class="dnum">${d.date.getDate()}</span></div>`;
      const body = d.slots.length
        ? `<ul class="slot-list" aria-label="${tr("book.slotsLabel", { date: longDate(d.date) })}">${d.slots.map((s) => {
            const sel = state.slot && state.slot.date === d.key && state.slot.time === s.time;
            return `<li><button type="button" class="slot" data-date="${d.key}" data-time="${s.time}" data-pid="${s.practitioner}" aria-pressed="${!!sel}" aria-label="${tr("book.slotLabel", { date: cap(longDate(d.date)), time: s.time })}">${s.time}</button></li>`;
          }).join("")}</ul>`
        : `<p class="day-empty">${tr(`book.status.${d.status}`)}</p>`;
      return `<div class="${cls}" data-day="${d.key}">${head}${body}</div>`;
    }).join("");
  }

  function setStep(n, allDone) {
    els.steps.forEach((li) => {
      const s = Number(li.dataset.step);
      li.classList.toggle("is-done", allDone || s < n);
      li.classList.toggle("is-current", !allDone && s === n);
      if (!allDone && s === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
  }

  function setSummary(id, value) {
    const el = $(id);
    el.textContent = value || (id === "sum-price" ? "–" : tr("book.notChosen"));
    el.classList.toggle("is-empty", !value);
  }

  function renderSummary() {
    const t = currentTreatment();
    setSummary("sum-treatment", t ? `${loc(t, "name")} (${t.duration} min)` : "");
    let who = "";
    if (state.slot) who = UI.teamName(state.slot.practitioner);
    else if (t) who = state.practitioner === "any" ? tr("book.firstAvailable") : UI.teamName(state.practitioner);
    setSummary("sum-practitioner", who);
    if (state.slot) {
      const d = parseYmd(state.slot.date);
      setSummary("sum-date", `${cap(longDate(d))} (${tr("book.weekShort", { n: isoWeek(d) })})`);
      setSummary("sum-time", `${state.slot.time}–${fromMin(toMin(state.slot.time) + t.duration)}`);
    } else {
      setSummary("sum-date", "");
      setSummary("sum-time", "");
    }
    setSummary("sum-price", t ? UI.kr(UI.effectivePrice(t)) : "");
    setStep(!t ? 1 : !state.slot ? 2 : 3);
  }

  function refresh() {
    renderWeek();
    renderSummary();
    els.details.hidden = !state.slot;
  }

  /* ---------- Events ---------- */
  els.treatment.addEventListener("change", () => {
    state.treatment = els.treatment.value || null;
    state.slot = null;
    fillPractitionerSelect();
    refresh();
  });
  els.practitioner.addEventListener("change", () => {
    state.practitioner = els.practitioner.value;
    state.slot = null;
    refresh();
  });

  const goWeek = (ws) => { state.weekStart = ws; state.activeDay = null; renderWeek(); };
  els.prev.addEventListener("click", () => goWeek(addDays(state.weekStart, -7)));
  els.next.addEventListener("click", () => goWeek(addDays(state.weekStart, 7)));
  els.todayBtn.addEventListener("click", () => goWeek(firstWeek));
  els.grid.addEventListener("click", (e) => {
    if (e.target.closest("[data-action='next-week']")) { goWeek(addDays(state.weekStart, 7)); els.next.focus(); return; }
    const btn = e.target.closest(".slot");
    if (!btn || btn.disabled) return;
    state.slot = { date: btn.dataset.date, time: btn.dataset.time, practitioner: btn.dataset.pid };
    els.grid.querySelectorAll(".slot[aria-pressed='true']").forEach((b) => b.setAttribute("aria-pressed", "false"));
    btn.setAttribute("aria-pressed", "true");
    renderSummary();
    els.details.hidden = false;
    if (window.matchMedia("(max-width: 1099px)").matches) {
      $("b-step3").focus({ preventScroll: true });
      els.details.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }
  });
  els.tabs.addEventListener("click", (e) => {
    const tab = e.target.closest(".day-tab");
    if (!tab) return;
    state.activeDay = tab.dataset.day;
    els.tabs.querySelectorAll(".day-tab").forEach((b) => b.setAttribute("aria-pressed", String(b === tab)));
    els.grid.querySelectorAll(".day-col").forEach((c) => c.classList.toggle("is-active", c.dataset.day === state.activeDay));
  });

  /* ---------- Form validation ---------- */
  const fields = {
    name: { el: $("f-name"), check: (v) => (v.trim().split(/\s+/).length >= 2 ? "" : tr(v.trim() ? "book.err.nameBoth" : "book.err.name")) },
    phone: { el: $("f-phone"), check: (v) => ((v.match(/\d/g) || []).length >= 8 ? "" : tr(v.trim() ? "book.err.phoneShort" : "book.err.phone")) },
    email: { el: $("f-email"), check: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : tr(v.trim() ? "book.err.emailFormat" : "book.err.email")) },
    consent: { el: $("f-consent"), check: (_, el) => (el.checked ? "" : tr("book.err.consent")) },
  };

  // What the error summary currently shows, so it can be redrawn in another language.
  let summaryState = null; // { errors: [keys] } | { failed: true } | null
  let lastConfirmation = null;

  function renderErrorSummary() {
    if (!summaryState) { els.errorSummary.hidden = true; return; }
    if (summaryState.failed) {
      els.errorSummary.innerHTML = `<h3>${tr("book.failTitle")}</h3><p>${tr("book.failText", { phone: D.clinic.phoneDisplay })}</p>`;
    } else {
      const errors = summaryState.errors
        .map((k) => [k, fields[k].check(fields[k].el.value, fields[k].el)])
        .filter(([, msg]) => msg);
      if (!errors.length) { summaryState = null; els.errorSummary.hidden = true; return; }
      els.errorSummary.innerHTML = `<h3>${tr("book.err.summary", { n: errors.length })}</h3>
        <ul>${errors.map(([k, msg]) => `<li><a href="#${fields[k].el.id}">${tr(`book.label.${k}`)}: ${msg}</a></li>`).join("")}</ul>`;
    }
    els.errorSummary.hidden = false;
  }

  function renderConfirmation() {
    const c = lastConfirmation;
    if (!c) return;
    const t = treatments.find((x) => x.id === c.treatment);
    $("confirm-title").textContent = tr("book.thanksName", { name: c.first });
    $("confirm-text").textContent = tr("book.confirmText", {
      treatment: loc(t, "name"),
      who: UI.teamName(c.practitioner),
      date: longDate(parseYmd(c.date)),
      time: c.time,
      email: c.email,
    });
    $("confirm-ref").textContent = tr("book.ref", { ref: c.reference });
  }

  function validateField(key) {
    const f = fields[key];
    const msg = f.check(f.el.value, f.el);
    const wrap = els.form.querySelector(`[data-field="${key}"]`);
    wrap.classList.toggle("has-error", !!msg);
    f.el.setAttribute("aria-invalid", String(!!msg));
    $(`e-${key}`).innerHTML = msg ? `${UI.icon("alert", "icon icon--sm")} ${msg}` : "";
    return msg;
  }

  Object.keys(fields).forEach((key) => {
    const el = fields[key].el;
    el.addEventListener(key === "consent" ? "change" : "blur", () => {
      if (key === "consent" || el.value.trim() || el.dataset.touched) validateField(key);
      el.dataset.touched = "1";
    });
    el.addEventListener("input", () => {
      if (el.getAttribute("aria-invalid") === "true") validateField(key);
    });
  });

  els.form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errors = Object.keys(fields).filter((k) => validateField(k));
    if (errors.length) {
      summaryState = { errors };
      renderErrorSummary();
      els.errorSummary.focus();
      return;
    }
    summaryState = null;
    renderErrorSummary();
    if (!state.slot) return;

    const t = currentTreatment();
    els.submit.disabled = true;
    els.submit.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${tr("book.sending")}`;
    try {
      const res = await submitBooking({
        treatment: t.id,
        practitioner: state.slot.practitioner,
        date: state.slot.date,
        time: state.slot.time,
        duration: t.duration,
        name: fields.name.el.value.trim(),
        phone: fields.phone.el.value.trim(),
        email: fields.email.el.value.trim(),
        message: $("f-message").value.trim(),
      });
      lastConfirmation = {
        treatment: t.id,
        practitioner: state.slot.practitioner,
        date: state.slot.date,
        time: state.slot.time,
        first: fields.name.el.value.trim().split(/\s+/)[0],
        email: fields.email.el.value.trim(),
        reference: res.reference,
      };
      renderConfirmation();
      els.details.hidden = true;
      els.confirm.hidden = false;
      setStep(3, true);
      $("confirm-title").focus();
    } catch (err) {
      summaryState = { failed: true };
      renderErrorSummary();
      els.errorSummary.focus();
    } finally {
      els.submit.disabled = false;
      els.submit.textContent = tr("book.submit");
    }
  });

  els.errorSummary.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#']");
    if (!a) return;
    e.preventDefault();
    const target = document.getElementById(a.getAttribute("href").slice(1));
    if (target) target.focus();
  });

  $("book-again").addEventListener("click", () => {
    els.form.reset();
    Object.keys(fields).forEach((k) => { delete fields[k].el.dataset.touched; });
    state.slot = null;
    lastConfirmation = null;
    els.confirm.hidden = true;
    refresh();
    els.treatment.focus();
  });

  /* ---------- Language switch: redraw without losing the visitor's choices ---------- */
  I18N.onChange(() => {
    fillTreatmentSelect();
    fillPractitionerSelect();
    renderWeek();
    renderSummary();
    if (!els.confirm.hidden) { setStep(3, true); renderConfirmation(); }
    Object.keys(fields).forEach((k) => { if (fields[k].el.getAttribute("aria-invalid") === "true") validateField(k); });
    if (!els.errorSummary.hidden) renderErrorSummary();
    if (!els.submit.disabled) els.submit.textContent = tr("book.submit");
  });

  /* ---------- Init (supports ?behandling=… and ?behandlare=…) ---------- */
  const params = new URLSearchParams(location.search);
  const wantT = params.get("behandling");
  const wantP = params.get("behandlare");
  if (wantT && treatments.some((t) => t.id === wantT)) state.treatment = wantT;
  else if (wantP) {
    const firstForP = treatments.find((t) => t.practitioners.includes(wantP));
    if (firstForP) state.treatment = firstForP.id;
  }
  if (wantP && D.team.some((p) => p.id === wantP)) state.practitioner = wantP;
  fillTreatmentSelect();
  fillPractitionerSelect();
  els.submit.textContent = tr("book.submit");
  $("confirm-title").textContent = tr("book.thanks");
  refresh();
})();
