<?php require 'auth-check.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HR Portal - Audit Trail</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body class="page">
  <nav class="sidebar">
    <img src="image/logo-header.png" alt="HR Portal Logo" class="sidebar-logo">
    <a href="index.php" class="nav-link">Home</a>
    <a href="announcements.php" class="nav-link">Announcements</a>
    <a href="employeedirectory.php" class="nav-link">Employee Directory</a>
    <a href="leave.php" class="nav-link">Leave Request</a>
    <a href="myleave.php" class="nav-link">My Leave</a>
    <a href="audit.php" class="nav-link active">Audit Trail</a>
    <a href="logout.php" class="nav-link logout">Logout</a>
  </nav>
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
      <p>Leave Balance Additions</p>
      <table style="width:100%;margin-top:20px;">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Action</th>
            <th>Employee</th>
            <th>Type</th>
            <th>Amount Added</th>
            <th>By</th>
          </tr>
        </thead>
        <tbody>
        <?php
        $has_add = false;
        foreach (array_reverse($auditlog) as $entry) {
          if (($entry['action'] ?? '') === 'Add Leave Balance') {
            $has_add = true;
            echo '<tr>';
            echo '<td>' . htmlspecialchars($entry['timestamp']) . '</td>';
            echo '<td>' . htmlspecialchars($entry['action']) . '</td>';
            echo '<td>' . htmlspecialchars($entry['employee_name'] ?? '-') . '</td>';
            echo '<td>' . htmlspecialchars($entry['leave_type'] ?? '-') . '</td>';
            echo '<td>+ ' . htmlspecialchars($entry['amount_added'] ?? '-') . '</td>';
            echo '<td>' . htmlspecialchars($entry['by'] ?? '-') . '</td>';
            echo '</tr>';
          }
        }
        if (!$has_add) {
          echo '<tr><td colspan="6" style="text-align:center;color:#999;">No leave balance additions yet.</td></tr>';
        }
        ?>
        </tbody>
      </table>
    </div>
  </main>
</body>
</html>
