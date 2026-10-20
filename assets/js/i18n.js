/*
 * Mederinav Health Care – language switching (Swedish / Spanish)
 * ------------------------------------------------------------
 * Swedish is the source language and stays in the HTML. Elements marked with
 *   data-i18n="key"                    → innerHTML is swapped
 *   data-i18n-attr="alt:key;aria-label:key2" → attributes are swapped
 * get their translation from assets/js/translations.js. A missing key simply
 * falls back to the Swedish text, so the page never breaks.
 *
 * Text built by JavaScript uses MederinavI18n.t("key", { vars }), and content in
 * data.js uses MederinavI18n.loc(item, "name"), which reads item.es.name.
 *
 * The chosen language is remembered (localStorage) and shown in the URL as
 * ?lang=es, so a Spanish link can be shared.
 */
(function () {
  "use strict";

  const DICT = window.MEDERINAV_I18N || {};
  const LOCALES = { sv: "sv-SE", es: "es-ES" };
  const DEFAULT = "sv";
  const STORAGE_KEY = "mederinav-lang";

  const valid = (l) => (l && Object.prototype.hasOwnProperty.call(LOCALES, l) ? l : null);

  function detect() {
    const fromUrl = valid(new URLSearchParams(location.search).get("lang"));
    if (fromUrl) {
      try { localStorage.setItem(STORAGE_KEY, fromUrl); } catch (e) { /* storage unavailable */ }
      return fromUrl;
    }
    let stored = null;
    try { stored = valid(localStorage.getItem(STORAGE_KEY)); } catch (e) { /* storage unavailable */ }
    if (stored) return stored;
    return /^es\b/i.test(navigator.language || "") ? "es" : DEFAULT;
  }

  let lang = detect();
  let translated = false;
  const originals = new WeakMap();
  const warned = new Set();

  function warnMissing(key) {
    if (warned.has(key)) return;
    warned.add(key);
    console.warn(`[i18n] Missing "${lang}" translation for "${key}" – showing Swedish.`);
  }

  /* ---------- Lookups ---------- */
  function lookup(key) {
    const own = DICT[lang] || {};
    if (key in own) return own[key];
    const base = DICT[DEFAULT] || {};
    if (key in base) return base[key];
    warnMissing(key);
    return undefined;
  }

  // t("key") → string; values may contain {placeholders} or be functions of vars.
  function t(key, vars) {
    const v = lookup(key);
    if (v === undefined) return key;
    if (typeof v === "function") return v(vars || {});
    if (typeof v === "string" && vars) return v.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return v;
  }

  // loc(item, "name") → item.es.name when Spanish is active, else item.name.
  function loc(obj, field) {
    if (!obj) return "";
    const tr = obj[lang];
    return tr && tr[field] != null ? tr[field] : obj[field];
  }

  /* ---------- Static HTML ---------- */
  function memo(el) {
    let o = originals.get(el);
    if (!o) { o = { html: undefined, attrs: {} }; originals.set(el, o); }
    return o;
  }

  function apply() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-set-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.setLang === lang)));
    if (lang === DEFAULT && !translated) return; // Page is already in Swedish.
    translated = true;
    const d = lang === DEFAULT ? {} : DICT[lang] || {};

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const o = memo(el);
      if (o.html === undefined) o.html = el.innerHTML;
      const key = el.dataset.i18n;
      const v = d[key];
      if (v === undefined && lang !== DEFAULT) warnMissing(key);
      el.innerHTML = v === undefined ? o.html : v;
    });

    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const o = memo(el);
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s && s.trim());
        if (!attr || !key) return;
        if (!(attr in o.attrs)) o.attrs[attr] = el.getAttribute(attr);
        const v = d[key];
        if (v === undefined && lang !== DEFAULT) warnMissing(key);
        el.setAttribute(attr, v === undefined ? o.attrs[attr] : v);
      });
    });
  }

  /* ---------- URL ---------- */
  function withLang(href) {
    const url = new URL(href, location.href);
    if (lang === DEFAULT) url.searchParams.delete("lang");
    else url.searchParams.set("lang", lang);
    return url;
  }

  function syncUrl() {
    try { history.replaceState(history.state, "", withLang(location.href)); } catch (e) { /* e.g. file:// */ }
  }

  // Carry the language over to internal links at click time (also covers links rendered later by JS).
  function onLinkClick(e) {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    const raw = a.getAttribute("href");
    if (!raw || raw.startsWith("#") || /^(mailto|tel):/i.test(raw)) return;
    const url = new URL(a.href, location.href);
    // Our pages: "/", "/boka", "/om-oss" … (and old-style "/boka.html"). Not files like images or PDFs.
    const isPage = /(\/|\.html)$/.test(url.pathname) || !/\.[a-z0-9]+$/i.test(url.pathname);
    if (url.origin !== location.origin || !isPage) return;
    a.href = withLang(url.href).href;
  }

  /* ---------- Switching ---------- */
  function setLang(next) {
    next = valid(next);
    if (!next || next === lang) return;
    lang = next;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* storage unavailable */ }
    syncUrl();
    apply();
    document.dispatchEvent(new CustomEvent("mederinav:langchange", { detail: { lang } }));
  }

  function onChange(fn) {
    document.addEventListener("mederinav:langchange", () => fn(lang));
  }

  window.MederinavI18n = {
    get lang() { return lang; },
    get locale() { return LOCALES[lang]; },
    t,
    loc,
    setLang,
    onChange,
  };

  /* ---------- Init (script is deferred, so the DOM is ready) ---------- */
  apply();
  syncUrl();
  document.addEventListener("click", (e) => {
    const btn = e.target.closest && e.target.closest("[data-set-lang]");
    if (btn) setLang(btn.dataset.setLang);
    else onLinkClick(e);
  }, true);
  document.documentElement.classList.remove("i18n-pending");
})();
