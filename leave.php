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
    <a href="leave.php" class="nav-link active">Leave</a>
    <a href="audit.php" class="nav-link">Audit Trail</a>
    <a href="logout.php" class="nav-link logout">Logout</a>
  </nav>
  <main class="main-content">
    <h1>Leave</h1>
    <div class="card"><table><thead><tr><th>Employee</th><th>Type</th><th>Status</th></tr></thead><tbody><tr><td>Jane Smith</td><td>Vacation</td><td>Approved</td></tr><tr><td>Michael Lee</td><td>Sick</td><td>Pending</td></tr></tbody></table></div>
  </main>
</body>
</html>
