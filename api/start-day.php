<?php
// start-day.php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

require_once '../system/config.php';

try {
    // Insert once per day – duplicate key does nothing (first press counts)
    $stmt = $pdo->prepare("
        INSERT INTO day_starts (user_id, date, start_time)
        VALUES (:user_id, CURDATE(), NOW())
        ON DUPLICATE KEY UPDATE start_time = start_time
    ");
    $stmt->execute([':user_id' => $_SESSION['user_id']]);

    // Return the actual start time
    $row = $pdo->query("SELECT start_time FROM day_starts WHERE user_id = {$_SESSION['user_id']} AND date = CURDATE()")->fetch();
    echo json_encode(["status" => "success", "start_time" => $row['start_time']]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Datenbankfehler"]);
}
