<?php

declare(strict_types=1);

// ── CORS headers ─────────────────────────────────────────────────────────────
$allowedOrigin = getenv('CORS_ORIGIN') ?: 'http://localhost:3000';
header("Access-Control-Allow-Origin: $allowedOrigin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ── Autoloader ────────────────────────────────────────────────────────────────
require_once __DIR__ . '/vendor/autoload.php';

// ── Routes ───────────────────────────────────────────────────────────────────
require_once __DIR__ . '/src/routes.php';
