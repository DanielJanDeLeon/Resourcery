<?php

declare(strict_types=1);

use App\Core\Router;
use App\Controllers\ResourceController;
use App\Middleware\JwtMiddleware;

$router = new Router();

// ── Public routes ─────────────────────────────────────────────────────────────
$router->get('/health', function (array $params) {
    echo json_encode(['status' => 'ok', 'service' => 'resourcery-php-api']);
});

// ── Resources — any authenticated user ───────────────────────────────────────
$router->get('/resources', function (array $params) {
    JwtMiddleware::authenticate();
    (new ResourceController())->index();
});

$router->get('/resources/{id}', function (array $params) {
    JwtMiddleware::authenticate();
    (new ResourceController())->show((int) $params['id']);
});

// ── Resources — admin only ────────────────────────────────────────────────────
$router->post('/resources', function (array $params) {
    JwtMiddleware::authenticate(['ROLE_ADMIN']);
    (new ResourceController())->store();
});

$router->put('/resources/{id}', function (array $params) {
    JwtMiddleware::authenticate(['ROLE_ADMIN']);
    (new ResourceController())->update((int) $params['id']);
});

$router->delete('/resources/{id}', function (array $params) {
    JwtMiddleware::authenticate(['ROLE_ADMIN']);
    (new ResourceController())->destroy((int) $params['id']);
});

// ── Dispatch ──────────────────────────────────────────────────────────────────
$router->dispatch();
