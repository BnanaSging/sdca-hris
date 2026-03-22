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
    <div class="card">
      <div class="search-row">
        <input id="searchInput" placeholder="Search employees..." oninput="filterEmployees()" />
      </div>
      <table id="employeeTable">
        <thead>
          <tr><th>Name</th><th>Department</th><th>Role</th><th>Email</th></tr>
        </thead>
        <tbody>
          <?php 
          if (empty($users)) {
              echo '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #999;">No employees registered yet.</td></tr>';
          } else {
              foreach ($users as $user) {
                  echo '<tr>';
                  echo '<td>' . htmlspecialchars($user['name']) . '</td>';
                  echo '<td>' . htmlspecialchars($user['department']) . '</td>';
                  echo '<td>' . htmlspecialchars($user['position']) . '</td>';
                  echo '<td>' . htmlspecialchars($user['email']) . '</td>';
                  echo '</tr>';
              }
          }
          ?>
        </tbody>
      </table>
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
            <option value="Dean (Highest)">Dean</option>
            <option value="Program Chair / Department Head">Program Chair</option>
            <option value="Faculty Members (Professors / Instructors)">Faculty Members</option>
            <option value="Administrative Staff">Administrative Staff</option>
          </select>
          <label for="modal_department">Department</label>
          <input id="modal_department" name="department" type="text" required />
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
        function openModal() {
          document.getElementById('createUserModal').style.display = 'flex';
        }
        function closeModal() {
          document.getElementById('createUserModal').style.display = 'none';
        }
    function filterEmployees() {
      const filter = document.getElementById('searchInput').value.toLowerCase();
      const rows = document.querySelectorAll('#employeeTable tbody tr');
      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
      });
    }
  </script>
</body>
</html>
