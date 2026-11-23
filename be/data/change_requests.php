<?php
require_once '../base/connection.php';
require_once '../lib/api.php';
api_start();
$out = [];
$q = "SELECT C.id, C.type, C.details, C.status, C.created_at, C.done_at, H.id AS pre_id, H.name, H.whatsapp, H.mela_regn_id
      FROM $database_prebooking.change_requests C JOIN $database_prebooking.group_head H ON H.id=C.group_head_id
      ORDER BY (C.status='D'), C.created_at DESC";
$res = mysqli_query($ts, $q);
while ($r = mysqli_fetch_assoc($res)) {
    $r['ref'] = 'PAN-2027-' . (5100 + $r['pre_id']) . ($r['mela_regn_id'] ? '(R)' : '(P)');
    $out[] = $r;
}
echo json_encode(['success' => true, 'data' => $out, 'open' => count(array_filter($out, fn($x) => $x['status'] === 'O'))]);
