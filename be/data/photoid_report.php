<?php
require_once '../base/connection.php';
require_once '../lib/api.php';
api_start();

$docMap = aadhaar_doc_map($ts);
$sql = "SELECT M.memberid, M.name, M.sex, M.age, M.phone, M.photoidno, F.familyid, F.leader, F.whatsapp, B.booking_status
        FROM members M JOIN families F ON F.familyid = M.familyid LEFT JOIN brn B ON B.familyid = F.familyid
        WHERE COALESCE(B.booking_status, '') <> 'C'
        ORDER BY F.familyid, M.memberid";
$res = mysqli_query($ts, $sql);
$rows = [];
$count = ['submitted' => 0, 'pending' => 0, 'none' => 0];
while ($res && ($m = mysqli_fetch_assoc($res))) {
    $state = photoid_state($m['photoidno'], $docMap, $docId);
    $count[$state]++;
    $digits = strtoupper(preg_replace('/[^0-9A-Za-z]/', '', (string) $m['photoidno']));
    $rows[] = [
        'memberid' => (int) $m['memberid'],
        'name'     => $m['name'],
        'sex'      => $m['sex'],
        'age'      => (int) $m['age'],
        'phone'    => $m['phone'] ?: ($m['whatsapp'] ?: ''),
        'familyid' => (int) $m['familyid'],
        'groupNo'  => 'PAN-2027-' . ($m['familyid'] + 5100),
        'leader'   => $m['leader'],
        'last4'    => $digits !== '' ? substr($digits, -4) : '',
        'state'    => $state,
        'doc_id'   => $docId,
    ];
}
echo json_encode(['success' => true, 'counts' => $count + ['total' => count($rows)], 'rows' => $rows]);
