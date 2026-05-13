<?php
// load.php
// Wird vom ESP32 (oder zum Testen per curl/Postman) aufgerufen:
//   alle 2s:  POST { "token": "...", "status": "in" }
//   einmalig: POST { "token": "...", "status": "out" }

header('Content-Type: application/json');

require_once '../system/config.php';

$data   = json_decode(file_get_contents('php://input'), true);
$token  = trim($data['token']  ?? '');
$status = trim($data['status'] ?? '');

if (!$token || !in_array($status, ['in', 'out'])) {
    http_response_code(400);
    echo json_encode(["error" => "token und status (in/out) erforderlich"]);
    exit;
}

// Device anhand Token laden
$devStmt = $pdo->prepare("
    SELECT d.id AS device_id, d.tresor_id
    FROM devices d
    WHERE d.device_token = :token
    LIMIT 1
");
$devStmt->execute([':token' => $token]);
$device = $devStmt->fetch(PDO::FETCH_ASSOC);

if (!$device) {
    http_response_code(403);
    echo json_encode(["error" => "Unbekanntes Device"]);
    exit;
}

$deviceId = $device['device_id'];
$tresorId = $device['tresor_id'];

// Tages-Fortschritt laden (prüfen ob Tag gestartet wurde)
$dpStmt = $pdo->prepare("
    SELECT id, goal_minutes, completed_minutes, percentage, goal_reached
    FROM daily_progress
    WHERE tresor_id = :tresor_id AND date = CURDATE()
    LIMIT 1
");
$dpStmt->execute([':tresor_id' => $tresorId]);
$dp = $dpStmt->fetch(PDO::FETCH_ASSOC);

// ============================================================
// STATUS: "in" — Nuggi liegt im Tresor
// ============================================================
if ($status === 'in') {

    // Device-Timestamp aktualisieren
    $pdo->prepare("
        UPDATE devices SET last_signal_at = NOW(), nuggi_in_safe = 1
        WHERE id = :id
    ")->execute([':id' => $deviceId]);

    // Kein daily_progress = Tag nicht gestartet → ignorieren
    if (!$dp) {
        echo json_encode(["status" => "day_not_started"]);
        exit;
    }

    // Prüfen ob bereits eine laufende Session existiert
    $runStmt = $pdo->prepare("
        SELECT id, start_time FROM nuggi_sessions
        WHERE tresor_id = :tresor_id AND date = CURDATE() AND status = 'running'
        LIMIT 1
    ");
    $runStmt->execute([':tresor_id' => $tresorId]);
    $running = $runStmt->fetch(PDO::FETCH_ASSOC);

    // Keine laufende Session → neue starten
    if (!$running) {
        $pdo->prepare("
            INSERT INTO nuggi_sessions (tresor_id, start_time, date, status)
            VALUES (:tresor_id, NOW(), CURDATE(), 'running')
        ")->execute([':tresor_id' => $tresorId]);
        $runningMinutes = 0;
    } else {
        // Aktuelle Dauer der laufenden Session berechnen
        $diffStmt = $pdo->prepare("SELECT GREATEST(TIMESTAMPDIFF(MINUTE, :start_time, NOW()), 0)");
        $diffStmt->execute([':start_time' => $running['start_time']]);
        $runningMinutes = (int)$diffStmt->fetchColumn();
    }

    // Summe aller abgeschlossenen Sessions + laufende Session
    $sumStmt = $pdo->prepare("
        SELECT COALESCE(SUM(duration_minutes), 0) AS total
        FROM nuggi_sessions
        WHERE tresor_id = :tresor_id AND date = CURDATE() AND status = 'finished'
    ");
    $sumStmt->execute([':tresor_id' => $tresorId]);
    $finishedMinutes = (int)$sumStmt->fetchColumn();

    $totalMinutes = $finishedMinutes + $runningMinutes;
    $goalMinutes  = (int)$dp['goal_minutes'];
    $percentage   = $goalMinutes > 0 ? min(100, (int)round($totalMinutes / $goalMinutes * 100)) : 0;
    $goalReached  = $totalMinutes >= $goalMinutes ? 1 : 0;

    // daily_progress live aktualisieren
    $pdo->prepare("
        UPDATE daily_progress
        SET completed_minutes = :completed,
            percentage        = :percentage,
            goal_reached      = :goal_reached
        WHERE tresor_id = :tresor_id AND date = CURDATE()
    ")->execute([
        ':completed'    => $totalMinutes,
        ':percentage'   => $percentage,
        ':goal_reached' => $goalReached,
        ':tresor_id'    => $tresorId,
    ]);

    echo json_encode([
        "status"            => "ok",
        "goal_minutes"      => $goalMinutes,
        "completed_minutes" => $totalMinutes,
        "percentage"        => $percentage,
        "goal_reached"      => (bool)$goalReached,
    ]);
    exit;
}

// ============================================================
// STATUS: "out" — Nuggi wurde rausgenommen
// ============================================================
if ($status === 'out') {

    // Device-Status zurücksetzen
    $pdo->prepare("
        UPDATE devices SET nuggi_in_safe = 0
        WHERE id = :id
    ")->execute([':id' => $deviceId]);

    // Laufende Session suchen
    $runStmt = $pdo->prepare("
        SELECT id, start_time FROM nuggi_sessions
        WHERE tresor_id = :tresor_id AND date = CURDATE() AND status = 'running'
        LIMIT 1
    ");
    $runStmt->execute([':tresor_id' => $tresorId]);
    $session = $runStmt->fetch(PDO::FETCH_ASSOC);

    if (!$session) {
        echo json_encode(["status" => "ok", "message" => "Keine aktive Session"]);
        exit;
    }

    // Session abschliessen und Dauer berechnen
    $pdo->prepare("
        UPDATE nuggi_sessions
        SET end_time         = NOW(),
            duration_minutes = GREATEST(TIMESTAMPDIFF(MINUTE, start_time, NOW()), 0),
            status           = 'finished'
        WHERE id = :id
    ")->execute([':id' => $session['id']]);

    // daily_progress aktualisieren (Summe aller abgeschlossenen Sessions)
    if ($dp) {
        $sumStmt = $pdo->prepare("
            SELECT COALESCE(SUM(duration_minutes), 0) AS total
            FROM nuggi_sessions
            WHERE tresor_id = :tresor_id AND date = CURDATE() AND status = 'finished'
        ");
        $sumStmt->execute([':tresor_id' => $tresorId]);
        $totalMinutes = (int)$sumStmt->fetchColumn();

        $goalMinutes = (int)$dp['goal_minutes'];
        $percentage  = $goalMinutes > 0 ? min(100, (int)round($totalMinutes / $goalMinutes * 100)) : 0;
        $goalReached = $totalMinutes >= $goalMinutes ? 1 : 0;

        $pdo->prepare("
            UPDATE daily_progress
            SET completed_minutes = :completed,
                percentage        = :percentage,
                goal_reached      = :goal_reached
            WHERE tresor_id = :tresor_id AND date = CURDATE()
        ")->execute([
            ':completed'    => $totalMinutes,
            ':percentage'   => $percentage,
            ':goal_reached' => $goalReached,
            ':tresor_id'    => $tresorId,
        ]);

        echo json_encode([
            "status"            => "ok",
            "completed_minutes" => $totalMinutes,
            "percentage"        => $percentage,
            "goal_reached"      => (bool)$goalReached,
        ]);
    } else {
        echo json_encode(["status" => "ok"]);
    }
    exit;
}
