<?php

// This file acts as the Vercel serverless entry point for the Laravel app.
// It delegates all request handling to Laravel's standard public/index.php.

define('LARAVEL_START', microtime(true));

// Set the document root to the public directory
$root = __DIR__ . '/../public';

$uri = urldecode(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? ''
);

// Serve existing static files directly
if ($uri !== '/' && file_exists($root . $uri)) {
    return false;
}

// Bootstrap the Laravel application
require_once $root . '/index.php';
