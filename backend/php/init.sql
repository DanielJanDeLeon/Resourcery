-- Resources table and seed data
-- This file is run once by Postgres on first container start

CREATE TABLE IF NOT EXISTS resources (
    id        SERIAL PRIMARY KEY,
    name      VARCHAR(120) NOT NULL,
    type      VARCHAR(80)  NOT NULL,
    description TEXT DEFAULT NULL,
    availability_schedule VARCHAR(255) DEFAULT NULL,
    status    VARCHAR(30)  NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed sample resources (idempotent: only insert if table is empty)
INSERT INTO resources (name, type, availability_schedule, status)
SELECT * FROM (VALUES
    ('Main Conference Room', 'Room', 'Mon-Fri 8am-6pm', 'available'),
    ('Projector A', 'Equipment', 'Mon-Fri 8am-8pm', 'available'),
    ('Community Hall', 'Venue', 'Mon-Sun 9am-10pm', 'available'),
    ('Laptop Cart #1', 'Equipment', 'Mon-Fri 7am-5pm', 'available'),
    ('Rooftop Garden', 'Outdoor Space', 'Mon-Sun 6am-9pm', 'available'),
    ('Study Room B', 'Room', 'Mon-Sun 8am-10pm', 'available'),
    ('PA Sound System', 'Equipment', 'By request', 'available'),
    ('Basketball Court', 'Sports Facility', 'Mon-Sun 6am-10pm', 'available')
) AS v(name, type, availability_schedule, status)
WHERE NOT EXISTS (SELECT 1 FROM resources LIMIT 1);

-- Add description column if it doesn't exist (safe to run on existing DBs)
ALTER TABLE resources ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- Speed up booking lookups by resource, user, status, and date
CREATE INDEX IF NOT EXISTS idx_bookings_resource_id  ON bookings (resource_id);
CREATE INDEX IF NOT EXISTS idx_bookings_username      ON bookings (username);
CREATE INDEX IF NOT EXISTS idx_bookings_status        ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_date          ON bookings (date);
CREATE INDEX IF NOT EXISTS idx_bookings_resource_status ON bookings (resource_id, status);

-- Speed up notification lookups by recipient
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read   ON notifications (recipient, is_read);

-- Speed up resource lookups by status and type
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources (status);
CREATE INDEX IF NOT EXISTS idx_resources_type   ON resources (type);
