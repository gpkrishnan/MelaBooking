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

if (isset($_POST['id'])) {
    $query = "SELECT * FROM beds WHERE cot='E' AND roomid=" . $_POST['id'] . " ORDER BY bedid ASC";
    $res   = mysqli_query($ts, $query);
    if (mysqli_num_rows($res) > 2) {
        $rows = mysqli_fetch_all($res, MYSQLI_ASSOC);
        for ($i = 0; $i < sizeof($rows); $i++) {
            if ('0' == $rows[$i]['valid']) {
                $qu = "UPDATE beds set valid=1, remarks='' WHERE bedid=" . $rows[$i]['bedid'];
                break;
            }
        }
        if (!isset($qu) && 1 == $_POST['id']) {
            $qu = sprintf("INSERT INTO beds (roomid,cot,bed,valid,remarks) VALUES(%s,%s,%s,%s,%s)",
                GSLV($_POST['id'], "int"),
                GSLV('E', "text"),
                GSLV((mysqli_num_rows($res) + 1), "int"),
                GSLV('1', "int"),
                GSLV(null, "text"));
        }
    } else {
        $rows = mysqli_fetch_all($res, MYSQLI_ASSOC);
        for ($i = 0; $i < sizeof($rows); $i++) {
            if ('0' == $rows[$i]['valid']) {
                $qu = "UPDATE beds set valid=1,remarks='' WHERE bedid=" . $rows[$i]['bedid'];
                break;
            }
        }
        if (!isset($qu)) {

            $qu = sprintf("INSERT INTO beds (roomid,cot,bed,valid,remarks) VALUES(%s,%s,%s,%s,%s)",
                GSLV($_POST['id'], "int"),
                GSLV('E', "text"),
                GSLV((mysqli_num_rows($res) + 1), "int"),
                GSLV('1', "int"),
                GSLV(null, "text"));

        }
    }
    if (isset($qu) && mysqli_query($ts, $qu)) {
       $out = ['success' => true, 'message' => ''];
    }
}
echo json_encode($out);
