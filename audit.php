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
      <p>Recent changes are logged here for compliance.</p>
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
        if (empty($auditlog)) {
          echo '<tr><td colspan="7" style="text-align:center;color:#999;">No audit trail entries yet.</td></tr>';
        } else {
          foreach (array_reverse($auditlog) as $entry) {
            echo '<tr>';
            echo '<td>' . htmlspecialchars($entry['timestamp']) . '</td>';
            echo '<td>' . htmlspecialchars($entry['action']) . '</td>';
            echo '<td>' . htmlspecialchars($entry['employee_name']) . '</td>';
            echo '<td>' . htmlspecialchars($entry['leave_type']) . '</td>';
            echo '<td>' . htmlspecialchars($entry['start_date']) . ' to ' . htmlspecialchars($entry['end_date']) . '</td>';
            echo '<td>' . htmlspecialchars($entry['approved_by']) . '</td>';
            echo '<td>' . htmlspecialchars($entry['new_status']) . '</td>';
            echo '</tr>';
          }
        }
        ?>
        </tbody>
      </table>
    </div>
  </main>
</body>
</html>
