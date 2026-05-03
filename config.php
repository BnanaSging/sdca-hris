<?php
// JSON-based Database (no external database needed!)
$db_file = __DIR__ . '/users.json';

// Ensure database file exists
if (!file_exists($db_file)) {
    $initial_data = [];
    file_put_contents($db_file, json_encode($initial_data, JSON_PRETTY_PRINT));
}

// Helper functions for JSON database
function getUsers() {
    global $db_file;
    $data = json_decode(file_get_contents($db_file), true);
    return $data ?: [];
}

function findUserByEmail($email) {
    $users = getUsers();
    foreach ($users as $user) {
        if ($user['email'] === $email) {
            return $user;
        }
    }
    return null;
}

function addUser($name, $email, $password, $position, $department) {
    global $db_file;
    $users = getUsers();
    
    // Check if email exists
    foreach ($users as $user) {
        if ($user['email'] === $email) {
            return false; // Email already exists
        }
    }
    
        $leave_package = func_num_args() > 5 ? func_get_arg(5) : 'normal';
        $birthday = func_num_args() > 6 ? func_get_arg(6) : '';
        $gender = func_num_args() > 7 ? func_get_arg(7) : '';
        $new_user = [
            'id' => count($users) + 1,
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'position' => $position,
            'department' => $department,
            'leave_package' => $leave_package,
            'birthday' => $birthday,
            'gender' => $gender,
            'created_at' => date('Y-m-d H:i:s')
        ];
    
    $users[] = $new_user;
    file_put_contents($db_file, json_encode($users, JSON_PRETTY_PRINT));
    return true;
}

// Announcement helper functions
function getAnnouncements() {
    $announcements_file = __DIR__ . '/announcements.json';
    if (!file_exists($announcements_file)) {
        return [];
    }
    $data = json_decode(file_get_contents($announcements_file), true);
    return $data ?: [];
}

function getPublishedAnnouncements() {
    $announcements = getAnnouncements();
    $published = [];
    
    foreach ($announcements as $announcement) {
        if ($announcement['status'] === 'published') {
            // Check if announcement has expired
            if ($announcement['expires_at'] && strtotime($announcement['expires_at']) < time()) {
                continue;
            }
            $published[] = $announcement;
        }
    }
    
    // Sort by pinned first, then by most recent
    usort($published, function($a, $b) {
        // Convert to boolean for consistent comparison
        $a_pinned = (bool) $a['pinned'];
        $b_pinned = (bool) $b['pinned'];
        
        if ($a_pinned != $b_pinned) {
            return $b_pinned ? -1 : 1;
        }
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });
    
    return $published;
}

function createAnnouncement($title, $content, $created_by, $pinned = false, $expires_at = null) {
    $announcements_file = __DIR__ . '/announcements.json';
    $announcements = getAnnouncements();
    
    $new_id = count($announcements) > 0 ? max(array_column($announcements, 'id')) + 1 : 1;
    
    $new_announcement = [
        'id' => $new_id,
        'title' => $title,
        'content' => $content,
        'created_by' => $created_by,
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s'),
        'status' => 'published',
        'pinned' => $pinned,
        'expires_at' => $expires_at
    ];
    
    $announcements[] = $new_announcement;
    file_put_contents($announcements_file, json_encode($announcements, JSON_PRETTY_PRINT));
    
    return $new_announcement;
}

function updateAnnouncement($id, $title, $content, $pinned = false, $expires_at = null) {
    $announcements_file = __DIR__ . '/announcements.json';
    $announcements = getAnnouncements();
    
    foreach ($announcements as &$announcement) {
        if ($announcement['id'] == $id) {
            $announcement['title'] = $title;
            $announcement['content'] = $content;
            $announcement['pinned'] = $pinned;
            $announcement['expires_at'] = $expires_at;
            $announcement['updated_at'] = date('Y-m-d H:i:s');
            break;
        }
    }
    
    file_put_contents($announcements_file, json_encode($announcements, JSON_PRETTY_PRINT));
    return true;
}

function deleteAnnouncement($id) {
    $announcements_file = __DIR__ . '/announcements.json';
    $announcements = getAnnouncements();
    
    $announcements = array_filter($announcements, function($announcement) use ($id) {
        return $announcement['id'] != $id;
    });
    
    file_put_contents($announcements_file, json_encode(array_values($announcements), JSON_PRETTY_PRINT));
    return true;
}

function getAnnouncementById($id) {
    $announcements = getAnnouncements();
    foreach ($announcements as $announcement) {
        if ($announcement['id'] == $id) {
            return $announcement;
        }
    }
    return null;
}
?>
