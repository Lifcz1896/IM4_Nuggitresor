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

    // Check if day has been started today
    $dayStarted   = false;
    $dayStartTime = null;
    $dayFilter    = '9999-01-01 00:00:00';
    try {
        $dayStmt = $pdo->prepare("SELECT start_time FROM day_starts WHERE user_id = :user_id AND date = CURDATE()");
        $dayStmt->execute([':user_id' => $userId]);
        $dayRow = $dayStmt->fetch(PDO::FETCH_ASSOC);
        if ($dayRow) {
            $dayStarted   = true;
            $dayStartTime = $dayRow['start_time'];
            $dayFilter    = $dayRow['start_time'];
        }
    } catch (Exception $e) {
        // day_starts table not yet created – treat as day not started
    }

    $tresorStmt = $pdo->prepare("
        SELECT
            t.id,
            t.name,
            IFNULL(t.emoji, '📫') AS emoji,
            IFNULL(t.goal_minutes, 240) AS goal_minutes,
            COALESCE(SUM(
                TIMESTAMPDIFF(SECOND, ns.start_time, IFNULL(ns.end_time, NOW()))
            ), 0) AS today_seconds,
            MAX(CASE WHEN ns.end_time IS NULL THEN 1 ELSE 0 END) AS nuggi_in
        FROM tresors t
        LEFT JOIN nuggi_sessions ns
            ON ns.tresor_id = t.id
            AND DATE(ns.start_time) = CURDATE()
            AND ns.start_time >= :day_filter
        WHERE t.user_id = :user_id
        GROUP BY t.id, t.name
        ORDER BY t.created_at ASC
    ");
    $tresorStmt->execute([':user_id' => $userId, ':day_filter' => $dayFilter]);
    $tresors = $tresorStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status"         => "success",
        "day_started"    => $dayStarted,
        "day_start_time" => $dayStartTime,
        "user"           => [
            "firstname" => $user['firstname'] ?? '',
            "lastname"  => $user['lastname']  ?? '',
            "email"     => $user['email'],
        ],
        "tresors"        => $tresors,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Datenbankfehler: " . $e->getMessage()]);
}
