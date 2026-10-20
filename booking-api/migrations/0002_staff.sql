-- Staff page (stage 3): remember which staff member created or cancelled something.
-- Web bookings keep created_by = '' (the patient booked themselves).
ALTER TABLE bookings ADD COLUMN created_by TEXT NOT NULL DEFAULT '';
ALTER TABLE bookings ADD COLUMN cancelled_by TEXT NOT NULL DEFAULT '';
ALTER TABLE blocks ADD COLUMN created_by TEXT NOT NULL DEFAULT '';
