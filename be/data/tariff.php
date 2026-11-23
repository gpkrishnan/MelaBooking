<?php
require_once '../base/connection.php';
require_once '../lib/api.php';
api_start();
$rates = ['AC' => new stdClass(), 'NAC' => new stdClass()];
$res = mysqli_query($ts, "SELECT room_type, occupancy, rate_per_person FROM $database_prebooking.tariff");
$tmp = ['AC' => [], 'NAC' => []];
while ($r = mysqli_fetch_assoc($res)) $tmp[$r['room_type']][$r['occupancy']] = (int) $r['rate_per_person'];
echo json_encode(['success' => true, 'rates' => $tmp]);
