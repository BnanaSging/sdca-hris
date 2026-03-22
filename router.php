<?php
// router.php

// Serve the requested resource as-is if it exists
if (php_sapi_name() === 'cli-server') {
    $url  = parse_url($_SERVER['REQUEST_URI']);
    $file = __DIR__ . $url['path'];
    if (is_file($file)) {
        return false;
    }
}

// Otherwise, route all requests to index.php (or change to your main PHP file)
require_once __DIR__ . '/index.php';