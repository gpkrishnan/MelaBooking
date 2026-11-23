<?php
require_once '../base/connection.php';
require_once '../lib/api.php';
$in = api_start();
$rates = $in['rates'] ?? [];
$rows = [];
foreach (['AC', 'NAC'] as $t) foreach ([2, 3, 4] as $n) {
    $v = $rates[$t][$n] ?? null;
    if (!is_numeric($v) || intval($v) != $v || intval($v) <= 0 || intval($v) > 1000000) api_fail("Invalid rate for $t / $n persons");
    $rows[] = [$t, $n, intval($v)];
}
foreach ($rows as [$t, $n, $v]) {
    $s = $ts->prepare("UPDATE $database_prebooking.tariff SET rate_per_person=? WHERE room_type=? AND occupancy=?");
    $s->bind_param('isi', $v, $t, $n);
    $s->execute();
}
echo json_encode(['success' => true]);
