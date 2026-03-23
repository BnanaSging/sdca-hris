<?php
session_start();
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['confirm_logout'])) {
		session_destroy();
		header('Location: login.html');
		exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<title>Confirm Logout</title>
	<link rel="stylesheet" href="style.css" />
</head>
<body style="display:flex;align-items:center;justify-content:center;height:100vh;background:#f9fafb;">
	<div style="background:#fff;padding:32px 40px;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);text-align:center;">
		<h2 style="margin-bottom:18px;">Are you sure you want to log out?</h2>
		<form method="POST" style="display:inline;">
			<input type="hidden" name="confirm_logout" value="1" />
			<button type="submit" class="btn" style="margin-right:16px;">Yes, Log Out</button>
		</form>
		<a href="index.php" class="btn" style="background:#888;">Cancel</a>
	</div>
</body>
</html>
