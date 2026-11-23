<?php
require_once '../base/connection.php';
require_once '../lib/api.php';
require_once '../lib/dupcheck.php';
api_start();
$wa  = normalize_phone10($_GET['whatsapp'] ?? '');
$aad = photo_id_norm($_GET['aadhaar'] ?? '');
$people = [];
if (strlen($aad) >= 6) {
    $s = $ts->prepare('SELECT * FROM devotee_master WHERE aadhaar_no=?');
    $s->bind_param('s', $aad);
} elseif ($wa !== '') {
    $s = $ts->prepare('SELECT * FROM devotee_master WHERE whatsapp=? OR phone=? ORDER BY name');
    $s->bind_param('ss', $wa, $wa);
} else { echo json_encode(['found' => false, 'people' => []]); exit; }
$s->execute();
foreach ($s->get_result() as $r) {
    $people[] = ['name' => $r['name'], 'age' => $r['age'], 'sex' => $r['sex'], 'phone' => $r['phone'], 'whatsapp' => $r['whatsapp'], 'aadhaar_no' => $r['aadhaar_no'], 'address' => $r['address'], 'city' => $r['city']];
}
echo json_encode(['found' => count($people) > 0, 'people' => $people]);
