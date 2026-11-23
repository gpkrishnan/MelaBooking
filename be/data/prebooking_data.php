<?php
header('Access-Control-Allow-Origin: *');
require_once '../base/connection.php';

// Pre-registrations from the public form (pandharpur_melaregn).
// Groups: 'nr' = not yet registered here, 'rg' = linked to a booking (mela_regn_id set).
$out = ['data' => ['nr' => [], 'rg' => []]];

function person_row($r, $isHead, $regn)
{
    return [
        'name'            => $r['name'],
        'age'             => $r['age'],
        'sex'             => $r['gender'],
        'photoid'         => $r['aadhaar_no'],
        'phone'           => $r['phone'],
        'volunteer'       => (int) $r['volunteer'],
        'onward_train_no' => $r['onward_train_no'],
        'onward_pickup'   => (int) $r['onward_pickup'],
        'return_train_no' => $r['return_train_no'],
        'return_pickup'   => (int) $r['return_pickup'],
        'onward_other_no' => $r['onward_other_no'],
        'onward_other_at' => $r['onward_other_at'],
        'return_other_no' => $r['return_other_no'],
        'return_other_at' => $r['return_other_at'],
        'regn'            => $isHead ? $regn : null,
    ];
}

$trainJoin = "LEFT JOIN $database_prebooking.train_master TON ON TON.id=%s.onward_train_id LEFT JOIN $database_prebooking.train_master TRT ON TRT.id=%s.return_train_id";
$sel       = "TON.train_no AS onward_train_no, TRT.train_no AS return_train_no";

$q = "SELECT H.*, $sel, (SELECT COUNT(*) FROM $database_prebooking.change_requests C WHERE C.group_head_id=H.id AND C.status='O') AS open_requests
      FROM $database_prebooking.group_head H " . sprintf($trainJoin, 'H', 'H') . " ORDER BY H.mela_regn_id, H.id";
$res = mysqli_query($ts, $q);
while ($row = mysqli_fetch_assoc($res)) {
    $g                  = $row;
    $g['preid']         = 'PAN-2027-' . (5100 + $row['id']) . '(' . ($row['mela_regn_id'] ? ($row['booking_status'] === 'B' ? 'B' : 'R') : 'P') . ')';
    $g['rooms_plan']    = $row['rooms_plan'] ? json_decode($row['rooms_plan'], true) : null;
    $g['members']       = [person_row($row, true, $row['mela_regn_id'])];
    $q1                 = "SELECT M.*, $sel FROM $database_prebooking.group_members M " . sprintf($trainJoin, 'M', 'M') . " WHERE M.group_head_id=" . intval($row['id']) . " ORDER BY M.id";
    $res1               = mysqli_query($ts, $q1);
    while ($m = mysqli_fetch_assoc($res1)) {
        $g['members'][] = person_row($m, false, null);
    }
    $key = $row['mela_regn_id'] ? 'rg' : 'nr';
    $out['data'][$key][] = $g;
}
$out['status'] = 'OK';
echo json_encode($out);
