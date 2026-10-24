// Treatments – stored in the database and edited on the staff page (Behandlingar tab).
// Categories (names, intros, images) still come from assets/js/data.js.
//
// The first time the table is empty it is filled from data.js. If the database can't be
// read (e.g. migration 0003 not run yet), data.js is used so bookings keep working.
import { DATA } from "./site-data.js";

const COLUMNS = `id, category_id, sort, name, name_es, duration, price, campaign_price, practitioners,
                 description, description_es, suitable, suitable_es, hidden`;

// Database row → the same shape as a treatment in data.js. Empty Spanish fields are left
// out so the website and emails fall back to the Swedish text.
function rowToItem(r) {
  const es = {};
  if (r.name_es) es.name = r.name_es;
  if (r.description_es) es.description = r.description_es;
  if (r.suitable_es) es.suitable = r.suitable_es;
  const item = {
    id: r.id,
    category: r.category_id,
    name: r.name,
    duration: r.duration,
    price: r.price,
    practitioners: JSON.parse(r.practitioners || "[]"),
    description: r.description,
    suitable: r.suitable,
    es,
  };
  if (r.campaign_price != null) item.campaignPrice = r.campaign_price;
  if (r.hidden) item.hidden = true;
  return item;
}

// A treatment (data.js shape, plus `category`) → the values for INSERT, in COLUMNS order.
function itemToValues(t, sort) {
  const es = t.es || {};
  return [
    t.id, t.category, sort, t.name, es.name || "", t.duration, t.price,
    t.campaignPrice == null ? null : t.campaignPrice, JSON.stringify(t.practitioners),
    t.description || "", es.description || "", t.suitable || "", es.suitable || "", t.hidden ? 1 : 0,
  ];
}

const dataJsItems = () =>
  DATA.categories.flatMap((cat) => cat.items.map((t) => ({ ...t, category: cat.id })));

const nowIso = () => new Date().toISOString().replace(/\.\d+Z$/, "Z");
const insertSql = (verb) => `${verb} INTO treatments (${COLUMNS}, updated_at, updated_by)
  VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)`;

// OR IGNORE: two requests seeding at the same moment can't clash.
async function seed(env) {
  const now = nowIso();
  await env.DB.batch(dataJsItems().map((t, i) =>
    env.DB.prepare(insertSql("INSERT OR IGNORE")).bind(...itemToValues(t, i), now, "")));
}

/** All treatments as a flat list (data.js shape plus `category` and `hidden`). */
export async function loadTreatments(env, { includeHidden = false } = {}) {
  try {
    let { results } = await env.DB.prepare(`SELECT ${COLUMNS} FROM treatments ORDER BY sort, id`).all();
    if (!results.length) {
      await seed(env);
      ({ results } = await env.DB.prepare(`SELECT ${COLUMNS} FROM treatments ORDER BY sort, id`).all());
    }
    const items = results.map(rowToItem);
    return includeHidden ? items : items.filter((t) => !t.hidden);
  } catch (err) {
    console.error("Treatments could not be read from the database – using data.js:", err.message);
    return dataJsItems();
  }
}

/** The categories from data.js, each with its treatments from the database. */
export async function loadCatalog(env, options) {
  const items = await loadTreatments(env, options);
  return DATA.categories.map((cat) => ({ ...cat, items: items.filter((t) => t.category === cat.id) }));
}

/** One treatment, hidden ones included (e.g. for emails about old bookings). */
export async function findTreatment(env, id) {
  return (await loadTreatments(env, { includeHidden: true })).find((t) => t.id === id) || null;
}

/** A readable, unique id from the Swedish name: "Fotvård – bas" → "fotvard-bas". */
export function slugId(name, takenIds) {
  const base = name.toLowerCase()
    .replace(/[åä]/g, "a").replace(/ö/g, "o")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 48) || "behandling";
  let id = base;
  for (let n = 2; takenIds.includes(id); n++) id = `${base}-${n}`;
  return id;
}

/** Saves a new treatment last in its category. */
export async function insertTreatment(env, t, user) {
  const { max } = await env.DB.prepare(`SELECT COALESCE(MAX(sort), -1) AS max FROM treatments`).first();
  await env.DB.prepare(insertSql("INSERT")).bind(...itemToValues(t, max + 1), nowIso(), user).run();
}

/**
 * Updates every field except id, sort and the campaign price (set on the Kampanj tab).
 * A campaign price that is no longer below the new price is removed.
 * Returns false if the id doesn't exist.
 */
export async function updateTreatment(env, t, user) {
  const v = itemToValues(t, 0);
  const result = await env.DB.prepare(
    `UPDATE treatments SET category_id = ?2, name = ?3, name_es = ?4, duration = ?5, price = ?6,
            campaign_price = CASE WHEN campaign_price < ?6 THEN campaign_price END,
            practitioners = ?7, description = ?8, description_es = ?9,
            suitable = ?10, suitable_es = ?11, hidden = ?12, updated_at = ?13, updated_by = ?14
      WHERE id = ?1`
  ).bind(v[0], v[1], v[3], v[4], v[5], v[6], v[8], v[9], v[10], v[11], v[12], v[13], nowIso(), user).run();
  return result.meta.changes > 0;
}

/* ---------- Campaign (one row) ---------- */
const CAMPAIGN_COLUMNS = `name, name_es, title, title_es, description, description_es, start_date, end_date, image_version`;

// Same shape as `campaign` in data.js, plus imageVersion (null = the default picture).
function rowToCampaign(r) {
  const es = {};
  if (r.name_es) es.name = r.name_es;
  if (r.title_es) es.title = r.title_es;
  if (r.description_es) es.description = r.description_es;
  return {
    name: r.name, title: r.title, description: r.description,
    startDate: r.start_date, endDate: r.end_date, imageVersion: r.image_version || null, es,
  };
}

const dataJsCampaign = () => ({
  title: "", description: "", startDate: "", ...DATA.campaign, imageVersion: null, es: { ...(DATA.campaign.es || {}) },
});

/** The campaign. Filled from data.js the first time; data.js is used if the database can't be read. */
export async function loadCampaign(env) {
  try {
    const select = env.DB.prepare(`SELECT ${CAMPAIGN_COLUMNS} FROM campaign WHERE id = 1`);
    let row = await select.first();
    if (!row) {
      const c = dataJsCampaign();
      await env.DB.prepare(
        `INSERT OR IGNORE INTO campaign (id, name, name_es, title, title_es, description, description_es, start_date, end_date, updated_at)
         VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
      ).bind(c.name, c.es.name || "", c.title, c.es.title || "", c.description, c.es.description || "",
        c.startDate, c.endDate, nowIso()).run();
      row = await select.first();
    }
    return rowToCampaign(row);
  } catch (err) {
    console.error("The campaign could not be read from the database – using data.js:", err.message);
    return dataJsCampaign();
  }
}

/** True on the campaign's days (dates as YYYY-MM-DD in the clinic's time zone). */
export const campaignActive = (c, today) => !!c && !!c.endDate && (!c.startDate || c.startDate <= today) && today <= c.endDate;

/**
 * Saves the campaign texts and dates, and the campaign prices: `prices` is { treatmentId: price },
 * every treatment not in it loses its campaign price. One batch, so it all saves or nothing does.
 */
export async function saveCampaign(env, c, prices, user) {
  await loadCampaign(env); // makes sure the row exists
  const now = nowIso();
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE campaign SET name = ?1, name_es = ?2, title = ?3, title_es = ?4, description = ?5, description_es = ?6,
              start_date = ?7, end_date = ?8, updated_at = ?9, updated_by = ?10 WHERE id = 1`
    ).bind(c.name, c.es.name, c.title, c.es.title, c.description, c.es.description, c.startDate, c.endDate, now, user),
    env.DB.prepare(`UPDATE treatments SET campaign_price = NULL WHERE campaign_price IS NOT NULL`),
    ...Object.entries(prices).map(([id, price]) =>
      env.DB.prepare(`UPDATE treatments SET campaign_price = ?2, updated_at = ?3, updated_by = ?4 WHERE id = ?1`)
        .bind(id, price, now, user)),
  ]);
}

/** Stores an uploaded campaign picture (bytes already checked by the caller). Returns its new version. */
export async function saveCampaignImage(env, type, bytes, user) {
  await loadCampaign(env);
  const version = Date.now().toString(36);
  await env.DB.batch([
    env.DB.prepare(`INSERT OR REPLACE INTO campaign_image (id, type, data) VALUES (1, ?1, ?2)`).bind(type, bytes),
    env.DB.prepare(`UPDATE campaign SET image_version = ?1, updated_at = ?2, updated_by = ?3 WHERE id = 1`).bind(version, nowIso(), user),
  ]);
  return version;
}

/** Goes back to the default picture. */
export async function deleteCampaignImage(env, user) {
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM campaign_image WHERE id = 1`),
    env.DB.prepare(`UPDATE campaign SET image_version = NULL, updated_at = ?1, updated_by = ?2 WHERE id = 1`).bind(nowIso(), user),
  ]);
}

/** The uploaded picture as { type, bytes }, or null. */
export async function loadCampaignImage(env) {
  const row = await env.DB.prepare(`SELECT type, data FROM campaign_image WHERE id = 1`).first();
  // D1 returns a BLOB as an ArrayBuffer or an array of numbers depending on the version – both work here.
  return row ? { type: row.type, bytes: new Uint8Array(row.data) } : null;
}
