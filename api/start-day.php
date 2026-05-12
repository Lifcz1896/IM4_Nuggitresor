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

$userId = $_SESSION['user_id'];

try {
    // Alle Tresors des Users laden
    $tresorStmt = $pdo->prepare("SELECT id, goal_minutes FROM tresors WHERE user_id = :user_id");
    $tresorStmt->execute([':user_id' => $userId]);
    $tresors = $tresorStmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($tresors)) {
        echo json_encode(["status" => "error", "message" => "Keine Tresors gefunden"]);
        exit;
    }

    // Für jeden Tresor einen daily_progress Eintrag erstellen (einmalig pro Tag)
    // ON DUPLICATE KEY: started_at bleibt beim ersten Klick, goal_minutes wird aktualisiert
    $insertStmt = $pdo->prepare("
        INSERT INTO daily_progress (tresor_id, date, started_at, goal_minutes, completed_minutes, percentage, goal_reached)
        VALUES (:tresor_id, CURDATE(), NOW(), :goal_minutes, 0, 0, 0)
        ON DUPLICATE KEY UPDATE goal_minutes = VALUES(goal_minutes)
    ");

    foreach ($tresors as $tresor) {
        $insertStmt->execute([
            ':tresor_id'    => $tresor['id'],
            ':goal_minutes' => $tresor['goal_minutes'],
        ]);
    }

    // started_at des ersten Tresors zurückgeben (alle haben denselben Zeitpunkt)
    $row = $pdo->prepare("
        SELECT started_at FROM daily_progress
        WHERE tresor_id = :tresor_id AND date = CURDATE()
    ");
    $row->execute([':tresor_id' => $tresors[0]['id']]);
    $startedAt = $row->fetchColumn();

    echo json_encode([
        "status"     => "success",
        "started_at" => $startedAt,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Datenbankfehler"]);
}
