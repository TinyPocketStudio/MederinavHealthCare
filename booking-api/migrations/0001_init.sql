-- Mederinav booking database (Cloudflare D1 / SQLite)
-- Times are the clinic's local time (Europe/Stockholm): date = YYYY-MM-DD, *_min = minutes after midnight.

CREATE TABLE bookings (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  reference       TEXT    NOT NULL UNIQUE,             -- shown to the patient, e.g. MH-7KQ2XD
  treatment_id    TEXT    NOT NULL,                    -- id from assets/js/data.js
  practitioner_id TEXT    NOT NULL,                    -- team[].id from assets/js/data.js
  date            TEXT    NOT NULL,
  start_min       INTEGER NOT NULL,
  duration        INTEGER NOT NULL,
  status          TEXT    NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  source          TEXT    NOT NULL DEFAULT 'web'       CHECK (source IN ('web', 'phone')),
  name            TEXT    NOT NULL,
  phone           TEXT    NOT NULL,
  email           TEXT    NOT NULL DEFAULT '',
  message         TEXT    NOT NULL DEFAULT '',
  lang            TEXT    NOT NULL DEFAULT 'sv',
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  cancelled_at    TEXT
);
CREATE INDEX bookings_practitioner_date ON bookings (practitioner_id, date);
CREATE INDEX bookings_date ON bookings (date);

-- Time when nobody can be booked: vacation, sick days, lunch (managed from the staff page in stage 3).
CREATE TABLE blocks (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  practitioner_id TEXT,                                -- NULL = the whole clinic is closed
  date            TEXT    NOT NULL,
  start_min       INTEGER NOT NULL,
  end_min         INTEGER NOT NULL,
  note            TEXT    NOT NULL DEFAULT '',
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX blocks_date ON blocks (date);
