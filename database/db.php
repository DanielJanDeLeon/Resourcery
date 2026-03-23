<?php
// Database Configuration
$host = "localhost";
$user = "root";          // default XAMPP/MAMP user
$pass = "root";          // default password
$db   = "resourcery";    // database name

// Create connection
$conn = new mysqli($host, $user, $pass, $db);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Optional: Set charset to utf8mb4
$conn->set_charset("utf8mb4");

?>
