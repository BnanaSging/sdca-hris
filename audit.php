<?php
require 'auth-check.php';
require 'config.php';
// Only allow admin to view this page
if (!isset($_SESSION['position']) || strtolower($_SESSION['position']) !== 'admin') {
  header('Location: index.php');
  exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HR Portal - Audit Trail</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body class="page">
  <?php include 'sidebar.php'; ?>
  <main class="main-content">
    <h1>Audit Trail</h1>
    <div class="card">
      <p>Leave Actions (Applied, Approved, Denied)</p>
      <table style="width:100%;margin-top:20px;">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Action</th>
            <th>Employee</th>
            <th>Type</th>
            <th>Dates</th>
            <th>By</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
        <?php
        $auditlog_file = 'auditlog.json';
        $auditlog = file_exists($auditlog_file) ? json_decode(file_get_contents($auditlog_file), true) : [];
        $has_action = false;
        foreach (array_reverse($auditlog) as $entry) {
          $action = strtolower($entry['action'] ?? '');
          if (in_array($action, ['approve', 'approved', 'deny', 'denied', 'applied'])) {
            $has_action = true;
            echo '<tr>';
            echo '<td>' . htmlspecialchars($entry['timestamp']) . '</td>';
            echo '<td>' . htmlspecialchars($entry['action']) . '</td>';
            echo '<td>' . htmlspecialchars($entry['employee_name'] ?? '-') . '</td>';
            echo '<td>' . htmlspecialchars($entry['leave_type'] ?? '-') . '</td>';
            $start = $entry['start_date'] ?? '';
            $end = $entry['end_date'] ?? '';
            echo '<td>' . htmlspecialchars($start) . ($start && $end ? ' to ' : '') . htmlspecialchars($end) . '</td>';
            $by = $entry['approved_by'] ?? $entry['applied_by'] ?? '-';
            echo '<td>' . htmlspecialchars($by) . '</td>';
            $status = $entry['new_status'] ?? $entry['status'] ?? '-';
            echo '<td>' . htmlspecialchars($status) . '</td>';
            echo '</tr>';
          }
        }
        if (!$has_action) {
          echo '<tr><td colspan="7" style="text-align:center;color:#999;">No leave actions yet.</td></tr>';
        }
        ?>
        </tbody>
      </table>
    </div>

    <div class="card" style="margin-top: 32px;">
      <p>Leave Balance Changes</p>
      <table style="width:100%;margin-top:20px;">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Action</th>
            <th>Employee</th>
            <th>Type</th>
            <th>Old Balance</th>
            <th>New Balance</th>
            <th>By</th>
          </tr>
        </thead>
        <tbody>
        <?php
        $has_update = false;
        foreach (array_reverse($auditlog) as $entry) {
          if (($entry['action'] ?? '') === 'Leave Balance Updated') {
            $has_update = true;
            echo '<tr>';
            echo '<td>' . htmlspecialchars($entry['timestamp']) . '</td>';
            echo '<td>' . htmlspecialchars($entry['action']) . '</td>';
            // Find employee name
            $emp_name = '-';
            foreach ($auditlog as $u) {
              if (isset($u['user_id']) && $u['user_id'] == $entry['user_id'] && isset($u['employee_name'])) {
                $emp_name = $u['employee_name'];
                break;
              }
            }
            if ($emp_name === '-' && isset($entry['employee_name'])) $emp_name = $entry['employee_name'];
            echo '<td>' . htmlspecialchars($emp_name) . '</td>';
            echo '<td>' . htmlspecialchars($entry['leave_type'] ?? '-') . '</td>';
            echo '<td>' . htmlspecialchars($entry['old_balance'] ?? '-') . '</td>';
            echo '<td>' . htmlspecialchars($entry['new_balance'] ?? '-') . '</td>';
            echo '<td>' . htmlspecialchars($entry['updated_by'] ?? '-') . '</td>';
            echo '</tr>';
          }
        }
        if (!$has_update) {
          echo '<tr><td colspan="7" style="text-align:center;color:#999;">No leave balance changes yet.</td></tr>';
        }
        ?>
        </tbody>
      </table>
    </div>
  </main>
</body>
</html>
