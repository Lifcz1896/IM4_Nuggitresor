<?php
// dashboard.php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

require_once '../system/config.php';

$userId = $_SESSION['user_id'];

try {
    $userStmt = $pdo->prepare("SELECT firstname, lastname, email FROM users WHERE id = :id");
    $userStmt->execute([':id' => $userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    // Prüfen ob der Tag gestartet wurde (daily_progress Eintrag für heute vorhanden?)
    $dayStarted   = false;
    $dayStartedAt = null;
    $dayFilter    = '9999-01-01 00:00:00';

    $dayStmt = $pdo->prepare("
        SELECT dp.started_at
        FROM daily_progress dp
        JOIN tresors t ON t.id = dp.tresor_id
        WHERE t.user_id = :user_id AND dp.date = CURDATE()
        LIMIT 1
    ");
    $dayStmt->execute([':user_id' => $userId]);
    $dayRow = $dayStmt->fetch(PDO::FETCH_ASSOC);

    if ($dayRow) {
        $dayStarted   = true;
        $dayStartedAt = $dayRow['started_at'];
        $dayFilter    = $dayRow['started_at'];
    }

    // Tresors mit heutigem Fortschritt laden
    $tresorStmt = $pdo->prepare("
        SELECT
            t.id,
            t.name,
            IFNULL(t.emoji, '📫') AS emoji,
            IFNULL(t.goal_minutes, 240) AS goal_minutes,
            IFNULL(dp.completed_minutes, 0) AS completed_minutes,
            IFNULL(dp.percentage, 0) AS percentage,
            IFNULL(dp.goal_reached, 0) AS goal_reached,
            COALESCE(SUM(
                TIMESTAMPDIFF(SECOND, ns.start_time, IFNULL(ns.end_time, NOW()))
            ), 0) AS today_seconds,
            MAX(CASE WHEN ns.status = 'running' THEN 1 ELSE 0 END) AS nuggi_in,
            MAX(CASE WHEN ns.status = 'running' THEN ns.start_time ELSE NULL END) AS current_session_start
        FROM tresors t
        LEFT JOIN daily_progress dp
            ON dp.tresor_id = t.id AND dp.date = CURDATE()
        LEFT JOIN nuggi_sessions ns
            ON ns.tresor_id = t.id
            AND ns.date = CURDATE()
            AND ns.start_time >= :day_filter
        WHERE t.user_id = :user_id
        GROUP BY t.id, t.name, dp.completed_minutes, dp.percentage, dp.goal_reached
        ORDER BY t.created_at ASC
    ");
    $tresorStmt->execute([':user_id' => $userId, ':day_filter' => $dayFilter]);
    $tresors = $tresorStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status"       => "success",
        "day_started"  => $dayStarted,
        "day_start_at" => $dayStartedAt,
        "user"         => [
            "firstname" => $user['firstname'] ?? '',
            "lastname"  => $user['lastname']  ?? '',
            "email"     => $user['email'],
        ],
        "tresors"      => $tresors,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Datenbankfehler: " . $e->getMessage()]);
}
