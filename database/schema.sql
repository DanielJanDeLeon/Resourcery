-- Resourcery — PostgreSQL Schema Reference
-- This file is for documentation only.
-- Tables are created/managed by each service:
--   users     → Spring Boot Flyway:  sb/src/main/resources/db/migration/V1__create_users_table.sql
--   resources → PHP init.sql:        php/init.sql  (seeded by Docker on first start)
--   bookings  → Django migrations:   django/bookings/migrations/

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id       BIGSERIAL    PRIMARY KEY,
    username VARCHAR(50)  NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role     VARCHAR(20)  NOT NULL  -- 'ROLE_USER' | 'ROLE_ADMIN'
);

-- ── Resources ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
    id                    SERIAL       PRIMARY KEY,
    name                  VARCHAR(120) NOT NULL,
    type                  VARCHAR(80)  NOT NULL,
    description           TEXT         DEFAULT NULL,
    availability_schedule VARCHAR(255) DEFAULT NULL,
    status                VARCHAR(30)  NOT NULL DEFAULT 'available',
    created_at            TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Bookings ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
    id            BIGSERIAL    PRIMARY KEY,
    username      VARCHAR(150) NOT NULL,
    resource_id   INTEGER      NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    resource_name VARCHAR(100) NOT NULL,
    date          DATE         NOT NULL,
    return_date   DATE,
    time          TIME         NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
    -- status values: pending | approved | declined | returned | not_returned
    created_at    TIMESTAMPTZ  DEFAULT NOW()
);
