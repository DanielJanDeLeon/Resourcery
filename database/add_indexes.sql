-- Run this once against the live database to add performance indexes
-- docker exec resourcery_db psql -U user -d resourcery_db -f /dev/stdin < resourcery/database/add_indexes.sql

CREATE INDEX IF NOT EXISTS idx_bookings_resource_id     ON bookings (resource_id);
CREATE INDEX IF NOT EXISTS idx_bookings_username         ON bookings (username);
CREATE INDEX IF NOT EXISTS idx_bookings_status           ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_date             ON bookings (date);
CREATE INDEX IF NOT EXISTS idx_bookings_resource_status  ON bookings (resource_id, status);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient   ON notifications (recipient);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read     ON notifications (recipient, is_read);

CREATE INDEX IF NOT EXISTS idx_resources_status          ON resources (status);
CREATE INDEX IF NOT EXISTS idx_resources_type            ON resources (type);
