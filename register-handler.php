<?php
session_start();
require 'config.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $gender = isset($_POST['gender']) ? $_POST['gender'] : '';
      $birthday = isset($_POST['birthday']) ? $_POST['birthday'] : '';
    $surname = isset($_POST['surname']) ? trim($_POST['surname']) : '';
    $firstname = isset($_POST['firstname']) ? trim($_POST['firstname']) : '';
    $middle_initial = isset($_POST['middle_initial']) ? trim($_POST['middle_initial']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    $confirm_password = isset($_POST['confirm_password']) ? $_POST['confirm_password'] : '';
    $position = isset($_POST['position']) ? trim($_POST['position']) : '';
    $department = isset($_POST['department']) ? trim($_POST['department']) : '';
    
    // Auto-generate email from firstname and surname
    $email = strtolower($firstname) . strtolower($surname) . '@sdca.edu.ph';
    
    if (empty($surname) || empty($firstname) || empty($password) || empty($confirm_password) || empty($birthday)) {
      $error = 'Please fill in all required fields';
    } else if ($password !== $confirm_password) {
        $error = 'Passwords do not match';
    } else if (strlen($password) < 6) {
        $error = 'Password must be at least 6 characters';
    } else {
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        
        // Collect custom leave amounts
        $custom_leaves = [];
        foreach (getLeaveTypes() as $leave_key => $leave_label) {
            $field_name = 'leave_' . str_replace(' ', '_', strtolower($leave_key));
            if (isset($_POST[$field_name])) {
                $custom_leaves[$leave_key] = intval($_POST[$field_name]);
            }
        }
        
        if (addUser($surname, $firstname, $middle_initial, $email, $hashed_password, $position, $department, 'custom', $birthday, $gender, $custom_leaves)) {
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
      <form class="login-form" action="register-handler.php" method="post" style="max-height: 70vh; overflow-y: auto; padding-right: 8px;">
        <label for="surname">Surname</label>
        <input id="surname" name="surname" type="text" placeholder="Doe" value="<?php echo isset($_POST['surname']) ? htmlspecialchars($_POST['surname']) : ''; ?>" required />
        
        <label for="firstname">First Name</label>
        <input id="firstname" name="firstname" type="text" placeholder="John" value="<?php echo isset($_POST['firstname']) ? htmlspecialchars($_POST['firstname']) : ''; ?>" required />
        
        <label for="middle_initial">Middle Initial (Optional)</label>
        <input id="middle_initial" name="middle_initial" type="text" placeholder="M" maxlength="1" value="<?php echo isset($_POST['middle_initial']) ? htmlspecialchars($_POST['middle_initial']) : ''; ?>" />
        
        <label>Email (Auto-generated)</label>
        <div id="autoEmail" style="width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 10px; font-size: 0.95rem; background: #f9fafb; color: #6b7280;">-</div>
        
        <label for="position">Position</label>
        <select id="position" name="position" required style="width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 10px; font-size: 0.95rem;">
          <option value="VPAA">VPAA</option>
          <option value="Dean">Dean</option>
          <option value="Program Chair">Program Chair</option>
          <option value="Faculty Members">Faculty Members</option>
          <option value="Administrative Staff">Administrative Staff</option>
        </select>
        
        <label for="department">Department</label>
        <select id="department" name="department" required style="width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 10px; font-size: 0.95rem;">
          <option value="BSIT">BSIT</option>
          <option value="BMMA">BMMA</option>
          <option value="BACCOM">BACCOM</option>
        </select>

        <label for="birthday">Birthday</label>
        <input id="birthday" name="birthday" type="date" required />

        <label for="gender">Gender</label>
        <select id="gender" name="gender" required style="width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 10px; font-size: 0.95rem;">
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <fieldset style="border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; margin: 12px 0; background: #f9fafb;">
          <legend style="font-weight: 600; padding: 0 8px; color: #374151; font-size: 0.9rem;">Leave Allocation (Days)</legend>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <?php foreach (getLeaveTypes() as $leave_key => $leave_label): ?>
            <div>
              <label for="leave_<?php echo str_replace(' ', '_', strtolower($leave_key)); ?>" style="font-size: 0.8rem; margin-bottom: 4px;"><?php echo htmlspecialchars($leave_label); ?></label>
              <input type="number" id="leave_<?php echo str_replace(' ', '_', strtolower($leave_key)); ?>" name="leave_<?php echo str_replace(' ', '_', strtolower($leave_key)); ?>" min="0" value="0" style="width: 100%; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; font-size: 0.9rem;" />
            </div>
            <?php endforeach; ?>
          </div>
        </fieldset>

        <label for="password">Password</label>
        <input id="password" name="password" type="password" placeholder="••••••••" required />
        
        <label for="confirm_password">Confirm Password</label>
        <input id="confirm_password" name="confirm_password" type="password" placeholder="••••••••" required />
        
        <button type="submit" style="margin-top: 16px; width: 100%;">Create Account</button>
      </form>
      <div class="login-footer">Already have an account? <a href="login.html">Sign in</a></div>
    </div>
  </div>
  <script>
    // Auto-generate email as user types
    function updateAutoEmail() {
      const surname = document.getElementById('surname').value.toLowerCase().trim();
      const firstname = document.getElementById('firstname').value.toLowerCase().trim();
      const emailDisplay = document.getElementById('autoEmail');
      
      if (firstname && surname) {
        emailDisplay.textContent = firstname + surname + '@sdca.edu.ph';
      } else {
        emailDisplay.textContent = '-';
      }
    }
    
    document.getElementById('surname').addEventListener('input', updateAutoEmail);
    document.getElementById('firstname').addEventListener('input', updateAutoEmail);
  </script>
</body>
</html>
