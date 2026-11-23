<?php
require_once '../base/connection.php';
require_once '../lib/api.php';
api_start();
$out = [];
$res = mysqli_query($ts, "SELECT * FROM $database_prebooking.train_master ORDER BY direction, travel_date, time_text, train_no");
while ($r = mysqli_fetch_assoc($res)) {
    $r['id'] = (int) $r['id']; $r['pickup_arranged'] = (int) $r['pickup_arranged']; $r['active'] = (int) $r['active'];
    $out[] = $r;
}
echo json_encode(['success' => true, 'data' => $out]);
