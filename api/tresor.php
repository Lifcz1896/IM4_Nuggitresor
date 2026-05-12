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

    // Tag gestartet? → started_at aus daily_progress laden
    $dayStarted = false;
    $dayFilter  = '9999-01-01 00:00:00';

    $dpStmt = $pdo->prepare("
        SELECT started_at, goal_minutes, completed_minutes, percentage, goal_reached
        FROM daily_progress
        WHERE tresor_id = :id AND date = CURDATE()
        LIMIT 1
    ");
    $dpStmt->execute([':id' => $id]);
    $dp = $dpStmt->fetch(PDO::FETCH_ASSOC);

    if ($dp) {
        $dayStarted = true;
        $dayFilter  = $dp['started_at'];
    }

    // Heutiger Fortschritt – nur Sessions ab started_at (inkl. laufende Session)
    $todayStmt = $pdo->prepare("
        SELECT
            COALESCE(SUM(TIMESTAMPDIFF(SECOND, start_time, IFNULL(end_time, NOW()))), 0) AS today_seconds,
            MAX(CASE WHEN status = 'running' THEN 1 ELSE 0 END) AS nuggi_in,
            MAX(CASE WHEN status = 'running' THEN start_time ELSE NULL END) AS current_session_start
        FROM nuggi_sessions
        WHERE tresor_id = :id
          AND date = CURDATE()
          AND start_time >= :day_filter
    ");
    $todayStmt->execute([':id' => $id, ':day_filter' => $dayFilter]);
    $today = $todayStmt->fetch(PDO::FETCH_ASSOC);

    // Heutige Sessions für den Verlauf
    $sessStmt = $pdo->prepare("
        SELECT start_time, end_time, duration_minutes, status
        FROM nuggi_sessions
        WHERE tresor_id = :id
          AND date = CURDATE()
          AND start_time >= :day_filter
        ORDER BY start_time ASC
    ");
    $sessStmt->execute([':id' => $id, ':day_filter' => $dayFilter]);
    $sessions = $sessStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status"      => "success",
        "day_started" => $dayStarted,
        "tresor"      => array_merge($tresor, [
            "today_seconds"        => (int)$today['today_seconds'],
            "nuggi_in"             => (int)$today['nuggi_in'] === 1,
            "current_session_start"=> $today['current_session_start'],
            "completed_minutes"    => $dp ? (int)$dp['completed_minutes'] : 0,
            "percentage"           => $dp ? (int)$dp['percentage'] : 0,
            "goal_reached"         => $dp ? (bool)$dp['goal_reached'] : false,
        ]),
        "sessions"    => $sessions,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Datenbankfehler"]);
}
