-- Treatments, managed from the staff page (Behandlingar tab).
-- Filled automatically from assets/js/data.js the first time the table is empty (see src/catalog.js).
-- Treatments are never deleted, only hidden: old bookings keep pointing at their id.

CREATE TABLE treatments (
  id              TEXT    PRIMARY KEY,                 -- used in links (/boka?behandling=…) and bookings.treatment_id
  category_id     TEXT    NOT NULL,                    -- categories[].id in assets/js/data.js
  sort            INTEGER NOT NULL DEFAULT 0,          -- order within the category
  name            TEXT    NOT NULL,
  name_es         TEXT    NOT NULL DEFAULT '',
  duration        INTEGER NOT NULL,                    -- minutes
  price           INTEGER NOT NULL,                    -- kronor
  campaign_price  INTEGER,                             -- NULL = not part of the campaign
  practitioners   TEXT    NOT NULL,                    -- JSON array of team[].id
  description     TEXT    NOT NULL DEFAULT '',
  description_es  TEXT    NOT NULL DEFAULT '',
  suitable        TEXT    NOT NULL DEFAULT '',
  suitable_es     TEXT    NOT NULL DEFAULT '',
  hidden          INTEGER NOT NULL DEFAULT 0,          -- 1 = not shown or bookable on the website
  updated_at      TEXT,
  updated_by      TEXT    NOT NULL DEFAULT ''
);
CREATE INDEX treatments_category ON treatments (category_id, sort);
