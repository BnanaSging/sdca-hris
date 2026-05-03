<?php
require 'auth-check.php';
require 'config.php';

// Get the requested file
$file = isset($_GET['file']) ? basename($_GET['file']) : '';

if (empty($file)) {
    die('Invalid file request');
}

$upload_dir = __DIR__ . '/leave_documents';
$file_path = $upload_dir . '/' . $file;

// Check if file exists
if (!file_exists($file_path)) {
    die('File not found');
}

// Check if user has permission to download
$leave_file = __DIR__ . '/leaves.json';
$leaves = file_exists($leave_file) ? json_decode(file_get_contents($leave_file), true) : [];

$has_permission = false;
$leave_owner_id = null;

// Find the leave with this attachment
foreach ($leaves as $leave) {
    if (isset($leave['attachment']) && $leave['attachment'] === $file) {
        $leave_owner_id = $leave['user_id'];
        break;
    }
}

if (!$leave_owner_id) {
    die('Leave record not found');
}

// Check permission
if ($leave_owner_id == $_SESSION['user_id']) {
    // User is the one who uploaded the document
    $has_permission = true;
} else {
    // Check if user is admin or higher position
    $users = getUsers();
    $current_user = null;
    $leave_owner_user = null;
    
    foreach ($users as $u) {
        if ($u['id'] == $_SESSION['user_id']) {
            $current_user = $u;
        }
        if ($u['id'] == $leave_owner_id) {
            $leave_owner_user = $u;
        }
    }
    
    // Check if admin
    if ($current_user && ((isset($current_user['position']) && strtolower($current_user['position']) === 'admin') || (isset($current_user['email']) && strtolower($current_user['email']) === 'admin'))) {
        $has_permission = true;
    }
    // Check if higher position in hierarchy
    else if ($current_user && $leave_owner_user) {
        $hierarchy = [
            'VPAA' => 1,
            'Dean' => 2,
            'Program Chair' => 3,
            'Faculty Members' => 4,
            'Administrative Staff' => 5
        ];
        
        $current_level = isset($hierarchy[$current_user['position']]) ? $hierarchy[$current_user['position']] : null;
        $leave_owner_level = isset($hierarchy[$leave_owner_user['position']]) ? $hierarchy[$leave_owner_user['position']] : null;
        
        // Lower number = higher position
        if ($current_level !== null && $leave_owner_level !== null && $current_level < $leave_owner_level) {
            $has_permission = true;
        }
    }
}

if (!$has_permission) {
    die('Permission denied');
}

// Download the file
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . htmlspecialchars($file) . '"');
header('Content-Length: ' . filesize($file_path));
readfile($file_path);
exit();
?>
