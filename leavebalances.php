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

$departments_map = [];
foreach ($users as $user) {
  $department = isset($user['department']) && trim($user['department']) !== '' ? trim($user['department']) : 'Unassigned';
  $departments_map[$department] = true;
}
$departments = array_keys($departments_map);
natcasesort($departments);
$departments = array_values($departments);

// Helper function to get total leaves for a user's package
function getTotalLeavesForPackage($package, $leave_type) {
  $totals = [
    'normal' => [
      'Vacation' => 15,
      'Sick Leave' => 15,
      'Birthday Leave' => 1,
      'Personal Leave' => 15,
      'Maternity Leave' => 0,
      'Paternity Leave' => 0,
      'Other' => 0
    ],
    'newly_hired' => [
      'Vacation' => 3,
      'Sick Leave' => 3,
      'Birthday Leave' => 1,
      'Personal Leave' => 0,
      'Maternity Leave' => 0,
      'Paternity Leave' => 0,
      'Other' => 0
    ],
    'custom' => [
      'Vacation' => PHP_INT_MAX,
      'Sick Leave' => PHP_INT_MAX,
      'Birthday Leave' => PHP_INT_MAX,
      'Personal Leave' => PHP_INT_MAX,
      'Maternity Leave' => PHP_INT_MAX,
      'Paternity Leave' => PHP_INT_MAX,
      'Other' => PHP_INT_MAX
    ]
  ];
  
  $pkg = isset($totals[$package]) ? $package : 'normal';
  return isset($totals[$pkg][$leave_type]) ? $totals[$pkg][$leave_type] : 0;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HR Portal - Leave Balances</title>
  <link rel="stylesheet" href="style.css" />
  <style>
    .message { background: #dcfce7; color: #166534; padding: 12px; border-radius: 5px; margin-bottom: 15px; }
    .error-msg { background: #fee; color: #c33; padding: 12px; border-radius: 5px; margin-bottom: 15px; }
    .filter-row { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin-bottom: 20px; }
    .search-box { padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; width: 300px; margin-bottom: 0; }
    .department-filter { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
    .department-filter-label { font-weight: 600; color: #374151; }
    .department-options { display: flex; flex-wrap: wrap; gap: 10px; }
    .department-option { display: inline-flex; align-items: center; gap: 6px; font-size: 0.92em; color: #374151; }
    .department-option input[type="radio"] { cursor: pointer; }
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; margin-top: 20px; }
    .balance-card { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 3px 14px rgba(0,0,0,0.06); transition: transform 0.2s, box-shadow 0.2s; }
    .balance-card:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
    .card-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px; }
    .card-name { font-size: 1.1em; font-weight: 600; color: #1f2937; }
    .card-leave-type { font-size: 0.9em; color: #666; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
    .leave-balance-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
    .leave-label { color: #374151; font-size: 0.9em; }
    .leave-days { font-weight: 600; color: #2563eb; font-size: 1em; }
    .edit-btn { background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9em; font-weight: 600; margin-top: 15px; width: 100%; }
    .edit-btn:hover { background: #1d4ed8; }
    .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; }
    .modal.active { display: flex; justify-content: center; align-items: center; }
    .modal-content { background: white; padding: 30px; border-radius: 8px; width: 90%; max-width: 500px; }
    .modal-header { font-size: 1.3em; font-weight: 600; margin-bottom: 20px; }
    .modal-field { margin-bottom: 15px; }
    .modal-field label { display: block; font-weight: 600; margin-bottom: 5px; }
    .modal-field input { width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; }
    .modal-buttons { display: flex; gap: 10px; margin-top: 20px; }
    .modal-btn-save { background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; flex: 1; }
    .modal-btn-save:hover { background: #218838; }
    .modal-btn-close { background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; flex: 1; }
    .modal-btn-close:hover { background: #5a6268; }
    @media (max-width: 640px) {
      .search-box { width: 100%; }
      .filter-row { align-items: stretch; }
    }
  </style>
</head>
<body class="page">
  <?php include 'sidebar.php'; ?>
  <main class="main-content">
    <h1>Leave Balances</h1>
    
    <?php if ($message): ?>
      <div class="message"><?php echo htmlspecialchars($message); ?></div>
    <?php endif; ?>
    
    <?php if ($error): ?>
      <div class="error-msg"><?php echo htmlspecialchars($error); ?></div>
    <?php endif; ?>
    
    <div class="filter-row">
      <input type="text" class="search-box" id="searchInput" placeholder="Search employee..." />
      <div class="department-filter">
        <span class="department-filter-label">Department:</span>
        <div class="department-options" id="departmentOptions">
          <label class="department-option"><input type="radio" name="departmentFilter" value="all" checked> All</label>
          <?php foreach ($departments as $department): ?>
            <label class="department-option">
              <input type="radio" name="departmentFilter" value="<?php echo htmlspecialchars(strtolower($department)); ?>">
              <?php echo htmlspecialchars($department); ?>
            </label>
          <?php endforeach; ?>
        </div>
      </div>
    </div>
    
    <div class="cards-grid" id="cardsContainer">
      <?php foreach ($users as $user): ?>
        <div
          class="balance-card employee-row"
          data-employee-name="<?php echo htmlspecialchars(strtolower($user['name']), ENT_QUOTES); ?>"
          data-department="<?php echo htmlspecialchars(strtolower(isset($user['department']) && trim($user['department']) !== '' ? trim($user['department']) : 'Unassigned'), ENT_QUOTES); ?>"
        >
          <div class="card-header">
            <span class="card-name"><?php echo htmlspecialchars($user['name']); ?></span>
          </div>
          <?php
            $package = isset($user['leave_package']) ? $user['leave_package'] : 'normal';
            foreach (['Vacation', 'Sick Leave', 'Personal Leave', 'Birthday Leave'] as $type):
              $total = getTotalLeavesForPackage($package, $type);
              $used = isset($user['leaves_used'][$type]) ? $user['leaves_used'][$type] : 0;
              $remaining = ($total === PHP_INT_MAX) ? '∞' : ($total - $used);
          ?>
            <div class="leave-balance-row">
              <span class="leave-label"><?php echo htmlspecialchars($type); ?></span>
              <span class="leave-days"><?php echo htmlspecialchars($remaining); ?> days</span>
            </div>
          <?php endforeach; ?>
          <button class="edit-btn" onclick="openEditModal(<?php echo $user['id']; ?>, '<?php echo htmlspecialchars($user['name']); ?>')">Edit Balance</button>
        </div>
      <?php endforeach; ?>
    </div>
  </main>

  <!-- Edit Modal -->
  <div class="modal" id="editModal">
    <div class="modal-content">
      <div class="modal-header" id="modalTitle"></div>
      <form method="POST" id="editForm">
        <div class="modal-field">
          <label for="modalLeaveType">Leave Type</label>
          <select id="modalLeaveType" name="leave_type" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
            <option value="Vacation">Vacation</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Personal Leave">Personal Leave</option>
            <option value="Birthday Leave">Birthday Leave</option>
            <option value="Maternity Leave">Maternity Leave</option>
            <option value="Paternity Leave">Paternity Leave</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="modal-field">
          <label for="modalUsedDays">Days Used</label>
          <input type="number" id="modalUsedDays" name="new_balance" min="0" required />
        </div>
        <div class="modal-field" id="remainingDisplay" style="padding: 8px; background: #f0f9ff; border-radius: 4px; font-weight: 600; color: #2563eb;"></div>
        <input type="hidden" id="modalUserId" name="user_id" />
        <div class="modal-buttons">
          <button type="submit" class="modal-btn-save">Save</button>
          <button type="button" class="modal-btn-close" onclick="closeEditModal()">Cancel</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    const usersData = <?php echo json_encode(array_map(function($u) {
      return [
        'id' => $u['id'],
        'name' => $u['name'],
        'leaves_used' => isset($u['leaves_used']) ? $u['leaves_used'] : [],
        'leave_package' => isset($u['leave_package']) ? $u['leave_package'] : 'normal'
      ];
    }, $users)); ?>;

    const packageTotals = {
      'normal': { 'Vacation': 15, 'Sick Leave': 15, 'Personal Leave': 15, 'Birthday Leave': 1, 'Maternity Leave': 0, 'Paternity Leave': 0, 'Other': 0 },
      'newly_hired': { 'Vacation': 3, 'Sick Leave': 3, 'Personal Leave': 0, 'Birthday Leave': 1, 'Maternity Leave': 0, 'Paternity Leave': 0, 'Other': 0 },
      'custom': { 'Vacation': 999999, 'Sick Leave': 999999, 'Personal Leave': 999999, 'Birthday Leave': 999999, 'Maternity Leave': 999999, 'Paternity Leave': 999999, 'Other': 999999 }
    };

    function openEditModal(userId, userName) {
      const user = usersData.find(u => u.id === userId);
      document.getElementById('modalTitle').textContent = 'Edit Leave - ' + userName;
      document.getElementById('modalUserId').value = userId;
      document.getElementById('editModal').classList.add('active');
      
      // Load current used days for the first leave type
      const defaultLeaveType = 'Vacation';
      const currentUsed = user.leaves_used[defaultLeaveType] || 0;
      document.getElementById('modalUsedDays').value = currentUsed;
      document.getElementById('modalLeaveType').value = defaultLeaveType;
      
      updateRemaining(userId);
    }

    function closeEditModal() {
      document.getElementById('editModal').classList.remove('active');
    }

    function updateRemaining(userId) {
      const user = usersData.find(u => u.id === userId);
      const leaveType = document.getElementById('modalLeaveType').value;
      const usedDays = parseInt(document.getElementById('modalUsedDays').value) || 0;
      
      const pkg = user.leave_package || 'normal';
      const totals = packageTotals[pkg] || packageTotals['normal'];
      const total = totals[leaveType] || 0;
      const remaining = total - usedDays;
      
      const display = total >= 999999 ? '∞ (Unlimited)' : (remaining >= 0 ? remaining : 0);
      document.getElementById('remainingDisplay').textContent = 'Remaining: ' + display + ' days left';
    }

    document.getElementById('modalLeaveType').addEventListener('change', function() {
      const userId = parseInt(document.getElementById('modalUserId').value);
      const user = usersData.find(u => u.id === userId);
      const leaveType = this.value;
      const currentUsed = user.leaves_used[leaveType] || 0;
      document.getElementById('modalUsedDays').value = currentUsed;
      updateRemaining(userId);
    });

    document.getElementById('modalUsedDays').addEventListener('input', function() {
      const userId = parseInt(document.getElementById('modalUserId').value);
      updateRemaining(userId);
    });

    function applyFilters() {
      const filter = document.getElementById('searchInput').value.toLowerCase();
      const selectedDepartment = document.querySelector('input[name="departmentFilter"]:checked')?.value || 'all';

      document.querySelectorAll('.employee-row').forEach(function(card) {
        const employeeName = card.getAttribute('data-employee-name');
        const employeeDepartment = card.getAttribute('data-department');
        const matchesSearch = employeeName.includes(filter);
        const matchesDepartment = selectedDepartment === 'all' || employeeDepartment === selectedDepartment;
        card.style.display = (matchesSearch && matchesDepartment) ? '' : 'none';
      });
    }

    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.querySelectorAll('input[name="departmentFilter"]').forEach(function(radio) {
      radio.addEventListener('change', applyFilters);
    });

    document.getElementById('editModal').addEventListener('click', function(e) {
      if (e.target === this) closeEditModal();
    });
  </script>
</body>
</html>
