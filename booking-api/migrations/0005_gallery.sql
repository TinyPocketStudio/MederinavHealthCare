-- Before & after gallery, managed from the staff page (Före & efter tab).

-- One case = one before picture + one after picture with a caption.
CREATE TABLE gallery_cases (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  sort            INTEGER NOT NULL DEFAULT 0,          -- order on the website
  category        TEXT    NOT NULL,                    -- gallery.categories[].id in assets/js/data.js (filter buttons)
  title           TEXT    NOT NULL,                    -- e.g. "Läppförstoring, 1 ml"
  title_es        TEXT    NOT NULL DEFAULT '',
  detail          TEXT    NOT NULL DEFAULT '',         -- e.g. "Resultat 2 veckor efter behandling"
  detail_es       TEXT    NOT NULL DEFAULT '',
  consent         INTEGER NOT NULL DEFAULT 0,          -- 1 = staff confirmed the patient agreed to publication
  visible         INTEGER NOT NULL DEFAULT 0,          -- 1 = shown on the website (needs consent and both pictures)
  before_version  TEXT,                                -- NULL = no picture yet; changes with every upload
  after_version   TEXT,
  created_at      TEXT,
  updated_at      TEXT,
  updated_by      TEXT    NOT NULL DEFAULT ''
);

-- The pictures, kept apart so listing cases stays light. Deleted together with their case.
CREATE TABLE gallery_images (
  case_id         INTEGER NOT NULL,
  side            TEXT    NOT NULL CHECK (side IN ('before', 'after')),
  type            TEXT    NOT NULL,                    -- image/jpeg, image/png or image/webp
  data            BLOB    NOT NULL,
  PRIMARY KEY (case_id, side)
);

-- Small site-wide switches, e.g. gallery_visible = '1' shows the gallery section on the home page.
CREATE TABLE settings (
  key             TEXT    PRIMARY KEY,
  value           TEXT    NOT NULL,
  updated_at      TEXT,
  updated_by      TEXT    NOT NULL DEFAULT ''
);
