<?php
require 'auth-check.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['user_id'], $_POST['leave_type'], $_POST['amount'])) {
    $user_id = intval($_POST['user_id']);
    $leave_type = $_POST['leave_type'];
    $amount = intval($_POST['amount']);
    if ($user_id > 0 && $amount > 0 && $leave_type) {
        $users = file_exists('users.json') ? json_decode(file_get_contents('users.json'), true) : [];
        $target_user = null;
        foreach ($users as &$user) {
            if ($user['id'] == $user_id) {
                if (!isset($user['leaves_used'])) $user['leaves_used'] = [];
                if (!isset($user['leaves_used'][$leave_type])) $user['leaves_used'][$leave_type] = 0;
                $user['leaves_used'][$leave_type] -= $amount;
                if ($user['leaves_used'][$leave_type] < 0) $user['leaves_used'][$leave_type] = 0;
                $target_user = $user;
                break;
            }
        }
        file_put_contents('users.json', json_encode($users, JSON_PRETTY_PRINT));
        // Log to audit trail
        $auditlog_file = 'auditlog.json';
        $auditlog = file_exists($auditlog_file) ? json_decode(file_get_contents($auditlog_file), true) : [];
        $auditlog[] = [
            'timestamp' => date('Y-m-d H:i:s'),
            'action' => 'Add Leave Balance',
            'leave_type' => $leave_type,
            'amount_added' => $amount,
            'employee_name' => $target_user ? $target_user['name'] : ('User ID ' . $user_id),
            'by' => isset($_SESSION['name']) ? $_SESSION['name'] : 'Unknown',
        ];
        file_put_contents($auditlog_file, json_encode($auditlog, JSON_PRETTY_PRINT));
        header('Location: employeedirectory.php?success=1');
        exit();
    }
}
header('Location: employeedirectory.php?error=1');
exit();
