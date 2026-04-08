<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Router — supports static and dynamic routes with named parameters.
 *
 * Usage:
 *   $router->get('/resources',        $handler);
 *   $router->get('/resources/{id}',   $handler);
 */
class Router
{
    /** @var array<string, array<string, callable>> */
    private array $routes = [];

    public function get(string $path, callable $handler): void
    {
        $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, callable $handler): void
    {
        $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, callable $handler): void
    {
        $this->addRoute('PUT', $path, $handler);
    }

    public function delete(string $path, callable $handler): void
    {
        $this->addRoute('DELETE', $path, $handler);
    }

    private function addRoute(string $method, string $path, callable $handler): void
    {
        $this->routes[$method][$path] = $handler;
    }

    public function dispatch(): never
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $path   = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/') ?: '/';

        if ($method === 'OPTIONS') {
            http_response_code(200);
            exit();
        }

        foreach ($this->routes[$method] ?? [] as $pattern => $handler) {
            $params = $this->match($pattern, $path);
            if ($params !== null) {
                $handler($params);
                exit();
            }
        }

        http_response_code(404);
        echo json_encode(['error' => "Route $method $path not found."]);
        exit();
    }

    private function match(string $pattern, string $path): ?array
    {
        $regex = preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $pattern);
        $regex = '#^' . $regex . '$#';

        if (!preg_match($regex, $path, $matches)) {
            return null;
        }

        return array_filter(
            $matches,
            fn($key) => is_string($key),
            ARRAY_FILTER_USE_KEY
        );
    }
}
