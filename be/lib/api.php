<?php
// Shared preamble for the newer admin endpoints: CORS (incl. Authorization), preflight, JSON body, admin check.
function api_start($requireAdmin = true)
{
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json');
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(200); exit; }
    require_once __DIR__ . '/auth.php';
    if ($requireAdmin) require_admin();
    $in = json_decode(file_get_contents('php://input'), true);
    return is_array($in) ? $in : [];
}

function api_fail($msg, $code = 400)
{
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $msg]);
    exit;
}
