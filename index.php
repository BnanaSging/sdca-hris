<?php require 'auth-check.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HR Portal - Home</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body class="page">
  <nav class="sidebar">
    <img src="image/logo-header.png" alt="HR Portal Logo" class="sidebar-logo">
    <a href="index.php" class="nav-link active">Home</a>
    <a href="announcements.php" class="nav-link">Announcements</a>
    <a href="employeedirectory.php" class="nav-link">Employee Directory</a>
    <a href="leave.php" class="nav-link">Leave</a>
    <a href="audit.php" class="nav-link">Audit Trail</a>
    <a href="logout.php" class="nav-link logout">Logout</a>
  </nav>
  <main class="main-content">
    <h1>Home</h1>
    <p>Welcome to the HR Portal. Use the sidebar to navigate.</p>
    <div class="card user-card">
      <p class="date-small">March 18, 2026</p>
      <h3>Welcome, <?php echo isset($_SESSION['name']) ? htmlspecialchars($_SESSION['name']) : 'Guest'; ?></h3>
      <p><strong>Position:</strong> <?php echo isset($_SESSION['position']) ? htmlspecialchars($_SESSION['position']) : 'N/A'; ?></p>
      <p><strong>Department:</strong> <?php echo isset($_SESSION['department']) ? htmlspecialchars($_SESSION['department']) : 'N/A'; ?></p>
    </div>
    <div class="stats-grid">
      <a href="employeedirectory.php" class="card"><h3>Total Employees</h3><p>158</p></a>
      <a href="leave.php" class="card"><h3>Pending Leaves</h3><p>12</p></a>
      <a href="audit.php" class="card"><h3>Open Audits</h3><p>2</p></a>
    </div>
  </main>
  <script>
    function toggleSidebar() {
      const sidebar = document.querySelector('.sidebar');
      const button = document.querySelector('.toggle-sidebar');
      sidebar.classList.toggle('hidden');
      button.classList.toggle('show');
    }
  </script>
</body>
</html>
