<?php

/**
 * Laravel - A PHP Framework For Web Artisans
 *
 * This file allows us to emulate Apache's "mod_rewrite" functionality from the
 * built-in PHP web server. It serves static assets directly and routes dynamic
 * requests to the Laravel application index.
 */

$publicPath = __DIR__.'/public';

$uri = urldecode(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? ''
);

// If the requested URI is a static file that exists in the public directory,
// return false so the built-in PHP web server serves it directly.
if ($uri !== '/' && file_exists($publicPath.$uri)) {
    return false;
}

require_once $publicPath.'/index.php';
