<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use PDOException;

/**
 * ResourceController — full CRUD for the resources table.
 *
 * Auth and role checks are declared in routes.php, not here.
 *
 * Routes wired in routes.php:
 *   GET    /resources          → index()   (any authenticated user)
 *   GET    /resources/{id}     → show()    (any authenticated user)
 *   POST   /resources          → store()   (ROLE_ADMIN)
 *   PUT    /resources/{id}     → update()  (ROLE_ADMIN)
 *   DELETE /resources/{id}     → destroy() (ROLE_ADMIN)
 */
class ResourceController
{
    // ── GET /resources ────────────────────────────────────────────────────────
    public function index(): void
    {
        try {
            $stmt = Database::connection()->query(
                'SELECT id, name, type, description, availability_schedule, quantity, status, created_at FROM resources ORDER BY id'
            );
            $this->json($stmt->fetchAll());
        } catch (PDOException $e) {
            $this->json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    // ── GET /resources/{id} ───────────────────────────────────────────────────
    public function show(int $id): void
    {
        try {
            $stmt = Database::connection()->prepare(
                'SELECT id, name, type, description, availability_schedule, quantity, status, created_at FROM resources WHERE id = ?'
            );
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            $row
                ? $this->json($row)
                : $this->json(['error' => 'Resource not found.'], 404);
        } catch (PDOException $e) {
            $this->json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    // ── POST /resources ───────────────────────────────────────────────────────
    public function store(): void
    {
        $body = $this->body();
        $errors = $this->validate($body, ['name', 'type']);
        if ($errors) {
            $this->json(['error' => 'Validation failed.', 'fields' => $errors], 422);
            return;
        }

        $validStatuses = ['available', 'booked', 'under maintenance'];
        $status = in_array($body['status'] ?? '', $validStatuses) ? $body['status'] : 'available';

        try {
            $stmt = Database::connection()->prepare(
                'INSERT INTO resources (name, type, description, availability_schedule, quantity, status)
                 VALUES (:name, :type, :description, :availability_schedule, :quantity, :status)
                 RETURNING id, name, type, description, availability_schedule, quantity, status, created_at'
            );
            $stmt->execute([
                'name'                  => $body['name'],
                'type'                  => $body['type'],
                'description'           => $body['description'] ?? null,
                'availability_schedule' => $body['availability_schedule'] ?? null,
                'quantity'              => max(1, (int)($body['quantity'] ?? 1)),
                'status'                => $status,
            ]);
            $this->json($stmt->fetch(), 201);
        } catch (PDOException $e) {
            $this->json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    // ── PUT /resources/{id} ───────────────────────────────────────────────────
    public function update(int $id): void
    {
        $body = $this->body();

        // Allow partial status-only update (called by Django on approve/decline)
        $statusOnly = isset($body['status']) && count($body) === 1;

        if (!$statusOnly) {
            $errors = $this->validate($body, ['name', 'type']);
            if ($errors) {
                $this->json(['error' => 'Validation failed.', 'fields' => $errors], 422);
                return;
            }
        }

        $validStatuses = ['available', 'booked', 'under maintenance'];
        $newStatus = in_array($body['status'] ?? '', $validStatuses) ? $body['status'] : null;

        try {
            if ($statusOnly && $newStatus) {
                $stmt = Database::connection()->prepare(
                    'UPDATE resources SET status = :status WHERE id = :id
                     RETURNING id, name, type, availability_schedule, status, created_at'
                );
                $stmt->execute(['status' => $newStatus, 'id' => $id]);
            } else {
                $status = $newStatus ?? 'available';
                $stmt = Database::connection()->prepare(
                    'UPDATE resources
                     SET name = :name, type = :type, description = :description,
                         availability_schedule = :availability_schedule, quantity = :quantity, status = :status
                     WHERE id = :id
                     RETURNING id, name, type, description, availability_schedule, quantity, status, created_at'
                );
                $stmt->execute([
                    'id'                    => $id,
                    'name'                  => $body['name'],
                    'type'                  => $body['type'],
                    'description'           => $body['description'] ?? null,
                    'availability_schedule' => $body['availability_schedule'] ?? null,
                    'quantity'              => max(1, (int)($body['quantity'] ?? 1)),
                    'status'                => $status,
                ]);
            }
            $row = $stmt->fetch();
            $row
                ? $this->json($row)
                : $this->json(['error' => 'Resource not found.'], 404);
        } catch (PDOException $e) {
            $this->json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    // ── DELETE /resources/{id} ────────────────────────────────────────────────
    public function destroy(int $id): void
    {
        try {
            $stmt = Database::connection()->prepare(
                'DELETE FROM resources WHERE id = ? RETURNING id'
            );
            $stmt->execute([$id]);
            $deleted = $stmt->fetch();
            $deleted
                ? $this->json(['message' => "Resource $id deleted."])
                : $this->json(['error' => 'Resource not found.'], 404);
        } catch (PDOException $e) {
            $this->json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private function body(): array
    {
        return (array) json_decode(file_get_contents('php://input'), true);
    }

    private function validate(array $data, array $required): array
    {
        $errors = [];
        foreach ($required as $field) {
            if (!isset($data[$field]) || $data[$field] === '') {
                $errors[] = "$field is required.";
            }
        }
        return $errors;
    }

    private function json(mixed $data, int $code = 200): void
    {
        http_response_code($code);
        echo json_encode($data);
    }
}
