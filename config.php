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
?>
