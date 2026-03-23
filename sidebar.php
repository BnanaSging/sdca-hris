<?php
if (!isset($users)) {
  $users = function_exists('getUsers') ? getUsers() : [];
}
$show_leave_balances = false;
if (isset($_SESSION['user_id'])) {
  foreach ($users as $u) {
    if ($u['id'] == $_SESSION['user_id']) {
      if ((isset($u['role']) && strtolower($u['role']) === 'admin') || (isset($u['position']) && strtolower($u['position']) === 'admin') || (isset($u['email']) && strtolower($u['email']) === 'admin')) {
        $show_leave_balances = true;
      }
      break;
    }
  }
}
?>
<nav class="sidebar">
  <img src="image/logo-header.png" alt="HR Portal Logo" class="sidebar-logo">
  <a href="index.php" class="nav-link<?php if(basename($_SERVER['PHP_SELF'])=='index.php')echo' active';?>">Home</a>
  <a href="announcements.php" class="nav-link<?php if(basename($_SERVER['PHP_SELF'])=='announcements.php')echo' active';?>">Announcements</a>
  <a href="employeedirectory.php" class="nav-link<?php if(basename($_SERVER['PHP_SELF'])=='employeedirectory.php')echo' active';?>">Employee Directory</a>
  <a href="leave.php" class="nav-link<?php if(basename($_SERVER['PHP_SELF'])=='leave.php')echo' active';?>">Leave Request</a>
  <a href="myleave.php" class="nav-link<?php if(basename($_SERVER['PHP_SELF'])=='myleave.php')echo' active';?>">My Leave</a>
  <?php if ($show_leave_balances): ?>
    <a href="leavebalances.php" class="nav-link<?php if(basename($_SERVER['PHP_SELF'])=='leavebalances.php')echo' active';?>">Leave Balances</a>
  <?php endif; ?>
  <a href="audit.php" class="nav-link<?php if(basename($_SERVER['PHP_SELF'])=='audit.php')echo' active';?>">Audit Trail</a>
  <a href="logout.php" class="nav-link logout">Logout</a>
</nav>
