<?php
// tresor.php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

require_once '../system/config.php';

$id     = (int)($_GET['id'] ?? 0);
$userId = $_SESSION['user_id'];

try {
    $stmt = $pdo->prepare("
        SELECT id, name, emoji, goal_minutes
        FROM tresors
        WHERE id = :id AND user_id = :user_id
    ");
    $stmt->execute([':id' => $id, ':user_id' => $userId]);
    $tresor = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$tresor) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Tresor nicht gefunden"]);
        exit;
    }

    // Check if day has been started today
    $dayFilter = '9999-01-01 00:00:00';
    try {
        $dayStmt = $pdo->prepare("SELECT start_time FROM day_starts WHERE user_id = :user_id AND date = CURDATE()");
        $dayStmt->execute([':user_id' => $userId]);
        $dayRow = $dayStmt->fetch(PDO::FETCH_ASSOC);
        if ($dayRow) $dayFilter = $dayRow['start_time'];
    } catch (Exception $e) {
        // day_starts table not yet created
    }

    // Today's totals – only from day_start onwards
    $todayStmt = $pdo->prepare("
        SELECT
            COALESCE(SUM(TIMESTAMPDIFF(SECOND, start_time, IFNULL(end_time, NOW()))), 0) AS today_seconds,
            MAX(CASE WHEN end_time IS NULL THEN 1 ELSE 0 END) AS nuggi_in
        FROM nuggi_sessions
        WHERE tresor_id = :id
          AND DATE(start_time) = CURDATE()
          AND start_time >= :day_filter
    ");
    $todayStmt->execute([':id' => $id, ':day_filter' => $dayFilter]);
    $today = $todayStmt->fetch(PDO::FETCH_ASSOC);

    // All today's sessions for Verlauf (history – unfiltered)
    $sessStmt = $pdo->prepare("
        SELECT start_time, end_time
        FROM nuggi_sessions
        WHERE tresor_id = :id AND DATE(start_time) = CURDATE()
        ORDER BY start_time ASC
    ");
    $sessStmt->execute([':id' => $id]);
    $sessions = $sessStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status"   => "success",
        "tresor"   => array_merge($tresor, [
            "today_seconds" => (int)$today['today_seconds'],
            "nuggi_in"      => (int)$today['nuggi_in'] === 1,
        ]),
        "sessions" => $sessions,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Datenbankfehler"]);
}
