<?php
// stats.php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

require_once '../system/config.php';

$userId = $_SESSION['user_id'];

// Determine week start (Monday)
$weekParam = $_GET['week'] ?? null;
if ($weekParam && preg_match('/^\d{4}-\d{2}-\d{2}$/', $weekParam)) {
    $weekStart = new DateTime($weekParam);
} else {
    $weekStart = new DateTime();
    $dow = (int)$weekStart->format('N'); // 1=Mon, 7=Sun
    $weekStart->modify('-' . ($dow - 1) . ' days');
}
$weekStart->setTime(0, 0, 0);

$weekEnd = clone $weekStart;
$weekEnd->modify('+7 days');

$weekEndDisplay = clone $weekEnd;
$weekEndDisplay->modify('-1 day');

try {
    $tresorStmt = $pdo->prepare("
        SELECT id, name,
               IFNULL(emoji, '📫') AS emoji,
               IFNULL(goal_minutes, 240) AS goal_minutes
        FROM tresors
        WHERE user_id = :user_id
        ORDER BY created_at ASC
    ");
    $tresorStmt->execute([':user_id' => $userId]);
    $tresors = $tresorStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($tresors as &$tresor) {
        // JOIN mit daily_progress: nur Sessions nach dem "Tag starten" Zeitpunkt zählen
        // Tage ohne daily_progress-Eintrag (Tag nie gestartet) ergeben 0
        $sessStmt = $pdo->prepare("
            SELECT
                ns.date AS day,
                SUM(TIMESTAMPDIFF(SECOND, ns.start_time, IFNULL(ns.end_time, NOW()))) AS seconds
            FROM nuggi_sessions ns
            JOIN daily_progress dp
                ON dp.tresor_id = ns.tresor_id
                AND dp.date = ns.date
            WHERE ns.tresor_id = :tresor_id
              AND ns.date >= :week_start
              AND ns.date < :week_end
              AND ns.start_time >= dp.started_at
            GROUP BY ns.date
        ");
        $sessStmt->execute([
            ':tresor_id'  => $tresor['id'],
            ':week_start' => $weekStart->format('Y-m-d'),
            ':week_end'   => $weekEnd->format('Y-m-d'),
        ]);
        $rows = $sessStmt->fetchAll(PDO::FETCH_KEY_PAIR);

        $days = [];
        for ($i = 0; $i < 7; $i++) {
            $day = clone $weekStart;
            $day->modify("+$i days");
            $dateStr = $day->format('Y-m-d');
            $days[] = [
                'date'    => $dateStr,
                'seconds' => (int)($rows[$dateStr] ?? 0),
            ];
        }
        $tresor['days'] = $days;
    }

    echo json_encode([
        "status"     => "success",
        "week_start" => $weekStart->format('Y-m-d'),
        "week_end"   => $weekEndDisplay->format('Y-m-d'),
        "tresors"    => $tresors,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Datenbankfehler: " . $e->getMessage()]);
}
