<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../base/connection.php';

// Get JSON data from request body
$json = file_get_contents('php://input');
$data = json_decode($json, true);
$out = ['success' => false, 'message' => 'Invalid request'];

// Merge with $_POST for backward compatibility
if ($data) {
    $_POST = array_merge($_POST, $data);
}

if (isset($_POST['memberid'])) {
    $memberid = GSLV($_POST['memberid'], "int");
    $query = sprintf("DELETE FROM members WHERE memberid=%s", $memberid);

    if (mysqli_query($ts, $query)) {
        if (mysqli_affected_rows($ts) > 0) {
            $out = ['success' => true, 'message' => 'Member deleted successfully'];
        } else {
            $out = ['success' => false, 'message' => 'Member not found'];
        }
    } else {
        $out = ['success' => false, 'message' => 'Error deleting member: ' . mysqli_error($ts)];
    }
}
echo json_encode($out);
?>