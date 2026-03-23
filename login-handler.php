<?php
session_start();
require 'config.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $email = isset($_POST['email']) ? trim($_POST['email']) : '';
  $password = isset($_POST['password']) ? $_POST['password'] : '';
    
  if (empty($email) || empty($password)) {
    $error = 'Please enter both email and password';
  } else {
    // Special case for admin login
    if (strtolower($email) === 'admin' && $password === 'admin1234') {
      // Find admin user
      $users = json_decode(file_get_contents(__DIR__ . '/users.json'), true);
      $admin = null;
      if (is_array($users)) {
        foreach ($users as $u) {
          if (isset($u['email']) && $u['email'] === 'admin') {
            $admin = $u;
            break;
          }
        }
      }
      if ($admin) {
        $_SESSION['user_id'] = $admin['id'];
        $_SESSION['email'] = $admin['email'];
        $_SESSION['name'] = $admin['name'];
        $_SESSION['position'] = $admin['position'];
        $_SESSION['department'] = $admin['department'];
        header('Location: index.php');
        exit();
      } else {
        // Auto-create admin user if not found
        $admin = [
          'id' => 9999,
          'name' => 'Admin',
          'email' => 'admin',
          'password' => password_hash('admin1234', PASSWORD_DEFAULT),
          'position' => 'admin',
          'department' => 'Administration',
          'leave_package' => 'custom',
          'birthday' => '1970-01-01',
          'gender' => 'other',
          'created_at' => date('Y-m-d H:i:s')
        ];
        $users[] = $admin;
        file_put_contents(__DIR__ . '/users.json', json_encode($users, JSON_PRETTY_PRINT));
        $_SESSION['user_id'] = $admin['id'];
        $_SESSION['email'] = $admin['email'];
        $_SESSION['name'] = $admin['name'];
        $_SESSION['position'] = $admin['position'];
        $_SESSION['department'] = $admin['department'];
        header('Location: index.php');
        exit();
      }
    } else {
      // Only allow login by email for non-admin users
      $user = findUserByEmail($email);
      if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['name'] = $user['name'];
        $_SESSION['position'] = $user['position'];
        $_SESSION['department'] = $user['department'];
        header('Location: index.php');
        exit();
      } else {
        $error = 'Invalid email or password';
      }
    }
  }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HR Portal - Login</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="login-page">
    <div class="login-card">
      <div class="brand">HR PORTAL</div>
      <h1>Sign in</h1>
      <p>Enter your credentials to continue.</p>
      <?php if ($error): ?>
        <div style="background: #fee; color: #c33; padding: 10px; border-radius: 5px; margin-bottom: 15px; font-size: 0.9rem;">
          <?php echo $error; ?>
        </div>
      <?php endif; ?>
      <form class="login-form" action="login-handler.php" method="post">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" placeholder="name@example.com or admin" value="<?php echo isset($_POST['email']) ? htmlspecialchars($_POST['email']) : ''; ?>" required />
        <label for="password">Password</label>
        <input id="password" name="password" type="password" placeholder="••••••••" required />
        <button type="submit">Log In</button>
      </form>
      <div class="login-footer">Need an account? <a href="register-handler.php">Create one</a></div>
    </div>
  </div>
</body>
</html>
