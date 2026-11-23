<?php
header('Access-Control-Allow-Origin: *');
require_once '../base/connection.php';

$out = array();

$query = "SELECT * FROM users where valid=1 AND login=1 ORDER BY name ";
$res   = mysqli_query($ts, $query);
if (mysqli_num_rows($res) > 0) {
    while ($row = mysqli_fetch_assoc($res)) {
        $out[] = $row;
    }
}
echo json_encode($out);
