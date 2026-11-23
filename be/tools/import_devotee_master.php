<?php
// Usage: php be/tools/import_devotee_master.php <file.csv> <source_event>
// Upserts earlier-event devotee data into devotee_master (by Aadhaar; blank Aadhaar -> by name+phone).
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../base/connection.php';
require_once __DIR__ . '/../lib/dupcheck.php';
$file = $argv[1] ?? ''; $event = $argv[2] ?? '';
if (!is_file($file) || $event === '') { fwrite(STDERR, "Usage: php import_devotee_master.php file.csv source_event\n"); exit(1); }
$fh = fopen($file, 'r');
$head = array_map(fn($h) => strtolower(trim(preg_replace('/^\xEF\xBB\xBF/', '', $h))), fgetcsv($fh));
$ins = 0; $upd = 0; $skip = 0;
while (($row = fgetcsv($fh)) !== false) {
    if (count($row) < count($head)) { $skip++; continue; }
    $d = array_combine($head, array_slice($row, 0, count($head)));
    $name = trim($d['name'] ?? '');
    if ($name === '') { $skip++; continue; }
    $aad = photo_id_norm($d['aadhaar_no'] ?? ''); $aad = strlen($aad) >= 6 ? $aad : null;
    $phone = normalize_phone10($d['phone'] ?? ''); $wa = normalize_phone10($d['whatsapp'] ?? '');
    $age = is_numeric($d['age'] ?? '') ? intval($d['age']) : null;
    $sex = in_array(strtoupper($d['sex'] ?? ''), ['M', 'F'], true) ? strtoupper($d['sex']) : null;
    $addr = trim($d['address'] ?? ''); $city = trim($d['city'] ?? '');
    if ($aad) {
        $s = $ts->prepare('SELECT id FROM devotee_master WHERE aadhaar_no=?'); $s->bind_param('s', $aad);
    } else {
        $s = $ts->prepare('SELECT id FROM devotee_master WHERE name=? AND phone=? AND aadhaar_no IS NULL'); $s->bind_param('ss', $name, $phone);
    }
    $s->execute(); $ex = $s->get_result()->fetch_row();
    if ($ex) {
        $u = $ts->prepare('UPDATE devotee_master SET name=?,age=?,sex=?,phone=?,whatsapp=?,address=?,city=?,source_event=? WHERE id=?');
        $u->bind_param('sissssssi', $name, $age, $sex, $phone, $wa, $addr, $city, $event, $ex[0]); $u->execute(); $upd++;
    } else {
        $i = $ts->prepare('INSERT INTO devotee_master (aadhaar_no,name,age,sex,phone,whatsapp,address,city,source_event) VALUES (?,?,?,?,?,?,?,?,?)');
        $i->bind_param('ssissssss', $aad, $name, $age, $sex, $phone, $wa, $addr, $city, $event); $i->execute(); $ins++;
    }
}
echo "inserted $ins, updated $upd, skipped $skip\n";
