<?php require 'auth-check.php'; require 'config.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HR Portal - Announcements</title>
  <link rel="stylesheet" href="style.css" />
  <style>
    .announcements-container {
      max-width: 900px;
    }
    .announcement-card {
      background: white;
      border-left: 4px solid #4CAF50;
      border-radius: 4px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: box-shadow 0.3s ease;
    }
    .announcement-card:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
    .announcement-card.pinned {
      border-left-color: #ff9800;
      background-color: #fffbf0;
    }
    .announcement-title {
      font-size: 20px;
      font-weight: bold;
      color: #333;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .announcement-pin-icon {
      font-size: 18px;
      color: #ff9800;
    }
    .announcement-content {
      color: #555;
      line-height: 1.6;
      margin-bottom: 10px;
    }
    .announcement-meta {
      font-size: 13px;
      color: #999;
      border-top: 1px solid #eee;
      padding-top: 10px;
    }
    .no-announcements {
      text-align: center;
      color: #999;
      padding: 40px 20px;
      background: white;
      border-radius: 4px;
    }
    .admin-banner {
      background-color: #e3f2fd;
      border-left: 4px solid #2196F3;
      padding: 12px 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .admin-banner a {
      color: #2196F3;
      text-decoration: none;
      font-weight: bold;
    }
    .admin-banner a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body class="page">
  <?php include 'sidebar.php'; ?>
  <main class="main-content">
    <h1>Announcements</h1>
    
    <?php
    // Check if user is admin
    $is_admin = false;
    if (isset($_SESSION['user_id'])) {
        $users = getUsers();
        foreach ($users as $u) {
            if ($u['id'] == $_SESSION['user_id']) {
                if ((isset($u['position']) && strtolower($u['position']) === 'admin') || (isset($u['email']) && strtolower($u['email']) === 'admin')) {
                    $is_admin = true;
                }
                break;
            }
        }
    }
    
    if ($is_admin) {
        echo '<div class="admin-banner">';
        echo '📋 You are an admin. <a href="admin-announcements.php">Manage announcements</a>';
        echo '</div>';
    }
    
    $announcements = getPublishedAnnouncements();

    // Always show pinned announcements first, then newest within each group.
    usort($announcements, function ($a, $b) {
      $aPinned = !empty($a['pinned']) ? 1 : 0;
      $bPinned = !empty($b['pinned']) ? 1 : 0;
      if ($aPinned !== $bPinned) {
        return $bPinned <=> $aPinned;
      }

      $aTime = isset($a['created_at']) ? strtotime($a['created_at']) : 0;
      $bTime = isset($b['created_at']) ? strtotime($b['created_at']) : 0;
      return $bTime <=> $aTime;
    });
    ?>
    
    <div class="announcements-container">
      <?php if (count($announcements) > 0): ?>
        <?php foreach ($announcements as $announcement): ?>
          <div class="announcement-card <?php echo $announcement['pinned'] ? 'pinned' : ''; ?>">
            <div class="announcement-title">
              <?php if ($announcement['pinned']): ?>
                <span class="announcement-pin-icon">📌</span>
              <?php endif; ?>
              <?php echo htmlspecialchars($announcement['title']); ?>
            </div>
            <div class="announcement-content">
              <?php echo nl2br(htmlspecialchars($announcement['content'])); ?>
            </div>
            <div class="announcement-meta">
              Posted by <?php echo htmlspecialchars($announcement['created_by']); ?> on 
              <?php echo date('M d, Y \a\t H:i', strtotime($announcement['created_at'])); ?>
            </div>
          </div>
        <?php endforeach; ?>
      <?php else: ?>
        <div class="no-announcements">
          <p>No announcements at the moment.</p>
        </div>
      <?php endif; ?>
    </div>
  </main>
</body>
</html>
