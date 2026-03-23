<?php
require 'auth-check.php';
require 'config.php';

// Only allow admin access
$users = getUsers();
$current_user = null;
foreach ($users as $u) {
  if ($u['id'] == $_SESSION['user_id']) {
    $current_user = $u;
    break;
  }
}
$is_admin = false;
if ($current_user && ((isset($current_user['role']) && strtolower($current_user['role']) === 'admin') || (isset($current_user['position']) && strtolower($current_user['position']) === 'admin') || (isset($current_user['email']) && strtolower($current_user['email']) === 'admin'))) {
  $is_admin = true;
}
if (!$is_admin) {
  header('Location: index.php');
  exit();
}

$users_file = __DIR__ . '/users.json';
$auditlog_file = __DIR__ . '/auditlog.json';
$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['user_id'], $_POST['leave_type'], $_POST['new_balance'])) {
  $user_id = intval($_POST['user_id']);
  $leave_type = $_POST['leave_type'];
  $new_balance = intval($_POST['new_balance']);
  $users = json_decode(file_get_contents($users_file), true);
  $found = false;
  // Define total allowed per leave type (should match myleave.php logic)
  $default_totals = [
    'Vacation' => 15,
    'Sick Leave' => 15,
    'Birthday Leave' => 1,
    'Personal Leave' => 15,
    'Maternity Leave' => 60,
    'Paternity Leave' => 7,
    'Other' => 0
  ];
  foreach ($users as &$user) {
    if ($user['id'] == $user_id) {
      if (!isset($user['leaves_used'])) $user['leaves_used'] = [];
      $old_balance = isset($user['leaves_used'][$leave_type]) ? $user['leaves_used'][$leave_type] : 0;
      // Store available leave directly
      $user['leaves_used'][$leave_type] = $new_balance;
      $found = true;
      // Audit log
      $auditlog = file_exists($auditlog_file) ? json_decode(file_get_contents($auditlog_file), true) : [];
      $auditlog[] = [
        'timestamp' => date('Y-m-d H:i:s'),
        'action' => 'Leave Balance Updated',
        'user_id' => $user_id,
        'leave_type' => $leave_type,
        'old_balance' => $old_balance,
        'new_balance' => $new_balance,
        'updated_by' => $_SESSION['name']
      ];
      file_put_contents($auditlog_file, json_encode($auditlog, JSON_PRETTY_PRINT));
      break;
    }
  }
  if ($found) {
    file_put_contents($users_file, json_encode($users, JSON_PRETTY_PRINT));
    $message = 'Leave balance updated successfully.';
  } else {
    $error = 'User not found.';
  }
}

$users = json_decode(file_get_contents($users_file), true);
$leave_types = ['Vacation', 'Sick Leave', 'Birthday Leave', 'Personal Leave', 'Maternity Leave', 'Paternity Leave', 'Other'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HR Portal - Leave Balances</title>
  <link rel="stylesheet" href="style.css" />
  <style>
    .admin-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .admin-table th, .admin-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
    .admin-table th { background: #2563eb; color: white; }
    .admin-table tr:nth-child(even) { background: #f9fafb; }
    .admin-table tr:hover { background: #e0e7ff; }
    .admin-form { display: flex; gap: 10px; justify-content: center; align-items: center; }
    .admin-form input[type='number'] { width: 70px; }
    .message { background: #dcfce7; color: #166534; padding: 12px; border-radius: 5px; margin-bottom: 15px; }
    .error-msg { background: #fee; color: #c33; padding: 12px; border-radius: 5px; margin-bottom: 15px; }
  </style>
</head>
<body class="page">
  <?php include 'sidebar.php'; ?>
  <main class="main-content">
      <h1>Manage Leave Balances</h1>
      <?php if ($message): ?>
        <div class="message"><?php echo htmlspecialchars($message); ?></div>
      <?php endif; ?>
      <?php if ($error): ?>
        <div class="error-msg"><?php echo htmlspecialchars($error); ?></div>
      <?php endif; ?>
      <div style="margin-bottom: 18px;">
        <input type="text" id="searchInput" placeholder="Search employee by name..." style="padding:8px; width:260px; border-radius:6px; border:1px solid #ccc; font-size:1em;">
      </div>
      <table class="admin-table" id="leaveBalancesTable">
        <thead>
          <tr>
            <th>Employee</th>
            <?php foreach ($leave_types as $type): ?>
              <th><?php echo htmlspecialchars($type); ?></th>
            <?php endforeach; ?>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($users as $user): ?>
            <tr class="employee-row">
              <td><?php echo htmlspecialchars($user['name']); ?></td>
              <?php foreach ($leave_types as $type): ?>
                <td>
                  <form method="POST" class="admin-form">
                    <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
                    <input type="hidden" name="leave_type" value="<?php echo htmlspecialchars($type); ?>">
                    <input type="number" name="new_balance" value="<?php echo isset($user['leaves_used'][$type]) ? $user['leaves_used'][$type] : 0; ?>" min="0" required>
                    <button type="submit" class="btn" style="padding:4px 10px; font-size:0.9em;">Save</button>
                  </form>
                </td>
              <?php endforeach; ?>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
      <script>
        document.getElementById('searchInput').addEventListener('input', function() {
          const filter = this.value.toLowerCase();
          document.querySelectorAll('.employee-row').forEach(function(row) {
            const name = row.querySelector('td').textContent.toLowerCase();
            row.style.display = name.includes(filter) ? '' : 'none';
          });
        });
      </script>
  </main>
</body>
</html>
