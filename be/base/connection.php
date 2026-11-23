<?php
error_reporting(E_ALL);
ini_set('log_errors', 1);
$errorfilename = "../log/errors" . date('ymd') . ".txt";
ini_set('error_log', dirname(__FILE__) . $errorfilename);

ini_set('display_errors', 1);
//ini_set('display_startup_errors',1);

date_default_timezone_set("Asia/calcutta");

//$hostname_loom = "sql108.byethost.com";
//$database_loom = "b13_23852104_loom";
//$username_loom = "b13_23852104";
//$password_loom = "D@t@log@2019";

$hostname_loom = "localhost";
$database_loom = "melarooms_pandharpur";
$username_loom = "sa";
$password_loom = "d";

$database_prebooking=$database_loom; // pre-registration tables live in the same database

mysqli_report(MYSQLI_REPORT_OFF);
$ts = @mysqli_connect($hostname_loom, $username_loom, $password_loom, $database_loom);
if (!$ts) {
    error_log('DB connect failed: ' . mysqli_connect_error());   // see be/log/
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'code' => 'DB_CONNECT', 'message' => 'Database connection failed']);
    exit;
}
$ts->set_charset('utf8mb4');
include_once "functions.php";
