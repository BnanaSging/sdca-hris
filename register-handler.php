<?php
session_start();
require 'config.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = isset($_POST['name']) ? trim($_POST['name']) : '';
    $email = isset($_POST['email']) ? trim($_POST['email']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    $confirm_password = isset($_POST['confirm_password']) ? $_POST['confirm_password'] : '';
    $position = isset($_POST['position']) ? trim($_POST['position']) : '';
    $department = isset($_POST['department']) ? trim($_POST['department']) : '';
    
    if (empty($name) || empty($email) || empty($password) || empty($confirm_password)) {
        $error = 'Please fill in all required fields';
    } else if ($password !== $confirm_password) {
        $error = 'Passwords do not match';
    } else if (strlen($password) < 6) {
        $error = 'Password must be at least 6 characters';
    } else if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Please enter a valid email address';
    } else {
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        
        if (addUser($name, $email, $hashed_password, $position, $department)) {
            $user = findUserByEmail($email);
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['name'] = $user['name'];
            $_SESSION['position'] = $user['position'];
            $_SESSION['department'] = $user['department'];
            
            header('Location: index.php');
            exit();
        } else {
            $error = 'Email already registered';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HR Portal - Register</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="login-page">
    <div class="login-card">
      <div class="brand">HR PORTAL</div>
      <h1>Create Account</h1>
      <p>Register to access the HR Portal.</p>
      <?php if ($error): ?>
        <div style="background: #fee; color: #c33; padding: 10px; border-radius: 5px; margin-bottom: 15px; font-size: 0.9rem;">
          <?php echo $error; ?>
        </div>
      <?php endif; ?>
      <form class="login-form" action="register-handler.php" method="post">
        <label for="name">Full Name</label>
        <input id="name" name="name" type="text" placeholder="John Doe" value="<?php echo isset($_POST['name']) ? htmlspecialchars($_POST['name']) : ''; ?>" required />
        
        <label for="email">Email</label>
        <input id="email" name="email" type="email" placeholder="name@example.com" value="<?php echo isset($_POST['email']) ? htmlspecialchars($_POST['email']) : ''; ?>" required />
        
        <label for="position">Position</label>
        <input id="position" name="position" type="text" placeholder="e.g., HR Manager" value="<?php echo isset($_POST['position']) ? htmlspecialchars($_POST['position']) : ''; ?>" required />
        
        <label for="department">Department</label>
        <input id="department" name="department" type="text" placeholder="e.g., Human Resources" value="<?php echo isset($_POST['department']) ? htmlspecialchars($_POST['department']) : ''; ?>" required />
        
        <label for="password">Password</label>
        <input id="password" name="password" type="password" placeholder="••••••••" required />
        
        <label for="confirm_password">Confirm Password</label>
        <input id="confirm_password" name="confirm_password" type="password" placeholder="••••••••" required />
        
        <button type="submit">Create Account</button>
      </form>
      <div class="login-footer">Already have an account? <a href="login.html">Sign in</a></div>
    </div>
  </div>
</body>
</html>
