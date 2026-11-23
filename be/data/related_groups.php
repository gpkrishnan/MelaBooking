<?php
// Legends of related bookings, with how many (non-cancelled) bookings each has and the hotels they are in so far.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
require_once '../base/connection.php';
require_once '../lib/roomsplan.php';
ensure_related_group_column($ts);

$out = [];
$res = mysqli_query($ts, "SELECT F.related_group,
        COUNT(DISTINCT IF(B.booking_status<>'C', F.familyid, NULL)) AS bookings,
        GROUP_CONCAT(DISTINCT IF(B.booking_status<>'C', R.lodgename, NULL) ORDER BY R.lodgename SEPARATOR '|') AS hotels
    FROM families F
    LEFT JOIN brn B ON B.familyid=F.familyid
    LEFT JOIN members M ON M.familyid=F.familyid
    LEFT JOIN beds D ON D.bedid=M.bedid
    LEFT JOIN rooms R ON R.roomid=D.roomid
    WHERE F.related_group IS NOT NULL AND F.related_group<>''
    GROUP BY F.related_group ORDER BY F.related_group");
while ($res && ($r = mysqli_fetch_assoc($res))) {
    $out[] = [
        'name'     => $r['related_group'],
        'bookings' => intval($r['bookings']),
        'hotels'   => $r['hotels'] ? explode('|', $r['hotels']) : [],
    ];
}
echo json_encode($out);
