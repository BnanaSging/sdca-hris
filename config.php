<?php
// JSON-based Database (no external database needed!)
$db_file = __DIR__ . '/users.json';

// Ensure database file exists
if (!file_exists($db_file)) {
    $initial_data = [];
    file_put_contents($db_file, json_encode($initial_data, JSON_PRETTY_PRINT));
}

// Helper functions for JSON database
function getLeaveTypes() {
    return [
        'Vacation' => 'Vacation Leave',
        'Sick Leave' => 'Sick Leave',
        'Personal Leave' => 'Personal Leave',
        'Birthday Leave' => 'Birthday Leave',
        'Maternity Leave' => 'Maternity Leave',
        'Paternity Leave' => 'Paternity Leave',
        'Other' => 'Other Leave'
    ];
}

function getUsers() {
    global $db_file;
    $data = json_decode(file_get_contents($db_file), true);
    return $data ?: [];
}

function formatFullName($user) {
    if (isset($user['surname']) && isset($user['firstname'])) {
        $name = $user['surname'] . ', ' . $user['firstname'];
        if (isset($user['middle_initial']) && !empty($user['middle_initial'])) {
            $name .= ' ' . $user['middle_initial'] . '.';
        }
        return $name;
    }
    return $user['name'] ?? 'Unknown';
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

function addUser($surname, $firstname, $middle_initial, $email, $password, $position, $department) {
    global $db_file;
    $users = getUsers();
    
    // Check if email exists
    foreach ($users as $user) {
        if ($user['email'] === $email) {
            return false; // Email already exists
        }
    }
    
        $leave_package = func_num_args() > 7 ? func_get_arg(7) : 'custom';
        $birthday = func_num_args() > 8 ? func_get_arg(8) : '';
        $gender = func_num_args() > 9 ? func_get_arg(9) : '';
        $custom_leaves = func_num_args() > 10 ? func_get_arg(10) : [];
        
        // Format full name for backward compatibility
        $formatted_name = $surname . ', ' . $firstname;
        if (!empty($middle_initial)) {
            $formatted_name .= ' ' . $middle_initial . '.';
        }
        
        // Initialize leaves_used - start with 0 for all leave types
        $leaves_used = [];
        foreach (getLeaveTypes() as $leave_key => $leave_label) {
            $leaves_used[$leave_key] = 0;
        }
        
        // Override with custom leave amounts if provided
        if (is_array($custom_leaves)) {
            foreach ($custom_leaves as $leave_key => $amount) {
                if (isset($leaves_used[$leave_key])) {
                    $leaves_used[$leave_key] = intval($amount);
                }
            }
        }
        
        $new_user = [
            'id' => count($users) + 1,
            'surname' => $surname,
            'firstname' => $firstname,
            'middle_initial' => $middle_initial,
            'name' => $formatted_name,
            'email' => $email,
            'password' => $password,
            'position' => $position,
            'department' => $department,
            'leave_package' => $leave_package,
            'birthday' => $birthday,
            'gender' => $gender,
            'leaves_used' => $leaves_used,
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
