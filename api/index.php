<?php

// This file acts as the Vercel serverless entry point for the Laravel app.
// It delegates all request handling to Laravel's standard public/index.php.

// Create necessary writable directories in /tmp for Vercel Serverless
$tmpDirs = [
    '/tmp/storage/app/public',
    '/tmp/storage/framework/cache/data',
    '/tmp/storage/framework/sessions',
    '/tmp/storage/framework/views',
    '/tmp/storage/logs',
    '/tmp/bootstrap/cache',
];

foreach ($tmpDirs as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
}

// Copy pre-built bootstrap cache files if they exist in source directory
$sourceBootstrapCache = __DIR__ . '/../bootstrap/cache';
if (is_dir($sourceBootstrapCache)) {
    $files = @scandir($sourceBootstrapCache) ?: [];
    foreach ($files as $file) {
        if ($file !== '.' && $file !== '..' && $file !== '.gitignore') {
            $src = $sourceBootstrapCache . '/' . $file;
            $dst = '/tmp/bootstrap/cache/' . $file;
            if (is_file($src) && !file_exists($dst)) {
                @copy($src, $dst);
            }
        }
    }
}

putenv('APP_STORAGE=/tmp/storage');
$_ENV['APP_STORAGE'] = '/tmp/storage';
$_SERVER['APP_STORAGE'] = '/tmp/storage';

// Ensure SQLite database exists in writable /tmp directory on Vercel
$dbConnection = getenv('DB_CONNECTION') ?: ($_ENV['DB_CONNECTION'] ?? 'sqlite');
if ($dbConnection === 'sqlite' && empty(getenv('DB_DATABASE'))) {
    $tmpDb = '/tmp/database.sqlite';
    $sourceDb = __DIR__ . '/../database/database.sqlite';
    if (!file_exists($tmpDb) || filesize($tmpDb) === 0) {
        if (file_exists($sourceDb) && filesize($sourceDb) > 0) {
            @copy($sourceDb, $tmpDb);
        } elseif (!file_exists($tmpDb)) {
            @touch($tmpDb);
        }
    }
    putenv("DB_DATABASE={$tmpDb}");
    $_ENV['DB_DATABASE'] = $tmpDb;
    $_SERVER['DB_DATABASE'] = $tmpDb;
}

putenv('APP_SERVICES_CACHE=/tmp/bootstrap/cache/services.php');
$_ENV['APP_SERVICES_CACHE'] = '/tmp/bootstrap/cache/services.php';
$_SERVER['APP_SERVICES_CACHE'] = '/tmp/bootstrap/cache/services.php';

putenv('APP_PACKAGES_CACHE=/tmp/bootstrap/cache/packages.php');
$_ENV['APP_PACKAGES_CACHE'] = '/tmp/bootstrap/cache/packages.php';
$_SERVER['APP_PACKAGES_CACHE'] = '/tmp/bootstrap/cache/packages.php';

putenv('APP_CONFIG_CACHE=/tmp/bootstrap/cache/config.php');
$_ENV['APP_CONFIG_CACHE'] = '/tmp/bootstrap/cache/config.php';
$_SERVER['APP_CONFIG_CACHE'] = '/tmp/bootstrap/cache/config.php';

putenv('APP_ROUTES_CACHE=/tmp/bootstrap/cache/routes.php');
$_ENV['APP_ROUTES_CACHE'] = '/tmp/bootstrap/cache/routes.php';
$_SERVER['APP_ROUTES_CACHE'] = '/tmp/bootstrap/cache/routes.php';

putenv('APP_EVENTS_CACHE=/tmp/bootstrap/cache/events.php');
$_ENV['APP_EVENTS_CACHE'] = '/tmp/bootstrap/cache/events.php';
$_SERVER['APP_EVENTS_CACHE'] = '/tmp/bootstrap/cache/events.php';

putenv('VIEW_COMPILED_PATH=/tmp/storage/framework/views');
$_ENV['VIEW_COMPILED_PATH'] = '/tmp/storage/framework/views';
$_SERVER['VIEW_COMPILED_PATH'] = '/tmp/storage/framework/views';

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

