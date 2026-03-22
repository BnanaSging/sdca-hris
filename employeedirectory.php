<?php require 'auth-check.php'; 
require 'config.php';

// Get all registered users
$users = getUsers();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HR Portal - Employee Directory</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body class="page">
  <nav class="sidebar">
    <img src="image/logo-header.png" alt="HR Portal Logo" class="sidebar-logo">
    <a href="index.php" class="nav-link">Home</a>
    <a href="announcements.php" class="nav-link">Announcements</a>
    <a href="employeedirectory.php" class="nav-link active">Employee Directory</a>
    <a href="leave.php" class="nav-link">Leave Request</a>
    <a href="myleave.php" class="nav-link">My Leave</a>
    <a href="audit.php" class="nav-link">Audit Trail</a>
    <a href="logout.php" class="nav-link logout">Logout</a>
  </nav>
  <main class="main-content">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h1 style="margin: 0;">Employee Directory</h1>
      <button onclick="openModal()" class="btn" style="padding: 10px 18px; background: #007bff; color: #fff; border-radius: 5px; border: none; font-weight: bold; cursor: pointer;">+ Create User</button>
    </div>
    <p>Search employees by name, department, or role.</p>
    <div class="search-row" style="margin-bottom: 16px;">
      <input id="searchInput" placeholder="Search employees..." oninput="filterEmployees()" />
    </div>
    <div id="employeeCardGrid" style="display: flex; flex-wrap: wrap; gap: 24px;">
        <?php 
        if (empty($users)) {
          echo '<div style="text-align: center; padding: 20px; color: #999; width:100%;">No employees registered yet.</div>';
        } else {
          $self = null;
          $others = [];
          foreach ($users as $user) {
            if (isset($_SESSION['user_id']) && $_SESSION['user_id'] == $user['id']) {
              $self = $user;
            } else {
              $others[] = $user;
            }
          }
          $ordered = array_merge($self ? [$self] : [], $others);
          $hierarchy = [
            'VPAA' => 1,
            'Dean (Highest)' => 2,
            'Program Chair / Department Head' => 3,
            'Faculty Members (Professors / Instructors)' => 4,
            'Administrative Staff' => 5
          ];
          $current_user = null;
          foreach ($users as $u) {
            if (isset($_SESSION['user_id']) && $_SESSION['user_id'] == $u['id']) {
              $current_user = $u;
              break;
            }
          }
          foreach ($ordered as $user) {
              $is_self = (isset($_SESSION['user_id']) && $_SESSION['user_id'] == $user['id']);
              $gender = isset($user['gender']) ? strtolower($user['gender']) : '';
              $avatar = $gender === 'female' ? 'woman.png' : 'man.png';
              $cardStyle = $is_self ? 'background:#e0f7fa; font-weight:bold;' : '';
              echo '<div class="employee-card" style="width:260px; min-height:320px; background:#fff; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.07); padding:22px 18px 16px 18px; position:relative; ' . $cardStyle . '">';
              echo '<div style="display:flex; flex-direction:column; align-items:center;">';
              echo '<img src="image/' . $avatar . '" alt="Avatar" style="width:70px; height:70px; border-radius:50%; background:#f0f0f0; margin-bottom:12px;">';
              echo '<div style="font-size:1.15em; font-weight:600; margin-bottom:2px;">' . htmlspecialchars($user['name']) . '</div>';
              echo '<div style="color:#666; font-size:0.98em; margin-bottom:8px;">' . htmlspecialchars($user['position']) . '</div>';
              echo '<div style="color:#888; font-size:0.95em; margin-bottom:8px;">' . htmlspecialchars($user['department']) . '</div>';
              echo '<div style="color:#888; font-size:0.95em; margin-bottom:8px;">' . htmlspecialchars($user['email']) . '</div>';
              echo '<div style="color:#888; font-size:0.95em; margin-bottom:8px;">Gender: ' . htmlspecialchars(ucfirst($gender)) . '</div>';
              echo '<div style="color:#888; font-size:0.95em; margin-bottom:8px;">Birthday: ' . (isset($user['birthday']) ? htmlspecialchars($user['birthday']) : '-') . '</div>';
              $can_add_leave = false;
              if (!$is_self && $current_user && isset($hierarchy[$current_user['position']]) && isset($hierarchy[$user['position']])) {
                if ($hierarchy[$current_user['position']] < $hierarchy[$user['position']]) {
                  $can_add_leave = true;
                }
              }
              if ($can_add_leave) {
                echo '<button class="employee-link btn" data-userid="' . $user['id'] . '" data-name="' . htmlspecialchars($user['name']) . '" data-email="' . htmlspecialchars($user['email']) . '" data-department="' . htmlspecialchars($user['department']) . '" data-position="' . htmlspecialchars($user['position']) . '" data-leavepackage="' . (isset($user['leave_package']) ? htmlspecialchars($user['leave_package']) : '') . '" data-gender="' . (isset($user['gender']) ? htmlspecialchars($user['gender']) : '') . '" data-birthday="' . (isset($user['birthday']) ? htmlspecialchars($user['birthday']) : '') . '" style="margin-top:10px; background:#007bff; color:#fff; border:none; border-radius:5px; padding:7px 16px; cursor:pointer;">View Details</button>';
              }
              echo '</div>';
              echo '</div>';
          }
        }
        ?>
    </div>
  </main>
    <!-- Modal for Create User -->
    <div id="createUserModal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.4); z-index:1000; justify-content:center; align-items:center;">
      <div style="background:#fff; padding:30px 24px 18px 24px; border-radius:8px; min-width:320px; max-width:90vw; position:relative;">
        <h2 style="margin-top:0;">Create User</h2>
        <form id="createUserForm" action="register-handler.php" method="post" style="display:flex; flex-direction:column; gap:10px;">
          <label for="modal_name">Full Name</label>
          <input id="modal_name" name="name" type="text" required />
          <label for="modal_email">Email</label>
          <input id="modal_email" name="email" type="email" required />
          <label for="modal_position">Position</label>
          <select id="modal_position" name="position" required>
            <option value="VPAA">VPAA</option>
            <option value="Dean (Highest)">Dean (Highest)</option>
            <option value="Program Chair / Department Head">Program Chair / Department Head</option>
            <option value="Faculty Members (Professors / Instructors)">Faculty Members (Professors / Instructors)</option>
            <option value="Administrative Staff">Administrative Staff</option>
          </select>
          <label for="modal_department">Department</label>
          <input id="modal_department" name="department" type="text" required />

          <label for="modal_birthday">Birthday</label>
          <input id="modal_birthday" name="birthday" type="date" required />

          <label for="modal_gender">Gender</label>
          <select id="modal_gender" name="gender" required>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <label for="modal_leave_package">Leave Package</label>
          <select id="modal_leave_package" name="leave_package" required>
            <option value="normal">Normal Employee Package (15 VL, 15 SL, 1 BL, 15 PL)</option>
            <option value="newly_hired">Newly Hired (3 VL, 3 SL, 1 BL)</option>
            <option value="custom">Custom Package</option>
          </select>
          <label for="modal_password">Password</label>
          <input id="modal_password" name="password" type="password" required />
          <label for="modal_confirm_password">Confirm Password</label>
          <input id="modal_confirm_password" name="confirm_password" type="password" required />
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px;">
            <button type="button" onclick="closeModal()" style="background:#ccc; color:#222; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">Cancel</button>
            <button type="submit" style="background:#007bff; color:#fff; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">Create</button>
          </div>
        </form>
        <button onclick="closeModal()" style="position:absolute; top:8px; right:12px; background:none; border:none; font-size:1.5em; color:#888; cursor:pointer;">&times;</button>
      </div>
    </div>
  <script>
            // Employee details modal logic
            document.addEventListener('DOMContentLoaded', function() {
              document.querySelectorAll('.employee-link').forEach(function(link) {
                link.addEventListener('click', function(e) {
                  e.preventDefault();
                  const modal = document.getElementById('employeeDetailModal');
                  document.getElementById('empDetailName').innerText = this.dataset.name;
                  document.getElementById('empDetailEmail').innerText = this.dataset.email;
                  document.getElementById('empDetailDepartment').innerText = this.dataset.department;
                  document.getElementById('empDetailPosition').innerText = this.dataset.position;
                  document.getElementById('empDetailLeavePackage').innerText = this.dataset.leavepackage;
                  document.getElementById('empDetailGender').innerText = this.dataset.gender;
                  document.getElementById('empDetailBirthday').innerText = this.dataset.birthday;
                  document.getElementById('addLeaveUserId').value = this.dataset.userid;
                  modal.style.display = 'flex';
                });
              });
              document.getElementById('closeEmployeeDetailModal').onclick = function() {
                document.getElementById('employeeDetailModal').style.display = 'none';
              };
            });
        function openModal() {
          document.getElementById('createUserModal').style.display = 'flex';
        }
        function closeModal() {
          document.getElementById('createUserModal').style.display = 'none';
        }
    function filterEmployees() {
      const filter = document.getElementById('searchInput').value.toLowerCase();
      const cards = document.querySelectorAll('.employee-card');
      cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(filter) ? '' : 'none';
      });
    }
  </script>
</body>

<!-- Employee Detail Modal -->
<div id="employeeDetailModal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.4); z-index:1001; justify-content:center; align-items:center;">
  <div style="background:#fff; padding:30px 24px 18px 24px; border-radius:8px; min-width:320px; max-width:90vw; position:relative; min-height:200px;">
    <h2 style="margin-top:0;">Employee Details</h2>
    <div><strong>Name:</strong> <span id="empDetailName"></span></div>
    <div><strong>Email:</strong> <span id="empDetailEmail"></span></div>
    <div><strong>Department:</strong> <span id="empDetailDepartment"></span></div>
    <div><strong>Position:</strong> <span id="empDetailPosition"></span></div>
    <div><strong>Leave Package:</strong> <span id="empDetailLeavePackage"></span></div>
    <div><strong>Gender:</strong> <span id="empDetailGender"></span></div>
    <div><strong>Birthday:</strong> <span id="empDetailBirthday"></span></div>
    <form id="addLeaveBalanceForm" action="add-leave-balance.php" method="post" style="margin-top:18px;">
      <input type="hidden" name="user_id" id="addLeaveUserId" value="">
      <label for="leaveTypeSelect"><strong>Leave Type:</strong></label>
      <select name="leave_type" id="leaveTypeSelect" required>
        <option value="Vacation">Vacation</option>
        <option value="Sick Leave">Sick Leave</option>
        <option value="Personal Leave">Personal Leave</option>
        <option value="Birthday Leave">Birthday Leave</option>
        <option value="Maternity Leave">Maternity Leave</option>
        <option value="Paternity Leave">Paternity Leave</option>
        <option value="Other">Other</option>
      </select>
      <label for="leaveAmountInput"><strong>Amount to Add:</strong></label>
      <input type="number" name="amount" id="leaveAmountInput" min="1" required style="width:80px;">
      <button type="submit" class="btn" style="margin-left:10px;">Add Leave Balance</button>
    </form>
    <button id="closeEmployeeDetailModal" style="position:absolute; top:8px; right:12px; background:none; border:none; font-size:1.5em; color:#888; cursor:pointer;">&times;</button>
  </div>
</div>
</body>
</html>
