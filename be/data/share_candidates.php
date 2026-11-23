<?php
// Bookings that a single-person booking can share a room with: single-person, not cancelled, same room category,
// and either not combined yet or in a group that still has space (or the booking's own group).
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
ensure_share_column($ts);

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$self = intval($data['familyid'] ?? 0);
$cat  = trim((string) ($data['room_category'] ?? ''));
$out  = [];
if ($cat !== '') {
    $cap     = room_capacity($cat);
    $catSql  = mysqli_real_escape_string($ts, $cat);
    $myGroup = $self ? GFV('families', 'combine_no', 'familyid=' . $self) : null;
    $res = mysqli_query($ts, "SELECT F.familyid, F.leader, F.combine_no,
            (SELECT COUNT(*) FROM families G WHERE G.combine_no=F.combine_no) AS gsize
        FROM families F INNER JOIN brn B ON B.familyid=F.familyid
        WHERE F.familyid<>$self AND B.booking_status<>'C' AND LOWER(TRIM(F.room_category))=LOWER('$catSql')
          AND (SELECT COUNT(*) FROM members M WHERE M.familyid=F.familyid)=1
        ORDER BY F.familyid");
    while ($res && ($r = mysqli_fetch_assoc($res))) {
        $inMine = $myGroup !== null && $r['combine_no'] !== null && intval($r['combine_no']) == intval($myGroup);
        if ($r['combine_no'] !== null && !$inMine && intval($r['gsize']) >= $cap) {
            continue; // that room is full
        }
        $out[] = [
            'ref'       => 'PAN-2027-' . (intval($r['familyid']) + 5100),
            'id'        => intval($r['familyid']) + 5100,
            'name'      => $r['leader'],
            'combine_no' => $r['combine_no'] === null ? null : intval($r['combine_no']),
        ];
    }
}
echo json_encode($out);
