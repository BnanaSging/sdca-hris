<?php
echo "<h1>HRIS Database Connection Test</h1>";
echo "<hr>";

echo "<h2>1. Checking config.php...</h2>";
if (file_exists('config.php')) {
    echo "✓ config.php found<br>";
    require 'config.php';
} else {
    echo "✗ config.php NOT found<br>";
    die("Please create config.php with database credentials");
}

echo "<h2>2. Testing MySQL Connection...</h2>";
if ($conn->connect_error) {
    echo "✗ Connection FAILED<br>";
    echo "Error: " . $conn->connect_error . "<br>";
    die("Please check your database credentials in config.php");
} else {
    echo "✓ Connected to MySQL successfully<br>";
}

echo "<h2>3. Checking Database: " . $db_name . "</h2>";
$result = $conn->query("SHOW DATABASES LIKE '$db_name'");
if ($result->num_rows > 0) {
    echo "✓ Database '$db_name' exists<br>";
} else {
    echo "✗ Database '$db_name' NOT found<br>";
    echo "Run setup-db.php to create the database<br>";
    die();
}

echo "<h2>4. Checking Users Table...</h2>";
$result = $conn->query("SHOW TABLES LIKE 'users'");
if ($result->num_rows > 0) {
    echo "✓ Table 'users' exists<br>";
} else {
    echo "✗ Table 'users' NOT found<br>";
    echo "Run setup-db.php to create tables<br>";
    die();
}

echo "<h2>5. Checking Sample User...</h2>";
$result = $conn->query("SELECT COUNT(*) as count FROM users");
$row = $result->fetch_assoc();
echo "✓ Users in database: " . $row['count'] . "<br>";

if ($row['count'] == 0) {
    echo "<strong>No users found! Run setup-db.php first.</strong><br>";
} else {
    echo "✓ Sample users exist<br>";
}

echo "<hr>";
echo "<h2>✓ All checks passed! Your database is ready.</h2>";
echo "<p><a href='login.html'>Go to Login</a></p>";
$conn->close();
?>
