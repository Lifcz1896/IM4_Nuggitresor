<?php
// delete-tresor.php
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
$id   = (int)($data['id'] ?? 0);

try {
    $stmt = $pdo->prepare("DELETE FROM tresors WHERE id = :id AND user_id = :user_id");
    $stmt->execute([':id' => $id, ':user_id' => $_SESSION['user_id']]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Tresor nicht gefunden"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Datenbankfehler"]);
}
