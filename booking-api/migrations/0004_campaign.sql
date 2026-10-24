-- The seasonal campaign, managed from the staff page (Kampanj tab).
-- One row (id = 1), filled from `campaign` in assets/js/data.js the first time (see src/catalog.js).
-- Campaign prices are treatments.campaign_price; the campaign tab edits them.

CREATE TABLE campaign (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  name            TEXT    NOT NULL,                    -- e.g. "Höstkampanj": badge and start of the headline
  name_es         TEXT    NOT NULL DEFAULT '',
  title           TEXT    NOT NULL DEFAULT '',         -- rest of the headline, shown in italics
  title_es        TEXT    NOT NULL DEFAULT '',
  description     TEXT    NOT NULL DEFAULT '',
  description_es  TEXT    NOT NULL DEFAULT '',
  start_date      TEXT    NOT NULL DEFAULT '',         -- YYYY-MM-DD, '' = already started
  end_date        TEXT    NOT NULL,                    -- YYYY-MM-DD, last day of the campaign
  image_version   TEXT,                                -- NULL = the default picture in assets/images/
  updated_at      TEXT,
  updated_by      TEXT    NOT NULL DEFAULT ''
);

-- The uploaded picture, kept apart so the campaign row stays small.
CREATE TABLE campaign_image (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  type            TEXT    NOT NULL,                    -- image/jpeg, image/png or image/webp
  data            BLOB    NOT NULL
);
