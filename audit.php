<?php
require 'auth-check.php';
require 'config.php';
// Only allow admin to view this page
if (!isset($_SESSION['position']) || strtolower($_SESSION['position']) !== 'admin') {
  header('Location: index.php');
  exit();
}

$auditlog_file = 'auditlog.json';
$auditlog = file_exists($auditlog_file) ? json_decode(file_get_contents($auditlog_file), true) : [];

// Pagination settings
$per_page = 20;

// Filter leave actions
$leave_actions = [];
foreach (array_reverse($auditlog) as $entry) {
  $action = strtolower($entry['action'] ?? '');
  if (in_array($action, ['approve', 'approved', 'deny', 'denied', 'applied'])) {
    $leave_actions[] = $entry;
  }
}

// Filter leave balance changes
$balance_changes = [];
foreach (array_reverse($auditlog) as $entry) {
  if (($entry['action'] ?? '') === 'Leave Balance Updated') {
    $balance_changes[] = $entry;
  }
}

// Filter announcement changes
$announcement_changes = [];
foreach (array_reverse($auditlog) as $entry) {
  $action = $entry['action'] ?? '';
  if (in_array($action, ['Announcement Created', 'Announcement Updated', 'Announcement Deleted'])) {
    $announcement_changes[] = $entry;
  }
}

// Get current pages from query params
$action_page = isset($_GET['action_page']) ? max(1, intval($_GET['action_page'])) : 1;
$balance_page = isset($_GET['balance_page']) ? max(1, intval($_GET['balance_page'])) : 1;
$announcement_page = isset($_GET['announcement_page']) ? max(1, intval($_GET['announcement_page'])) : 1;

// Calculate totals
$action_total_pages = ceil(count($leave_actions) / $per_page) ?: 1;
$balance_total_pages = ceil(count($balance_changes) / $per_page) ?: 1;
$announcement_total_pages = ceil(count($announcement_changes) / $per_page) ?: 1;

// Paginate results
$action_start = ($action_page - 1) * $per_page;
$balance_start = ($balance_page - 1) * $per_page;
$announcement_start = ($announcement_page - 1) * $per_page;

$action_page_data = array_slice($leave_actions, $action_start, $per_page);
$balance_page_data = array_slice($balance_changes, $balance_start, $per_page);
$announcement_page_data = array_slice($announcement_changes, $announcement_start, $per_page);

function createPaginationLinks($current_page, $total_pages, $page_param, $other_params = '') {
  $links = '';
  $start = max(1, $current_page - 2);
  $end = min($total_pages, $current_page + 2);
  
  if ($current_page > 1) {
    $prev = $current_page - 1;
    $links .= "<a href='?{$page_param}={$prev}{$other_params}' style='padding:5px 10px; margin:0 3px; background:#2563eb; color:white; text-decoration:none; border-radius:4px;'>← Prev</a>";
  }
  
  for ($i = $start; $i <= $end; $i++) {
    if ($i == $current_page) {
      $links .= "<span style='padding:5px 10px; margin:0 3px; background:#2563eb; color:white; border-radius:4px; font-weight:600;'>{$i}</span>";
    } else {
      $links .= "<a href='?{$page_param}={$i}{$other_params}' style='padding:5px 10px; margin:0 3px; background:#e5e7eb; text-decoration:none; border-radius:4px;'>{$i}</a>";
    }
  }
  
  if ($current_page < $total_pages) {
    $next = $current_page + 1;
    $links .= "<a href='?{$page_param}={$next}{$other_params}' style='padding:5px 10px; margin:0 3px; background:#2563eb; color:white; text-decoration:none; border-radius:4px;'>Next →</a>";
  }
  
  return $links;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HR Portal - Audit Trail</title>
  <link rel="stylesheet" href="style.css" />
  <style>
    .pagination { display: flex; justify-content: center; gap: 5px; margin-top: 20px; flex-wrap: wrap; }
    .pagination a, .pagination span { padding: 8px 12px; border-radius: 4px; text-decoration: none; font-size: 0.95em; }
    .pagination a { background: #e5e7eb; color: #1f2937; transition: all 0.2s; }
    .pagination a:hover { background: #2563eb; color: white; }
    .pagination span { background: #2563eb; color: white; font-weight: 600; }
    .page-info { text-align: center; font-size: 0.9em; color: #6b7280; margin-bottom: 15px; }
  </style>
</head>
<body class="page">
  <?php include 'sidebar.php'; ?>
  <main class="main-content">
    <h1>Audit Trail</h1>
    
    <!-- Leave Actions Section -->
    <div class="card">
      <p style="font-weight: 600; font-size: 1.1em;">Leave Actions (Applied, Approved, Denied)</p>
      <?php if (count($leave_actions) > 0): ?>
        <div class="page-info">Showing <?php echo ($action_start + 1); ?>-<?php echo min($action_start + $per_page, count($leave_actions)); ?> of <?php echo count($leave_actions); ?> entries</div>
      <?php endif; ?>
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
        if (count($action_page_data) > 0) {
          foreach ($action_page_data as $entry) {
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
        } else {
          echo '<tr><td colspan="7" style="text-align:center;color:#999;">No leave actions yet.</td></tr>';
        }
        ?>
        </tbody>
      </table>
      
      <?php if (count($leave_actions) > 0): ?>
        <div class="pagination">
          <?php echo createPaginationLinks($action_page, $action_total_pages, 'action_page', '&balance_page=' . $balance_page . '&announcement_page=' . $announcement_page); ?>
        </div>
      <?php endif; ?>
    </div>

    <!-- Leave Balance Changes Section -->
    <div class="card" style="margin-top: 32px;">
      <p style="font-weight: 600; font-size: 1.1em;">Leave Balance Changes</p>
      <?php if (count($balance_changes) > 0): ?>
        <div class="page-info">Showing <?php echo ($balance_start + 1); ?>-<?php echo min($balance_start + $per_page, count($balance_changes)); ?> of <?php echo count($balance_changes); ?> entries</div>
      <?php endif; ?>
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
        if (count($balance_page_data) > 0) {
          foreach ($balance_page_data as $entry) {
            echo '<tr>';
            echo '<td>' . htmlspecialchars($entry['timestamp']) . '</td>';
            echo '<td>' . htmlspecialchars($entry['action']) . '</td>';
            // Find employee name from users
            $users = getUsers();
            $emp_name = '-';
            foreach ($users as $u) {
              if ($u['id'] == $entry['user_id']) {
                $emp_name = $u['name'];
                break;
              }
            }
            echo '<td>' . htmlspecialchars($emp_name) . '</td>';
            echo '<td>' . htmlspecialchars($entry['leave_type'] ?? '-') . '</td>';
            echo '<td>' . htmlspecialchars($entry['old_balance'] ?? '-') . '</td>';
            echo '<td>' . htmlspecialchars($entry['new_balance'] ?? '-') . '</td>';
            echo '<td>' . htmlspecialchars($entry['updated_by'] ?? '-') . '</td>';
            echo '</tr>';
          }
        } else {
          echo '<tr><td colspan="7" style="text-align:center;color:#999;">No leave balance changes yet.</td></tr>';
        }
        ?>
        </tbody>
      </table>
      
      <?php if (count($balance_changes) > 0): ?>
        <div class="pagination">
          <?php echo createPaginationLinks($balance_page, $balance_total_pages, 'balance_page', '&action_page=' . $action_page . '&announcement_page=' . $announcement_page); ?>
        </div>
      <?php endif; ?>
    </div>

    <!-- Announcement Changes Section -->
    <div class="card" style="margin-top: 32px;">
      <p style="font-weight: 600; font-size: 1.1em;">Announcement Changes (Created, Updated, Deleted)</p>
      <?php if (count($announcement_changes) > 0): ?>
        <div class="page-info">Showing <?php echo ($announcement_start + 1); ?>-<?php echo min($announcement_start + $per_page, count($announcement_changes)); ?> of <?php echo count($announcement_changes); ?> entries</div>
      <?php endif; ?>
      <table style="width:100%;margin-top:20px;">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Action</th>
            <th>Announcement Title</th>
            <th>By</th>
            <th>Pinned</th>
            <th>Expires At</th>
          </tr>
        </thead>
        <tbody>
        <?php
        if (count($announcement_page_data) > 0) {
          foreach ($announcement_page_data as $entry) {
            echo '<tr>';
            echo '<td>' . htmlspecialchars($entry['timestamp']) . '</td>';
            echo '<td>' . htmlspecialchars($entry['action']) . '</td>';
            echo '<td>' . htmlspecialchars($entry['title'] ?? '-') . '</td>';
            $by = $entry['created_by'] ?? $entry['updated_by'] ?? $entry['deleted_by'] ?? '-';
            echo '<td>' . htmlspecialchars($by) . '</td>';
            $pinned = $entry['pinned'] ?? '-';
            echo '<td>' . ($pinned === '-' ? '-' : ($pinned ? '✓ Yes' : '✗ No')) . '</td>';
            echo '<td>' . htmlspecialchars($entry['expires_at'] ?? '-') . '</td>';
            echo '</tr>';
          }
        } else {
          echo '<tr><td colspan="6" style="text-align:center;color:#999;">No announcement changes yet.</td></tr>';
        }
        ?>
        </tbody>
      </table>
      
      <?php if (count($announcement_changes) > 0): ?>
        <div class="pagination">
          <?php echo createPaginationLinks($announcement_page, $announcement_total_pages, 'announcement_page', '&action_page=' . $action_page . '&balance_page=' . $balance_page); ?>
        </div>
      <?php endif; ?>
    </div>
  </main>
</body>
</html>
