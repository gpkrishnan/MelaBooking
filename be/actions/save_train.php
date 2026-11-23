<?php
require_once '../base/connection.php';
require_once '../lib/api.php';
$in = api_start();
$id  = intval($in['id'] ?? 0);
$dir = $in['direction'] ?? '';
$no  = trim($in['train_no'] ?? '');
$st  = $in['station'] ?? '';
if (!in_array($dir, ['ONWARD', 'RETURN'], true) || $no === '' || strlen($no) > 20 || !in_array($st, ['SOLAPUR', 'PANDHARPUR'], true)) api_fail('Direction, train number and station are required');
$name = substr(trim($in['train_name'] ?? ''), 0, 100);
$date = preg_match('/^\d{4}-\d{2}-\d{2}$/', $in['travel_date'] ?? '') ? $in['travel_date'] : null;
$time = substr(trim($in["time_text"] ?? ""), 0, 120);
$pick = !empty($in['pickup_arranged']) ? 1 : 0;
$act  = array_key_exists('active', $in) ? (empty($in['active']) ? 0 : 1) : 1;
if ($id) {
    $s = $ts->prepare("UPDATE $database_prebooking.train_master SET direction=?,train_no=?,train_name=?,station=?,travel_date=?,time_text=?,pickup_arranged=?,active=? WHERE id=?");
    $s->bind_param('ssssssiii', $dir, $no, $name, $st, $date, $time, $pick, $act, $id);
} else {
    $s = $ts->prepare("INSERT INTO $database_prebooking.train_master (direction,train_no,train_name,station,travel_date,time_text,pickup_arranged,active) VALUES (?,?,?,?,?,?,?,?)");
    $s->bind_param('ssssssii', $dir, $no, $name, $st, $date, $time, $pick, $act);
}
echo json_encode(['success' => $s->execute()]);
