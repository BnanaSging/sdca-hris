<?php 
require 'auth-check.php'; 
require 'config.php';

$leave_file = __DIR__ . '/leaves.json';

// Initialize leaves file if it doesn't exist
if (!file_exists($leave_file)) {
    file_put_contents($leave_file, json_encode([], JSON_PRETTY_PRINT));
}

$message = '';
$error = '';

// Handle delete request
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'delete') {
    $leave_id = isset($_POST['leave_id']) ? intval($_POST['leave_id']) : 0;
    if ($leave_id > 0) {
      $leaves = json_decode(file_get_contents($leave_file), true);
      $original_count = count($leaves);
      $can_delete = false;
      foreach ($leaves as $leave) {
        if ($leave['id'] == $leave_id && $leave['user_id'] == $_SESSION['user_id']) {
          if (strtolower($leave['status']) === 'pending') {
            $can_delete = true;
          }
          break;
        }
      }
      if ($can_delete) {
        // Remove the leave with matching ID and user_id
        $leaves = array_filter($leaves, function($leave) use ($leave_id) {
          return !($leave['id'] == $leave_id && $leave['user_id'] == $_SESSION['user_id']);
        });
        file_put_contents($leave_file, json_encode(array_values($leaves), JSON_PRETTY_PRINT));
        $message = 'Leave application deleted successfully!';
      } else {
        $error = 'You can only delete pending leave applications. Approved or denied applications cannot be deleted.';
      }
    }
}

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $start_date = isset($_POST['start_date']) ? $_POST['start_date'] : '';
    $end_date = isset($_POST['end_date']) ? $_POST['end_date'] : '';
    $leave_type = isset($_POST['leave_type']) ? $_POST['leave_type'] : '';
    $reason = isset($_POST['reason']) ? $_POST['reason'] : '';
    
    if (empty($start_date) || empty($end_date) || empty($leave_type) || empty($reason)) {
        $error = 'Please fill in all fields';
    } else {
        $today = new DateTime('now');
        $today->setTime(0, 0, 0); // Set to midnight for fair comparison
        $start_date_obj = new DateTime($start_date);
        $end_date_obj = new DateTime($end_date);
        
        // Check based on leave type
        if (in_array($leave_type, ['Vacation', 'Maternity Leave', 'Paternity Leave'])) {
            // Advance leave: must be applied at least 3 days before start date
            $min_date = (clone $today)->modify('+3 days');
            if ($start_date_obj < $min_date) {
                $error = htmlspecialchars($leave_type) . ' must be applied at least 3 days in advance';
            }
        }
        // Gender-based leave rules
        if (in_array($leave_type, ['Maternity Leave', 'Paternity Leave'])) {
          $users = getUsers();
          $current_user = null;
          foreach ($users as $u) {
            if ($u['id'] == $_SESSION['user_id']) {
              $current_user = $u;
              break;
            }
          }
          if ($current_user && !empty($current_user['gender'])) {
            if ($leave_type === 'Maternity Leave' && strtolower($current_user['gender']) !== 'female') {
              $error = 'Only female users can apply for Maternity Leave.';
            }
            if ($leave_type === 'Paternity Leave' && strtolower($current_user['gender']) !== 'male') {
              $error = 'Only male users can apply for Paternity Leave.';
            }
          }
        }
      // Birthday Leave: only in birth month
      if ($leave_type === 'Birthday Leave') {
        $users = getUsers();
        $current_user = null;
        foreach ($users as $u) {
          if ($u['id'] == $_SESSION['user_id']) {
            $current_user = $u;
            break;
          }
        }
        if ($current_user && !empty($current_user['birthday'])) {
          $birth_month = (new DateTime($current_user['birthday']))->format('m');
          $apply_month = $start_date_obj->format('m');
          if ($birth_month !== $apply_month) {
            $error = 'Birthday Leave can only be applied during your birth month.';
          }
        } else {
          $error = 'Birthday not set for your account.';
        }
      }
        // Sick Leave, Personal Leave, Other: allow past dates (no advance requirement)
        
        if (!$error && $end_date_obj < $start_date_obj) {
            $error = 'End date must be after or equal to start date';
        }
        
        if (!$error) {
            $leaves = json_decode(file_get_contents($leave_file), true);
            
            $new_leave = [
                'id' => count($leaves) + 1,
                'user_id' => $_SESSION['user_id'],
                'employee_name' => $_SESSION['name'],
                'start_date' => $start_date,
                'end_date' => $end_date,
                'leave_type' => $leave_type,
                'reason' => $reason,
                'status' => 'Pending',
                'applied_date' => date('Y-m-d H:i:s')
            ];
            
            $leaves[] = $new_leave;
            file_put_contents($leave_file, json_encode($leaves, JSON_PRETTY_PRINT));
            $message = 'Leave application submitted successfully!';
        }
    }
}

// Get user's leave applications
$leaves = json_decode(file_get_contents($leave_file), true);
$user_leaves = array_filter($leaves, function($leave) {
    return $leave['user_id'] == $_SESSION['user_id'];
});

// Calculate remaining leaves

// Get user's leave package
$users = getUsers();
$current_user = null;
foreach ($users as $u) {
  if ($u['id'] == $_SESSION['user_id']) {
    $current_user = $u;
    break;
  }
}

$leave_types = [];
if ($current_user && isset($current_user['leave_package'])) {
  switch ($current_user['leave_package']) {
    case 'normal':
      $leave_types = [
        'Vacation' => 15,
        'Sick Leave' => 15,
        'Birthday Leave' => 1,
        'Personal Leave' => 15,
      ];
      break;
    case 'newly_hired':
      $leave_types = [
        'Vacation' => 3,
        'Sick Leave' => 3,
        'Birthday Leave' => 1,
      ];
      break;
    case 'custom':
      $leave_types = [
        'Vacation' => INF,
        'Sick Leave' => INF,
        'Birthday Leave' => INF,
        'Personal Leave' => INF,
        'Maternity Leave' => INF,
        'Paternity Leave' => INF,
        'Other' => INF
      ];
      break;
    default:
      $leave_types = [
        'Vacation' => 15,
        'Sick Leave' => 15,
        'Birthday Leave' => 1,
        'Personal Leave' => 15,
      ];
  }
} else {
  // fallback
  $leave_types = [
    'Vacation' => 15,
    'Sick Leave' => 15,
    'Birthday Leave' => 1,
    'Personal Leave' => 15,
  ];
}

$remaining_leaves = [];
foreach ($leave_types as $type => $total) {
    // If available leave is set in users.json, use it directly
    if ($current_user && isset($current_user['leaves_used'][$type])) {
        $remaining_leaves[$type] = $current_user['leaves_used'][$type];
    } else {
        // Fallback: calculate remaining as before
        $used = 0;
        foreach ($user_leaves as $leave) {
            if ($leave['leave_type'] === $type && $leave['status'] === 'Approved') {
                $start = new DateTime($leave['start_date']);
                $end = new DateTime($leave['end_date']);
                $interval = $start->diff($end);
                $used += $interval->days + 1; // +1 to include the end date
            }
        }
        $remaining_leaves[$type] = $total - $used;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HR Portal - My Leave</title>
  <link rel="stylesheet" href="style.css" />
  <style>
    .container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-section { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 3px 14px rgba(0,0,0,0.06); max-width: 500px; }
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; font-weight: 600; color: #374151; }
    .form-group input, .form-group select, .form-group textarea { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 10px; font-size: 0.95rem; box-sizing: border-box; }
    .form-group textarea { resize: vertical; min-height: 80px; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
    .btn { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn:hover { background: #1d4ed8; }
    .message { background: #dcfce7; color: #166534; padding: 12px; border-radius: 5px; margin-bottom: 15px; }
    .error-msg { background: #fee; color: #c33; padding: 12px; border-radius: 5px; margin-bottom: 15px; }
    .leave-row { padding: 15px; background: #f9fafb; border-left: 4px solid #3b82f6; margin-bottom: 10px; border-radius: 5px; }
    .leave-row h4 { margin: 0 0 10px 0; color: #1f2937; }
    .leave-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9rem; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }
    .status-pending { background: #fef08a; color: #854d0e; }
    .status-approved { background: #dcfce7; color: #166534; }
    .status-rejected { background: #fee; color: #c33; }
    .leave-card { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 3px 14px rgba(0,0,0,0.06); max-width: 500px; height: fit-content; }
    .leave-card h2 { margin: 0 0 15px 0; color: #1f2937; font-size: 1.3rem; }
    .leave-type-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .leave-type-row:last-child { border-bottom: none; }
    .leave-type-name { font-weight: 500; color: #374151; }
    .leave-count { font-size: 1.2rem; font-weight: 600; color: #2563eb; }
    .leave-count.low { color: #f59e0b; }
    .leave-count.critical { color: #ef4444; }
    .delete-btn { background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer; font-size: 0.85rem; font-weight: 600; }
    .delete-btn:hover { background: #dc2626; }
    @media (max-width: 1200px) {
      .container { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body class="page">
  <?php include 'sidebar.php'; ?>
  <main class="main-content">
    <h1>My Leave Applications</h1>
    
    <div class="container">
      <div class="form-section">
        <h2>Apply for Leave</h2>
        
        <?php if ($message): ?>
          <div class="message"><?php echo htmlspecialchars($message); ?></div>
        <?php endif; ?>
        
        <?php if ($error): ?>
          <div class="error-msg"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        
        <form method="POST">
          <div class="form-group">
            <label for="leave_type">Leave Type</label>
            <select id="leave_type" name="leave_type" required onchange="updateLeaveInfo()">
              <option value="">Select Leave Type</option>
              <option value="Vacation">Vacation</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Personal Leave">Personal Leave</option>
              <option value="Birthday Leave">Birthday Leave</option>
              <?php
                $users = getUsers();
                $current_user = null;
                foreach ($users as $u) {
                  if ($u['id'] == $_SESSION['user_id']) {
                    $current_user = $u;
                    break;
                  }
                }
                if ($current_user && isset($current_user['gender'])) {
                  if (strtolower($current_user['gender']) === 'female') {
                    echo '<option value="Maternity Leave">Maternity Leave</option>';
                  } else if (strtolower($current_user['gender']) === 'male') {
                    echo '<option value="Paternity Leave">Paternity Leave</option>';
                  }
                }
              ?>
              <option value="Other">Other</option>
            </select>
            <div id="leave-info-text" style="font-size: 0.85rem; color: #666; margin-top: 8px; padding: 8px; background: #f0f9ff; border-radius: 5px; display: none;"></div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="form-group">
              <label for="start_date">Start Date</label>
              <input type="date" id="start_date" name="start_date" required />
            </div>
            
            <div class="form-group">
              <label for="end_date">End Date</label>
              <input type="date" id="end_date" name="end_date" required />
            </div>
          </div>
          
          <div class="form-group">
            <label for="reason">Reason</label>
            <textarea id="reason" name="reason" placeholder="Please provide details about your leave..." required></textarea>
          </div>
          
          <button type="submit" class="btn">Submit Leave Request</button>
        </form>
      </div>
      
      <div class="leave-card">
        <h2>My Leave Balances</h2>
        <?php
        // Merge default and admin-added leave types
        $all_leave_types = $leave_types;
        if ($current_user && isset($current_user['leaves_used'])) {
          foreach ($current_user['leaves_used'] as $type => $val) {
            if (!isset($all_leave_types[$type])) {
              $all_leave_types[$type] = 0;
            }
          }
        }
        foreach ($all_leave_types as $type => $total):
          // Always use the value from leaves_used if present
          if ($current_user && isset($current_user['leaves_used'][$type])) {
            $remaining = $current_user['leaves_used'][$type];
          } else {
            $remaining = isset($remaining_leaves[$type]) ? $remaining_leaves[$type] : 0;
          }
          $class = '';
          if ($remaining <= 0) {
            $class = 'critical';
          } elseif ($remaining <= 3) {
            $class = 'low';
          }
        ?>
          <div class="leave-type-row">
            <span class="leave-type-name"><?php echo htmlspecialchars($type); ?></span>
            <span class="leave-count <?php echo $class; ?>"><?php echo $remaining; ?> days left</span>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
    
    <div style="margin-top: 30px;">
      <div class="form-section" style="max-width: 100%;">
        <h2>Your Leave Applications</h2>
        
        <?php if (empty($user_leaves)): ?>
          <p style="color: #999; text-align: center; padding: 20px;">No leave applications yet.</p>
        <?php else: ?>
          <?php foreach ($user_leaves as $leave): ?>
            <div class="leave-row">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <h4><?php echo htmlspecialchars($leave['leave_type']); ?></h4>
                <span class="status-badge status-<?php echo strtolower($leave['status']); ?>">
                  <?php echo htmlspecialchars($leave['status']); ?>
                </span>
              </div>
              <div class="leave-info">
                <div>
                  <strong>From:</strong> <?php echo htmlspecialchars(date('M d, Y', strtotime($leave['start_date']))); ?><br>
                  <strong>To:</strong> <?php echo htmlspecialchars(date('M d, Y', strtotime($leave['end_date']))); ?>
                </div>
                <div>
                  <strong>Applied:</strong> <?php echo htmlspecialchars(date('M d, Y H:i', strtotime($leave['applied_date']))); ?><br>
                  <strong>Reason:</strong> <?php echo htmlspecialchars($leave['reason']); ?>
                </div>
              </div>
              <?php if (strtolower($leave['status']) === 'pending'): ?>
              <div style="margin-top: 12px;">
                <form method="POST" style="display: inline;" onsubmit="return confirm('Are you sure you want to delete this leave application?');">
                  <input type="hidden" name="action" value="delete">
                  <input type="hidden" name="leave_id" value="<?php echo $leave['id']; ?>">
                  <button type="submit" class="delete-btn">Delete</button>
                </form>
              </div>
              <?php endif; ?>
            </div>
          <?php endforeach; ?>
        <?php endif; ?>
      </div>
    </div>
  </main>
  <script>
    function updateLeaveInfo() {
      const leaveType = document.getElementById('leave_type').value;
      const infoText = document.getElementById('leave-info-text');
      
      const leaveInfo = {
        'Vacation': '✓ Advanced leave: Must apply at least 3 days in advance',
        'Sick Leave': '✓ Retroactive leave: Can be applied for past dates',
        'Personal Leave': '✓ Retroactive leave: Can be applied for past dates',
        'Maternity Leave': '✓ Advanced leave: Must apply at least 3 days in advance',
        'Paternity Leave': '✓ Advanced leave: Must apply at least 3 days in advance',
        'Other': '✓ Retroactive leave: Can be applied for past dates'
      };
      
      if (leaveInfo[leaveType]) {
        infoText.textContent = leaveInfo[leaveType];
        infoText.style.display = 'block';
      } else {
        infoText.style.display = 'none';
      }
    }
  </script>
</body>
</html>
