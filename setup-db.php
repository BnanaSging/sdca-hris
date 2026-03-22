<?php
require 'config.php';

echo "<h2>Setting up HRIS Database...</h2><hr>";

// Create sample user
$sample_email = 'john.doe@company.com';
$sample_password = password_hash('123456', PASSWORD_DEFAULT);
$sample_name = 'John Doe';
$sample_position = 'HR Manager';
$sample_department = 'Human Resources';

// Check if user already exists
if (findUserByEmail($sample_email)) {
    echo "✓ Sample user already exists<br>";
} else {
    if (addUser($sample_name, $sample_email, $sample_password, $sample_position, $sample_department)) {
        echo "✓ Sample user created successfully<br>";
        echo "Email: john.doe@company.com<br>";
        echo "Password: 123456<br>";
    } else {
        echo "✗ Failed to create sample user<br>";
    }
}

echo "<hr>";
echo "<h2>✓ Database setup complete!</h2>";
echo "<p><a href='login-handler.php'>Go to Login</a></p>";
?>
