# Resourcery — Community Resource Booking System

A microservice-based application for managing and booking shared community resources.

---

## Project Structure

```
resourcery/
├── docker-compose.yml
├── resourcery.code-workspace
│
├── backend/
│   ├── sb/                         ← Auth Service (Spring Boot, port 8080)
│   │   ├── src/main/java/com/resourcery/auth/
│   │   │   ├── controller/         AuthController.java
│   │   │   ├── dto/                LoginRequest, SignupRequest, JwtResponse
│   │   │   ├── model/              User.java
│   │   │   ├── repository/         UserRepository.java
│   │   │   └── security/           SecurityConfig, JwtUtils, JwtAuthFilter
│   │   └── src/main/resources/
│   │       ├── application.properties
│   │       └── db/migration/       V1__create_users_table.sql
│   │
│   ├── php/                        ← Resources API (PHP, port 8081)
│   │   ├── src/
│   │   │   ├── Controllers/        ResourceController.php
│   │   │   ├── Core/               Database.php, Router.php
│   │   │   ├── Middleware/         JwtMiddleware.php
│   │   │   └── routes.php
│   │   ├── index.php
│   │   ├── init.sql
│   │   └── Dockerfile
│   │
│   └── django/                     ← Bookings API (Django, port 8082)
│       ├── bookings/
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   ├── auth.py
│       │   └── migrations/
│       └── core/
│           ├── settings.py
│           └── urls.py
│
├── react/                          ← Frontend (React + Vite, port 3000)
│   └── src/
│       ├── components/
│       ├── config/
│       ├── hooks/
│       ├── layout/
│       └── pages/
│
├── database/
│   └── schema.sql                  ← PostgreSQL schema reference
│
└── frontend/                       ← Original monolithic PHP (archived)
```

---

## Running the Project

```bash
docker compose up --build
```

Open **http://localhost:3000**

Default admin: `Daniel` / `Daniel`

---

## Services

| Service | URL | Tech |
|---------|-----|------|
| Frontend | http://localhost:3000 | React + Vite |
| Auth API | http://localhost:8080 | Spring Boot |
| Resources API | http://localhost:8081 | PHP |
| Bookings API | http://localhost:8082 | Django |
| Database | localhost:5434 | PostgreSQL |

---

## Shared JWT Secret

All three backend services share the same `JWT_SECRET` set in `docker-compose.yml`.
Spring Boot issues the token; PHP and Django verify it.
