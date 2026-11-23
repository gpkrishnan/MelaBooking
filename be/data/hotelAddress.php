<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');



require_once '../base/connection.php';

$out = array();

$query = "SELECT * FROM hotelAddress ORDER BY id";
$res   = mysqli_query($ts, $query);
if (mysqli_num_rows($res) > 0) {
    while ($row = mysqli_fetch_assoc($res)) {
        $out[] = $row;
    }
}
echo json_encode($out);
