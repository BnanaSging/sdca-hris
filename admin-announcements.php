<?php 
ob_start();
require 'auth-check.php'; 
require 'config.php'; 

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

// Redirect non-admins
if (!$is_admin) {
    ob_end_clean();
    header('Location: announcements.php');
    exit();
}

// Handle form submissions
$message = '';
$message_type = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action'])) {
        if ($_POST['action'] === 'create') {
            $title = trim($_POST['title']);
            $content = trim($_POST['content']);
            $pinned = isset($_POST['pinned']) ? 1 : 0;
            $expires_at = !empty($_POST['expires_at']) ? $_POST['expires_at'] : null;
            
            if (!empty($title) && !empty($content)) {
                createAnnouncement($title, $content, $_SESSION['name'], $pinned, $expires_at);
                // Log to audit trail
                $auditlog_file = 'auditlog.json';
                $auditlog = file_exists($auditlog_file) ? json_decode(file_get_contents($auditlog_file), true) : [];
                $auditlog[] = [
                    'timestamp' => date('Y-m-d H:i:s'),
                    'action' => 'Announcement Created',
                    'title' => $title,
                    'created_by' => $_SESSION['name'],
                    'pinned' => $pinned,
                    'expires_at' => $expires_at
                ];
                file_put_contents($auditlog_file, json_encode($auditlog, JSON_PRETTY_PRINT));
                $message = 'Announcement created successfully!';
                $message_type = 'success';
            } else {
                $message = 'Title and content are required!';
                $message_type = 'error';
            }
        } elseif ($_POST['action'] === 'update') {
            $id = $_POST['id'];
            $title = trim($_POST['title']);
            $content = trim($_POST['content']);
            $pinned = isset($_POST['pinned']) ? 1 : 0;
            $expires_at = !empty($_POST['expires_at']) ? $_POST['expires_at'] : null;
            
            if (!empty($title) && !empty($content)) {
                updateAnnouncement($id, $title, $content, $pinned, $expires_at);
                // Log to audit trail
                $auditlog_file = 'auditlog.json';
                $auditlog = file_exists($auditlog_file) ? json_decode(file_get_contents($auditlog_file), true) : [];
                $auditlog[] = [
                    'timestamp' => date('Y-m-d H:i:s'),
                    'action' => 'Announcement Updated',
                    'announcement_id' => $id,
                    'title' => $title,
                    'updated_by' => $_SESSION['name'],
                    'pinned' => $pinned,
                    'expires_at' => $expires_at
                ];
                file_put_contents($auditlog_file, json_encode($auditlog, JSON_PRETTY_PRINT));
                $message = 'Announcement updated successfully!';
                $message_type = 'success';
            } else {
                $message = 'Title and content are required!';
                $message_type = 'error';
            }
        } elseif ($_POST['action'] === 'delete') {
            $id = $_POST['id'];
            $announcement = getAnnouncementById($id);
            deleteAnnouncement($id);
            // Log to audit trail
            $auditlog_file = 'auditlog.json';
            $auditlog = file_exists($auditlog_file) ? json_decode(file_get_contents($auditlog_file), true) : [];
            $auditlog[] = [
                'timestamp' => date('Y-m-d H:i:s'),
                'action' => 'Announcement Deleted',
                'announcement_id' => $id,
                'title' => $announcement ? $announcement['title'] : 'Unknown',
                'deleted_by' => $_SESSION['name']
            ];
            file_put_contents($auditlog_file, json_encode($auditlog, JSON_PRETTY_PRINT));
            $message = 'Announcement deleted successfully!';
            $message_type = 'success';
        }
    }
}

// Get announcement for editing if id is in URL
$edit_announcement = null;
if (isset($_GET['edit'])) {
    $edit_announcement = getAnnouncementById($_GET['edit']);
}

$announcements = getAnnouncements();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HR Portal - Manage Announcements</title>
  <link rel="stylesheet" href="style.css" />
  <style>
    .form-group {
      margin-bottom: 15px;
      display: flex;
      flex-direction: column;
    }
    .form-group label {
      font-weight: bold;
      margin-bottom: 5px;
      color: #333;
    }
    .form-group input,
    .form-group textarea {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: inherit;
      font-size: 14px;
    }
    .form-group textarea {
      resize: vertical;
      min-height: 120px;
    }
    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #4CAF50;
      box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
    }
    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .checkbox-group input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
    .btn-group {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.3s;
    }
    .btn-primary {
      background-color: #4CAF50;
      color: white;
    }
    .btn-primary:hover {
      background-color: #45a049;
    }
    .btn-secondary {
      background-color: #999;
      color: white;
    }
    .btn-secondary:hover {
      background-color: #777;
    }
    .btn-danger {
      background-color: #f44336;
      color: white;
    }
    .btn-danger:hover {
      background-color: #da190b;
    }
    .btn-warning {
      background-color: #ff9800;
      color: white;
    }
    .btn-warning:hover {
      background-color: #e68900;
    }
    .message {
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 15px;
    }
    .message.success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .message.error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    .announcement-list {
      margin-top: 30px;
    }
    .announcement-item {
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      margin-bottom: 15px;
    }
    .announcement-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 10px;
    }
    .announcement-title {
      font-size: 18px;
      font-weight: bold;
      color: #333;
    }
    .announcement-meta {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    .announcement-status {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .badge {
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: bold;
    }
    .badge-pinned {
      background-color: #ffc107;
      color: #333;
    }
    .badge-published {
      background-color: #28a745;
      color: white;
    }
    .announcement-actions {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }
    .form-card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 20px;
      margin-bottom: 30px;
    }
  </style>
</head>
<body class="page">
  <?php include 'sidebar.php'; ?>
  <main class="main-content">
    <h1><?php echo $edit_announcement ? 'Edit Announcement' : 'Manage Announcements'; ?></h1>
    
    <?php if (!empty($message)): ?>
      <div class="message <?php echo $message_type; ?>">
        <?php echo htmlspecialchars($message); ?>
      </div>
    <?php endif; ?>

    <div class="form-card">
      <form method="POST">
        <input type="hidden" name="action" value="<?php echo $edit_announcement ? 'update' : 'create'; ?>">
        <?php if ($edit_announcement): ?>
          <input type="hidden" name="id" value="<?php echo $edit_announcement['id']; ?>">
        <?php endif; ?>

        <div class="form-group">
          <label for="title">Title *</label>
          <input 
            type="text" 
            id="title" 
            name="title" 
            required
            value="<?php echo $edit_announcement ? htmlspecialchars($edit_announcement['title']) : ''; ?>"
          >
        </div>

        <div class="form-group">
          <label for="content">Content *</label>
          <textarea 
            id="content" 
            name="content" 
            required
          ><?php echo $edit_announcement ? htmlspecialchars($edit_announcement['content']) : ''; ?></textarea>
        </div>

        <div class="form-group">
          <label for="expires_at">Expiration Date (optional)</label>
          <input 
            type="datetime-local" 
            id="expires_at" 
            name="expires_at"
            value="<?php echo $edit_announcement && $edit_announcement['expires_at'] ? htmlspecialchars($edit_announcement['expires_at']) : ''; ?>"
          >
        </div>

        <div class="form-group">
          <div class="checkbox-group">
            <input 
              type="checkbox" 
              id="pinned" 
              name="pinned"
              <?php echo ($edit_announcement && $edit_announcement['pinned']) ? 'checked' : ''; ?>
            >
            <label for="pinned" style="margin-bottom: 0;">Pin this announcement (appears at top)</label>
          </div>
        </div>

        <div class="btn-group">
          <button type="submit" class="btn btn-primary">
            <?php echo $edit_announcement ? 'Update Announcement' : 'Create Announcement'; ?>
          </button>
          <?php if ($edit_announcement): ?>
            <a href="admin-announcements.php" class="btn btn-secondary">Cancel</a>
          <?php endif; ?>
        </div>
      </form>
    </div>

    <div class="announcement-list">
      <h2>All Announcements</h2>
      <?php if (count($announcements) > 0): ?>
        <?php foreach ($announcements as $announcement): ?>
          <div class="announcement-item">
            <div class="announcement-header">
              <div>
                <div class="announcement-title"><?php echo htmlspecialchars($announcement['title']); ?></div>
                <div class="announcement-meta">
                  Created by <?php echo htmlspecialchars($announcement['created_by']); ?> on 
                  <?php echo date('M d, Y H:i', strtotime($announcement['created_at'])); ?>
                  <?php if ($announcement['updated_at'] !== $announcement['created_at']): ?>
                    | Updated <?php echo date('M d, Y H:i', strtotime($announcement['updated_at'])); ?>
                  <?php endif; ?>
                </div>
              </div>
              <div class="announcement-status">
                <?php if ($announcement['pinned']): ?>
                  <span class="badge badge-pinned">📌 PINNED</span>
                <?php endif; ?>
                <span class="badge badge-published">Published</span>
              </div>
            </div>
            
            <p><?php echo nl2br(htmlspecialchars($announcement['content'])); ?></p>
            
            <?php if ($announcement['expires_at']): ?>
              <div class="announcement-meta">
                Expires: <?php echo date('M d, Y H:i', strtotime($announcement['expires_at'])); ?>
              </div>
            <?php endif; ?>

            <div class="announcement-actions">
              <a href="admin-announcements.php?edit=<?php echo $announcement['id']; ?>" class="btn btn-warning">Edit</a>
              <form method="POST" style="display: inline;" onsubmit="return confirm('Are you sure you want to delete this announcement?');">
                <input type="hidden" name="action" value="delete">
                <input type="hidden" name="id" value="<?php echo $announcement['id']; ?>">
                <button type="submit" class="btn btn-danger">Delete</button>
              </form>
            </div>
          </div>
        <?php endforeach; ?>
      <?php else: ?>
        <p>No announcements yet. Create one to get started!</p>
      <?php endif; ?>
    </div>
  </main>
</body>
</html>
