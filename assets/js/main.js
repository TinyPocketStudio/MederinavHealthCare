/* Mederinav Health Care – shared site behaviour */
(function () {
  "use strict";

  document.documentElement.classList.add("js");
  const DATA = window.MEDERINAV || {};
  const I18N = window.MederinavI18n; // assets/js/i18n.js
  const { t, loc } = I18N;

  /* ---------- Icon sprite (Lucide-style, 24px, stroke 2) ---------- */
  const ICONS = {
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    "chevron-left": '<path d="m15 18-6-6 6-6"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    "chevrons-lr": '<path d="m9 7-5 5 5 5"/><path d="m15 7 5 5-5 5"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    "map-pin": '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    train: '<path d="M8 3.1V7a4 4 0 0 0 8 0V3.1"/><path d="m9 15-1-1"/><path d="m15 15 1-1"/><path d="M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z"/><path d="m8 19-2 3"/><path d="m16 19 2 3"/>',
    bus: '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>',
    instagram: '<rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    cap: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  };

  const sprite = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  sprite.setAttribute("aria-hidden", "true");
  sprite.style.display = "none";
  sprite.innerHTML = Object.entries(ICONS)
    .map(([id, body]) => `<symbol id="i-${id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</symbol>`)
    .join("");
  document.body.prepend(sprite);

  const icon = (name, cls = "icon") => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

  /* ---------- Helpers shared with booking.js ---------- */
  const kr = (n) => `${new Intl.NumberFormat(I18N.locale).format(n)} kr`;
  const isCampaignActive = () => {
    const c = DATA.campaign;
    if (!c || !c.endDate) return false;
    return new Date() <= new Date(`${c.endDate}T23:59:59`);
  };
  const allTreatments = () =>
    (DATA.categories || []).flatMap((cat) => cat.items.map((item) => ({ ...item, category: cat })));
  const teamName = (id) => ((DATA.team || []).find((p) => p.id === id) || {}).name || id;
  const effectivePrice = (item) => (isCampaignActive() && item.campaignPrice ? item.campaignPrice : item.price);
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  window.MederinavUI = { icon, kr, isCampaignActive, allTreatments, teamName, effectivePrice, escapeHtml };

  /* ---------- Header: scroll state + mobile menu ---------- */
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (toggle && nav) {
    const isOpen = () => toggle.getAttribute("aria-expanded") === "true";
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", t(open ? "menu.close" : "menu.open"));
      nav.classList.toggle("is-open", open);
    };
    setOpen(false);
    I18N.onChange(() => setOpen(isOpen()));
    toggle.addEventListener("click", () => setOpen(!isOpen()));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 1101px)").addEventListener("change", (e) => { if (e.matches) setOpen(false); });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Opening hours table ---------- */
  function renderHours() {
    document.querySelectorAll("[data-hours]").forEach((table) => {
      const today = new Date().getDay();
      const order = [1, 2, 3, 4, 5, 6, 0];
      const days = t("days");
      table.innerHTML =
        `<caption class="visually-hidden">${t("hours.caption")}</caption><tbody>` +
        order
          .map((d) => {
            const h = DATA.hours ? DATA.hours[d] : null;
            return `<tr class="${d === today ? "is-today" : ""}"><th scope="row">${days[d]}${d === today ? ` <span class="visually-hidden">${t("hours.today")}</span>` : ""}</th><td>${h ? `${h[0]}–${h[1]}` : t("hours.closed")}</td></tr>`;
          })
          .join("") +
        `</tbody>`;
    });
  }

  /* ---------- "Från"-prices on category cards ---------- */
  function renderFromPrices() {
    document.querySelectorAll("[data-from]").forEach((el) => {
      const cat = (DATA.categories || []).find((c) => c.id === el.dataset.from);
      if (!cat) return;
      const min = Math.min(...cat.items.map(effectivePrice));
      el.textContent = t("price.from", { price: kr(min) });
    });
  }

  /* ---------- Campaign countdown ---------- */
  function renderCampaign() {
    document.querySelectorAll("[data-campaign]").forEach((box) => {
      const out = box.querySelector(".campaign-countdown");
      const endLabel = box.querySelector("[data-campaign-end]");
      const end = new Date(`${DATA.campaign.endDate}T23:59:59`);
      if (endLabel) {
        endLabel.textContent = end.toLocaleDateString(I18N.locale, { day: "numeric", month: "long" });
      }
      if (!out) return;
      const days = Math.ceil((end - new Date()) / 86400000);
      if (days < 0) {
        box.classList.add("is-ended");
        out.textContent = t("campaign.ended");
      } else if (days === 0) {
        out.textContent = t("campaign.lastDay");
      } else {
        out.textContent = t("campaign.daysLeft", { n: days });
      }
    });
  }

  /* ---------- Campaign offers (items with campaignPrice in data.js) ---------- */
  function renderOffers() {
    const offerList = document.querySelector("[data-render='campaign-offers']");
    if (!offerList) return;
    const offers = allTreatments().filter((it) => it.campaignPrice);
    offerList.innerHTML = offers
      .map((it) => `
        <li class="offer">
          <span class="offer-name">${escapeHtml(loc(it, "name"))}</span>
          <span class="offer-desc">${escapeHtml(loc(it.category, "name"))} · ${it.duration} min</span>
          <span class="offer-price"><del><span class="visually-hidden">${t("price.regular")}</span>${kr(it.price)}</del><strong><span class="visually-hidden">${t("price.campaign")}</span>${kr(it.campaignPrice)}</strong></span>
        </li>`)
      .join("");
    const maxPct = Math.max(0, ...offers.map((it) => Math.round((1 - it.campaignPrice / it.price) * 100)));
    document.querySelectorAll("[data-campaign-max]").forEach((el) => { el.textContent = `−${maxPct}%`; });
  }

  /* ---------- Before / after comparison ---------- */
  const baUpdaters = [];
  document.querySelectorAll(".ba-frame").forEach((frame) => {
    const range = frame.querySelector(".ba-range");
    if (!range) return;
    const update = () => {
      const v = Number(range.value);
      frame.style.setProperty("--pos", `${v}%`);
      range.setAttribute("aria-valuetext", t("gallery.valueText", { n: 100 - v }));
    };
    range.addEventListener("input", update);
    update();
    baUpdaters.push(update);
  });

  const filterBar = document.querySelector("[data-gallery-filter]");
  const galleryStatus = document.getElementById("gallery-status");
  if (filterBar) {
    const items = document.querySelectorAll(".ba[data-category]");
    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-filter]");
      if (!btn) return;
      filterBar.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      const f = btn.dataset.filter;
      let shown = 0;
      items.forEach((it) => {
        const match = f === "alla" || it.dataset.category === f;
        it.hidden = !match;
        if (match) shown++;
      });
      if (galleryStatus) galleryStatus.textContent = t("gallery.showing", { n: shown });
    });
  }

  /* ---------- Treatments page (accordion) ---------- */
  const tRoot = document.querySelector("[data-render='treatments']");
  function renderTreatments() {
    if (!tRoot || !DATA.categories) return;
    const campaign = isCampaignActive();
    const openIds = [...tRoot.querySelectorAll("details[open]")].map((d) => d.id);
    tRoot.innerHTML = DATA.categories
      .map(
        (cat) => `
      <section class="t-group" id="${cat.id}" aria-labelledby="h-${cat.id}">
        <div class="t-group-head">
          <img src="assets/images/treatment-${cat.id}.svg" alt="" width="64" height="64" loading="lazy">
          <div>
            <h2 id="h-${cat.id}">${escapeHtml(loc(cat, "name"))}</h2>
            <p>${escapeHtml(loc(cat, "intro"))}</p>
          </div>
        </div>
        <div class="t-list">
          ${cat.items
            .map((it) => {
              const onSale = campaign && it.campaignPrice;
              const name = loc(it, "name");
              return `
            <details class="t-item" id="${it.id}"${openIds.includes(it.id) ? " open" : ""}>
              <summary>
                <span class="t-name">${escapeHtml(name)}</span>
                ${onSale ? `<span class="badge">${escapeHtml(loc(DATA.campaign, "name"))}</span>` : ""}
                <span class="t-from">${kr(effectivePrice(it))}</span>
                <span class="t-plus" aria-hidden="true"></span>
              </summary>
              <div class="t-body">
                <p>${escapeHtml(loc(it, "description"))}</p>
                <p><strong>${t("treat.suitable")}</strong> ${escapeHtml(loc(it, "suitable"))}</p>
                <ul class="t-facts">
                  <li>${icon("clock")} ${it.duration} min</li>
                  <li>${icon("user")} ${it.practitioners.map(teamName).map(escapeHtml).join(", ")}</li>
                  <li>${icon("tag")} ${onSale ? `<del>${kr(it.price)}</del>&nbsp;${kr(it.campaignPrice)}` : kr(it.price)}</li>
                </ul>
                <a class="btn btn--primary" href="boka.html?behandling=${encodeURIComponent(it.id)}">${icon("calendar")} ${escapeHtml(t("treat.book", { name }))}</a>
              </div>
            </details>`;
            })
            .join("")}
        </div>
      </section>`
      )
      .join("");
  }
  if (tRoot) {
    const openFromHash = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      const el = id && document.getElementById(id);
      if (el && el.tagName === "DETAILS") el.open = true;
    };
    renderTreatments();
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
  }

  /* ---------- Price list page ---------- */
  const pRoot = document.querySelector("[data-render='prices']");
  function renderPrices() {
    if (!pRoot || !DATA.categories) return;
    const campaign = isCampaignActive();
    pRoot.innerHTML = DATA.categories
      .map(
        (cat) => `
      <section class="price-group" id="${cat.id}" aria-labelledby="p-${cat.id}">
        <h2 id="p-${cat.id}">${escapeHtml(loc(cat, "name"))}</h2>
        <table class="price-table">
          <caption class="visually-hidden">${escapeHtml(t("prices.caption", { cat: loc(cat, "name") }))}</caption>
          <tbody>
            ${cat.items
              .map((it) => {
                const onSale = campaign && it.campaignPrice;
                const name = loc(it, "name");
                return `<tr>
                  <th scope="row">${escapeHtml(name)} ${onSale ? `<span class="badge">${escapeHtml(loc(DATA.campaign, "name"))}</span>` : ""}<small>${it.duration} min</small></th>
                  <td>${onSale ? `<del><span class="visually-hidden">${t("price.regular")}</span>${kr(it.price)}</del><strong><span class="visually-hidden">${t("price.campaign")}</span>${kr(it.campaignPrice)}</strong>` : `<strong>${kr(it.price)}</strong>`}</td>
                  <td class="t-book"><a href="boka.html?behandling=${encodeURIComponent(it.id)}" aria-label="${escapeHtml(t("prices.bookLabel", { name }))}">${t("prices.book")}</a></td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </section>`
      )
      .join("");
  }

  /* ---------- Everything above that depends on the language ---------- */
  renderHours();
  renderFromPrices();
  renderCampaign();
  renderOffers();
  renderPrices();
  I18N.onChange(() => {
    renderHours();
    renderFromPrices();
    renderCampaign();
    renderOffers();
    renderTreatments();
    renderPrices();
    baUpdaters.forEach((update) => update());
    if (galleryStatus) galleryStatus.textContent = "";
  });

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
        }
      }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }
})();
