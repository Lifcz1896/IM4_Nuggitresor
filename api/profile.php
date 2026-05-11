<?php
// profile.php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

require_once '../system/config.php';

$userId = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare("SELECT firstname, lastname FROM users WHERE id = :id");
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "status"    => "success",
        "firstname" => $user['firstname'] ?? '',
        "lastname"  => $user['lastname']  ?? '',
    ]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $firstname = trim($data['firstname'] ?? '');
    $lastname  = trim($data['lastname']  ?? '');

    if (!$firstname || !$lastname) {
        echo json_encode(["status" => "error", "message" => "Vor- und Nachname sind erforderlich"]);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE users SET firstname = :firstname, lastname = :lastname WHERE id = :id");
    $stmt->execute([
        ':firstname' => $firstname,
        ':lastname'  => $lastname,
        ':id'        => $userId,
    ]);

    echo json_encode(["status" => "success"]);

} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
}
