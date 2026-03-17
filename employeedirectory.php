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
    <a href="leave.php" class="nav-link">Leave</a>
    <a href="audit.php" class="nav-link">Audit Trail</a>
    <a href="logout.php" class="nav-link logout">Logout</a>
  </nav>
  <main class="main-content">
    <h1>Employee Directory</h1>
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
  <script>
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
