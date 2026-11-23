<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { exit; }
require_once '../lib/auth.php';
$in = json_decode(file_get_contents('php://input'), true) ?: [];
if (isset($in['password']) && hash_equals(ADMIN_PASSWORD, (string) $in['password'])) {
    echo json_encode(['success' => true, 'token' => admin_token_issue()]);
} else {
    sleep(1); // slow down guessing
    http_response_code(401);
    echo json_encode(['success' => false]);
}
