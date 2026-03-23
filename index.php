<?php require 'auth-check.php'; require 'config.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HR Portal - Home</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body class="page">
  <?php include 'sidebar.php'; ?>
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
      <?php
        $users = file_exists('users.json') ? json_decode(file_get_contents('users.json'), true) : [];
        $leaves = file_exists('leaves.json') ? json_decode(file_get_contents('leaves.json'), true) : [];
        $total_employees = count($users);
        $pending_leaves = 0;
        $leave_type_counts = [];
        $department_counts = [];
        foreach ($leaves as $leave) {
          if (isset($leave['status']) && strtolower($leave['status']) === 'pending') {
            $pending_leaves++;
          }
          $type = $leave['leave_type'] ?? 'Other';
          $leave_type_counts[$type] = ($leave_type_counts[$type] ?? 0) + 1;
        }
        foreach ($users as $user) {
          $dept = $user['department'] ?? 'Other';
          $department_counts[$dept] = ($department_counts[$dept] ?? 0);
        }
        foreach ($leaves as $leave) {
          $user = null;
          foreach ($users as $u) {
            if ($u['id'] == $leave['user_id']) { $user = $u; break; }
          }
          $dept = $user['department'] ?? 'Other';
          $department_counts[$dept] = ($department_counts[$dept] ?? 0) + 1;
        }
      ?>
      <a href="employeedirectory.php" class="card"><h3>Total Employees</h3><p><?php echo $total_employees; ?></p></a>
      <a href="leave.php" class="card"><h3>Pending Leaves</h3><p><?php echo $pending_leaves; ?></p></a>
      <?php
        $is_admin = false;
        if (isset($_SESSION['position']) && strtolower($_SESSION['position']) === 'admin') {
          $is_admin = true;
        } else if (isset($_SESSION['email']) && strtolower($_SESSION['email']) === 'admin') {
          $is_admin = true;
        }
        if ($is_admin):
      ?>
      <a href="audit.php" class="card"><h3>Open Audits</h3><p>2</p></a>
      <?php endif; ?>
    </div>

    <div class="stats-grid" style="margin-top: 30px; gap: 32px;">
      <div class="card" style="flex:1; min-width:320px;">
        <h3 style="margin-bottom:10px;">Leave Types Distribution</h3>
        <canvas id="leaveTypeChart" width="320" height="220"></canvas>
      </div>
      <div class="card" style="flex:1; min-width:320px;">
        <h3 style="margin-bottom:10px;">Leaves per Department</h3>
        <canvas id="deptChart" width="320" height="220"></canvas>
      </div>
    </div>
  </main>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    function toggleSidebar() {
      const sidebar = document.querySelector('.sidebar');
      const button = document.querySelector('.toggle-sidebar');
      sidebar.classList.toggle('hidden');
      button.classList.toggle('show');
    }

    // Data for charts (from PHP)
    const leaveTypeData = <?php echo json_encode(array_values($leave_type_counts)); ?>;
    const leaveTypeLabels = <?php echo json_encode(array_keys($leave_type_counts)); ?>;
    const deptData = <?php echo json_encode(array_values($department_counts)); ?>;
    const deptLabels = <?php echo json_encode(array_keys($department_counts)); ?>;

    // Pie chart for leave types
    new Chart(document.getElementById('leaveTypeChart').getContext('2d'), {
      type: 'pie',
      data: {
        labels: leaveTypeLabels,
        datasets: [{
          data: leaveTypeData,
          backgroundColor: [
            '#2563eb', '#f59e0b', '#10b981', '#ef4444', '#a21caf', '#f43f5e', '#0ea5e9', '#eab308', '#6366f1'
          ],
        }]
      },
      options: {
        plugins: { legend: { position: 'bottom' } },
        responsive: false,
        maintainAspectRatio: false
      }
    });

    // Bar chart for department
    new Chart(document.getElementById('deptChart').getContext('2d'), {
      type: 'bar',
      data: {
        labels: deptLabels,
        datasets: [{
          label: 'Leaves',
          data: deptData,
          backgroundColor: '#2563eb',
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        responsive: false,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, precision:0 } }
      }
    });
  </script>
</body>
</html>
