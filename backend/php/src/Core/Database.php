<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;

/**
 * Database — singleton PDO connection.
 *
 * Usage anywhere in the app:
 *   $pdo = Database::connection();
 */
class Database
{
    private static ?PDO $instance = null;

    public static function connection(): PDO
    {
        if (self::$instance === null) {
            self::$instance = self::connect();
        }
        return self::$instance;
    }

    private static function connect(): PDO
    {
        $dsn = sprintf(
            'pgsql:host=%s;port=%s;dbname=%s',
            getenv('DB_HOST') ?: 'localhost',
            getenv('DB_PORT') ?: '5432',
            getenv('DB_NAME') ?: 'resourcery_db',
        );

        try {
            return new PDO(
                $dsn,
                getenv('DB_USER')     ?: 'user',
                getenv('DB_PASSWORD') ?: 'password',
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit();
        }
    }

    private function __construct() {}
}
