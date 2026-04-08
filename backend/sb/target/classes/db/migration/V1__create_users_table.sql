CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL
);
-- Admin account is seeded automatically by AuthController on startup
-- using admin.username and admin.password from application.properties.
