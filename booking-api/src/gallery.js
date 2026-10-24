// Before & after gallery – stored in the database and edited on the staff page (Före & efter tab).
// The filter buttons a case can belong to are `gallery.categories` in assets/js/data.js.
import { DATA } from "./site-data.js";

const nowIso = () => new Date().toISOString().replace(/\.\d+Z$/, "Z");
const newVersion = () => Date.now().toString(36);
export const galleryCategories = () => ((DATA.gallery && DATA.gallery.categories) || []);

const COLUMNS = `id, sort, category, title, title_es, detail, detail_es, consent, visible, before_version, after_version`;

// Same shape for the staff page and the website: Spanish texts in `es`, empty ones left out
// so the website falls back to Swedish.
function rowToCase(r) {
  const es = {};
  if (r.title_es) es.title = r.title_es;
  if (r.detail_es) es.detail = r.detail_es;
  return {
    id: r.id, category: r.category, title: r.title, detail: r.detail, es,
    consent: !!r.consent, visible: !!r.visible,
    beforeVersion: r.before_version || null, afterVersion: r.after_version || null,
  };
}

/** All cases in website order. If the tables don't exist yet (migration not run), an empty list. */
export async function loadCases(env) {
  try {
    const { results } = await env.DB.prepare(`SELECT ${COLUMNS} FROM gallery_cases ORDER BY sort, id`).all();
    return results.map(rowToCase);
  } catch (err) {
    console.error("The gallery could not be read from the database:", err.message);
    return [];
  }
}

export async function findCase(env, id) {
  const row = await env.DB.prepare(`SELECT ${COLUMNS} FROM gallery_cases WHERE id = ?1`).bind(id).first();
  return row ? rowToCase(row) : null;
}

/** Whether the gallery section is switched on (off until staff switch it on). */
export async function galleryVisible(env) {
  try {
    const row = await env.DB.prepare(`SELECT value FROM settings WHERE key = 'gallery_visible'`).first();
    return !!row && row.value === "1";
  } catch {
    return false;
  }
}

export async function setGalleryVisible(env, visible, user) {
  await env.DB.prepare(
    `INSERT INTO settings (key, value, updated_at, updated_by) VALUES ('gallery_visible', ?1, ?2, ?3)
     ON CONFLICT (key) DO UPDATE SET value = ?1, updated_at = ?2, updated_by = ?3`
  ).bind(visible ? "1" : "0", nowIso(), user).run();
}

const imageStatement = (env, id, side, image) =>
  env.DB.prepare(`INSERT OR REPLACE INTO gallery_images (case_id, side, type, data) VALUES (?1, ?2, ?3, ?4)`)
    .bind(id, side, image.type, image.bytes);

/** Saves a new case last, with its pictures ({ before, after }: { type, bytes } or undefined). Returns the id. */
export async function insertCase(env, c, images, user) {
  const now = nowIso();
  const { max } = await env.DB.prepare(`SELECT COALESCE(MAX(sort), -1) AS max FROM gallery_cases`).first();
  const row = await env.DB.prepare(
    `INSERT INTO gallery_cases (sort, category, title, title_es, detail, detail_es, consent, visible,
                                before_version, after_version, created_at, updated_at, updated_by)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?11, ?12) RETURNING id`
  ).bind(max + 1, c.category, c.title, c.es.title, c.detail, c.es.detail, c.consent ? 1 : 0, c.visible ? 1 : 0,
    images.before ? newVersion() : null, images.after ? newVersion() : null, now, user).first();
  const statements = ["before", "after"].filter((side) => images[side]).map((side) => imageStatement(env, row.id, side, images[side]));
  if (statements.length) await env.DB.batch(statements);
  return row.id;
}

/** Updates texts and switches, and replaces the pictures that were sent. One batch. */
export async function updateCase(env, id, c, images, user) {
  const v = newVersion();
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE gallery_cases SET category = ?2, title = ?3, title_es = ?4, detail = ?5, detail_es = ?6,
              consent = ?7, visible = ?8,
              before_version = CASE WHEN ?9 THEN ?11 ELSE before_version END,
              after_version = CASE WHEN ?10 THEN ?11 ELSE after_version END,
              updated_at = ?12, updated_by = ?13
        WHERE id = ?1`
    ).bind(id, c.category, c.title, c.es.title, c.detail, c.es.detail, c.consent ? 1 : 0, c.visible ? 1 : 0,
      images.before ? 1 : 0, images.after ? 1 : 0, v, nowIso(), user),
    ...["before", "after"].filter((side) => images[side]).map((side) => imageStatement(env, id, side, images[side])),
  ]);
}

/** Deletes a case and its pictures for good (e.g. when a patient withdraws consent). */
export async function deleteCase(env, id) {
  const [, result] = await env.DB.batch([
    env.DB.prepare(`DELETE FROM gallery_images WHERE case_id = ?1`).bind(id),
    env.DB.prepare(`DELETE FROM gallery_cases WHERE id = ?1`).bind(id),
  ]);
  return result.meta.changes > 0;
}

/** Moves a case one step earlier (-1) or later (+1) on the website by swapping places with its neighbour. */
export async function moveCase(env, id, direction) {
  const cases = await loadCases(env);
  const i = cases.findIndex((c) => c.id === id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= cases.length) return false;
  // Renumber everything so equal sort values from older rows can't get in the way.
  const order = cases.map((c) => c.id);
  [order[i], order[j]] = [order[j], order[i]];
  await env.DB.batch(order.map((caseId, sort) =>
    env.DB.prepare(`UPDATE gallery_cases SET sort = ?2 WHERE id = ?1`).bind(caseId, sort)));
  return true;
}

export async function loadCaseImage(env, id, side) {
  const row = await env.DB.prepare(`SELECT type, data FROM gallery_images WHERE case_id = ?1 AND side = ?2`).bind(id, side).first();
  // D1 returns a BLOB as an ArrayBuffer or an array of numbers depending on the version – both work here.
  return row ? { type: row.type, bytes: new Uint8Array(row.data) } : null;
}

/** What the website gets: nothing unless the section is switched on, and only published cases. */
export async function publicGallery(env) {
  if (!(await galleryVisible(env))) return { visible: false, cases: [] };
  const cases = (await loadCases(env))
    .filter((c) => c.visible && c.consent && c.beforeVersion && c.afterVersion)
    .map((c) => ({
      id: c.id, category: c.category, title: c.title, detail: c.detail, es: c.es,
      before: `/gallery-image?id=${c.id}&side=before&v=${c.beforeVersion}`,
      after: `/gallery-image?id=${c.id}&side=after&v=${c.afterVersion}`,
    }));
  return { visible: cases.length > 0, cases };
}
