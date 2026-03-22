<?php require 'auth-check.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HR Portal - Leave</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body class="page">
  <nav class="sidebar">
    <img src="image/logo-header.png" alt="HR Portal Logo" class="sidebar-logo">
    <a href="index.php" class="nav-link">Home</a>
    <a href="announcements.php" class="nav-link">Announcements</a>
    <a href="employeedirectory.php" class="nav-link">Employee Directory</a>
    <a href="leave.php" class="nav-link active">Leave Request</a>
    <a href="myleave.php" class="nav-link">My Leave</a>
    <a href="audit.php" class="nav-link">Audit Trail</a>
    <a href="logout.php" class="nav-link logout">Logout</a>
  </nav>
  <main class="main-content">
    <?php
    // Handle approve/deny actions
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'], $_POST['leave_id'])) {
      $leaves = file_exists('leaves.json') ? json_decode(file_get_contents('leaves.json'), true) : [];
      $users = file_exists('users.json') ? json_decode(file_get_contents('users.json'), true) : [];
      $auditlog_file = 'auditlog.json';
      $auditlog = file_exists($auditlog_file) ? json_decode(file_get_contents($auditlog_file), true) : [];
      foreach ($leaves as &$leave) {
        if ($leave['id'] == $_POST['leave_id']) {
          $old_status = $leave['status'];
          if ($_POST['action'] === 'approve') {
            $leave['status'] = 'Approved';
            // Deduct leave balance for the user
            $leave_user = null;
            foreach ($users as &$u) {
              if ($u['id'] == $leave['user_id']) {
                $leave_user = &$u;
                break;
              }
            }
            if ($leave_user && isset($leave_user['leave_package'])) {
              // Only deduct if not custom (unlimited)
              if ($leave_user['leave_package'] !== 'custom') {
                $leave_type = $leave['leave_type'];
                $start = new DateTime($leave['start_date']);
                $end = new DateTime($leave['end_date']);
                $days = $start->diff($end)->days + 1;
                // Track leave usage in user record
                if (!isset($leave_user['leaves_used'])) $leave_user['leaves_used'] = [];
                if (!isset($leave_user['leaves_used'][$leave_type])) $leave_user['leaves_used'][$leave_type] = 0;
                $leave_user['leaves_used'][$leave_type] += $days;
              }
            }
            // Save updated users.json
            file_put_contents('users.json', json_encode($users, JSON_PRETTY_PRINT));
          } elseif ($_POST['action'] === 'deny') {
            $leave['status'] = 'Denied';
          }
          // Log to audit trail
          $auditlog[] = [
            'timestamp' => date('Y-m-d H:i:s'),
            'action' => ucfirst($_POST['action']),
            'leave_id' => $leave['id'],
            'leave_type' => $leave['leave_type'],
            'employee_name' => $leave['employee_name'],
            'start_date' => $leave['start_date'],
            'end_date' => $leave['end_date'],
            'approved_by' => $_SESSION['name'],
            'old_status' => $old_status,
            'new_status' => $leave['status']
          ];
          break;
        }
      }
      file_put_contents('leaves.json', json_encode($leaves, JSON_PRETTY_PRINT));
      file_put_contents($auditlog_file, json_encode($auditlog, JSON_PRETTY_PRINT));
      // Refresh to avoid resubmission
      header('Location: leave.php');
      exit();
    }
    ?>
    <h1>Leave</h1>
    <div class="card">
      <table>
        <thead>
          <tr><th>Employee</th><th>Type</th><th>Status</th><th>Start Date</th><th>End Date</th><th>Reason</th></tr>
        </thead>
        <tbody>
        <?php
        $leaves = file_exists('leaves.json') ? json_decode(file_get_contents('leaves.json'), true) : [];
        $users = file_exists('users.json') ? json_decode(file_get_contents('users.json'), true) : [];
        $hierarchy = [
          'VPAA' => 1,
          'Dean ' => 2,
          'Program Chair' => 3,
          'Faculty Members' => 4,
          'Administrative Staff' => 5
        ];
        $current_user = null;
        foreach ($users as $u) {
          if ($u['id'] == $_SESSION['user_id']) {
            $current_user = $u;
            break;
          }
        }
        $current_level = $current_user && isset($hierarchy[$current_user['position']]) ? $hierarchy[$current_user['position']] : null;
        $approvable_level = $current_level !== null ? $current_level + 1 : null;
        $found = false;
        foreach ($leaves as $leave) {
          // Find the leave owner's position
          $leave_user = null;
          foreach ($users as $u) {
            if ($u['id'] == $leave['user_id']) {
              $leave_user = $u;
              break;
            }
          }
          if ($leave_user && isset($hierarchy[$leave_user['position']]) && $current_level !== null) {
            if ($hierarchy[$leave_user['position']] === $approvable_level) {
              $found = true;
              echo '<tr>';
              echo '<td>' . htmlspecialchars($leave['employee_name']) . '</td>';
              echo '<td>' . htmlspecialchars($leave['leave_type']) . '</td>';
              echo '<td>' . htmlspecialchars($leave['status']) . '</td>';
              echo '<td>' . htmlspecialchars($leave['start_date']) . '</td>';
              echo '<td>' . htmlspecialchars($leave['end_date']) . '</td>';
              echo '<td>' . htmlspecialchars($leave['reason']) . '</td>';
              // Approve/Deny buttons only if status is Pending
              if (strtolower($leave['status']) === 'pending') {
                echo '<td>';
                echo '<form method="post" style="display:inline; margin:0;">';
                echo '<input type="hidden" name="leave_id" value="' . htmlspecialchars($leave['id']) . '">';
                echo '<button type="submit" name="action" value="approve" style="background:#28a745;color:#fff;border:none;padding:4px 10px;border-radius:3px;cursor:pointer;">Approve</button>';
                echo '</form> ';
                echo '<form method="post" style="display:inline; margin:0;">';
                echo '<input type="hidden" name="leave_id" value="' . htmlspecialchars($leave['id']) . '">';
                echo '<button type="submit" name="action" value="deny" style="background:#dc3545;color:#fff;border:none;padding:4px 10px;border-radius:3px;cursor:pointer;">Deny</button>';
                echo '</form>';
                echo '</td>';
              } else {
                echo '<td></td>';
              }
              echo '</tr>';
            }
          }
        }
        if (!$found) {
          echo '<tr><td colspan="7" style="text-align:center; color:#999;">No leave applications found for your approval.</td></tr>';
        }
        ?>
        </tbody>
      </table>
    </div>
  </main>
</body>
</html>
