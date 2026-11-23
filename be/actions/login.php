<?php
header('Access-Control-Allow-Origin: *');
require_once '../base/connection.php';
$out = 'NOK';
if (isset($_POST['un']) && isset($_POST['ps'])) {
    $query = "SELECT id,password,admin from users WHERE id=" . $_POST['un'] . " AND login=1";
    $res   = mysqli_query($ts, $query);
    $row   = mysqli_fetch_assoc($res);
    if (trim($row['password']) === trim($_POST['ps'])) {
        $output    = array();
        $output[0] = $row['id'];
        $output[1] = $row['admin'];
        echo json_encode($output);
    } else {
        echo "NOK";
    }
} else {
    echo "NOK";
}
