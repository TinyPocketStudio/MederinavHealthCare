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

/** Updates every field except id and sort. Returns false if the id doesn't exist. */
export async function updateTreatment(env, t, user) {
  const v = itemToValues(t, 0);
  const result = await env.DB.prepare(
    `UPDATE treatments SET category_id = ?2, name = ?3, name_es = ?4, duration = ?5, price = ?6,
            campaign_price = ?7, practitioners = ?8, description = ?9, description_es = ?10,
            suitable = ?11, suitable_es = ?12, hidden = ?13, updated_at = ?14, updated_by = ?15
      WHERE id = ?1`
  ).bind(v[0], v[1], v[3], v[4], v[5], v[6], v[7], v[8], v[9], v[10], v[11], v[12], v[13], nowIso(), user).run();
  return result.meta.changes > 0;
}
