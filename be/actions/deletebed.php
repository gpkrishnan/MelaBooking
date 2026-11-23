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
$out = ['success' => false, 'message' => 'Invalid request'];

if (isset($_POST['id']) ) {
    $query = "SELECT * FROM members WHERE bedid=" . $_POST['id'];
    $res   = mysqli_query($ts, $query);
    if (mysqli_num_rows($res) == 0) {
        $qu = "UPDATE beds set valid=0 " . " WHERE bedid=" . $_POST['id'];
        if (mysqli_query($ts, $qu)) {
                $out = ['success' => true, 'message' => ''];
        }
    } else{
        $out = ['success' => false, 'message' => 'Bed is assigned to a member'];
    }

}
echo json_encode($out);
