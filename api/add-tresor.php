<?php
// add-tresor.php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Invalid method"]);
    exit;
}

require_once '../system/config.php';

$data = json_decode(file_get_contents("php://input"), true);
$name        = trim($data['name']         ?? '');
$emoji       = trim($data['emoji']        ?? '📫');
$goalMinutes = (int)($data['goal_minutes'] ?? 240);

if (!$name) {
    echo json_encode(["status" => "error", "message" => "Name ist erforderlich"]);
    exit;
}

if ($goalMinutes < 0 || $goalMinutes > 1440) {
    echo json_encode(["status" => "error", "message" => "Ungültiges Tagesziel"]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO tresors (user_id, name, emoji, goal_minutes)
        VALUES (:user_id, :name, :emoji, :goal_minutes)
    ");
    $stmt->execute([
        ':user_id'      => $_SESSION['user_id'],
        ':name'         => $name,
        ':emoji'        => $emoji,
        ':goal_minutes' => $goalMinutes,
    ]);
    echo json_encode(["status" => "success"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Datenbankfehler"]);
}
