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

// Merge with $_POST for backward compatibility
if ($data) {
    $_POST = array_merge($_POST, $data);
}
$out = array();
$out = ['success' => false, 'message' => 'Invalid request'];
if (isset($_POST['memberid'])) {
    $query = "Update members set bedid=NULL WHERE memberid=" . $_POST['memberid'];
    if (mysqli_query($ts, $query)) {
          $out = ['success' => true, 'message' => 'Bed Assignment Removed', ];
    }
}
echo json_encode($out);
