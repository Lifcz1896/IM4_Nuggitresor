<?php
// update-goal.php
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

$data        = json_decode(file_get_contents("php://input"), true);
$id          = (int)($data['id']           ?? 0);
$goalMinutes = (int)($data['goal_minutes'] ?? 0);

if ($goalMinutes < 0 || $goalMinutes > 1440) {
    echo json_encode(["status" => "error", "message" => "Ungültiges Tagesziel"]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        UPDATE tresors SET goal_minutes = :goal_minutes
        WHERE id = :id AND user_id = :user_id
    ");
    $stmt->execute([
        ':goal_minutes' => $goalMinutes,
        ':id'           => $id,
        ':user_id'      => $_SESSION['user_id'],
    ]);

    if ($stmt->rowCount() === 0) {
        echo json_encode(["status" => "error", "message" => "Tresor nicht gefunden"]);
        exit;
    }

    // daily_progress für heute sofort mitaktualisieren (inkl. Prozentwert neu berechnen)
    $pdo->prepare("
        UPDATE daily_progress
        SET goal_minutes = :goal_minutes,
            percentage   = LEAST(100, ROUND(completed_minutes / :goal_minutes2 * 100)),
            goal_reached = IF(completed_minutes >= :goal_minutes3, 1, 0)
        WHERE tresor_id = :id AND date = CURDATE()
    ")->execute([
        ':goal_minutes'  => $goalMinutes,
        ':goal_minutes2' => $goalMinutes,
        ':goal_minutes3' => $goalMinutes,
        ':id'            => $id,
    ]);

    echo json_encode(["status" => "success"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Datenbankfehler"]);
}
