# Resourcery — Backend Services

| Folder | Tech | Port | Responsibility |
|--------|------|------|----------------|
| `sb/` | Spring Boot (Java) | 8080 | Auth — login, register, JWT, user management |
| `php/` | PHP + Apache | 8081 | Resources — full CRUD |
| `django/` | Django (Python) | 8082 | Bookings — create, track, approve, return |

All three share a single PostgreSQL database and the same `JWT_SECRET`.
Run everything from the project root: `docker compose up --build`
