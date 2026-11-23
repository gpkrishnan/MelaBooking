<?php
// Run: /Applications/XAMPP/xamppfiles/bin/php be/tests/dupcheck_test.php
// Uses scratch DB melarooms_pandharpur_test built from the Pandharpur schema; never touches live data.
mysqli_report(MYSQLI_REPORT_OFF);
$root = new mysqli('localhost', 'sa', 'd');
$root->query('DROP DATABASE IF EXISTS melarooms_pandharpur_test');
$sql = str_replace('melarooms_pandharpur', 'melarooms_pandharpur_test', file_get_contents(__DIR__ . '/../../../Melaregnform-Pandarpur/be/sql/01_melarooms_pandharpur.sql'));
$root->multi_query($sql);
do { if ($r = $root->store_result()) $r->free(); } while ($root->more_results() && $root->next_result());
$ts = new mysqli('localhost', 'sa', 'd', 'melarooms_pandharpur_test');
$ts->query('ALTER TABLE families DROP INDEX uq_families_whatsapp');
$ts->set_charset('utf8');
require_once __DIR__ . '/../base/functions.php';
require_once __DIR__ . '/../lib/dupcheck.php';

$fails = 0;
function check($name, $cond) { global $fails; echo ($cond ? 'PASS ' : 'FAIL ') . $name . "\n"; if (!$cond) $fails++; }

$ts->query("INSERT INTO families (leader,city,citygroup,whatsapp,submit_token) VALUES ('A','C',1,'9876543210','tok-1')");
$fid = $ts->insert_id;
$ts->query("INSERT INTO members (name,familyid,photoidno) VALUES ('M',$fid,'2000 0000 0013')");

check('same token -> TOKEN', find_duplicate_family($ts, '9111111111', [], 'tok-1')['reason'] === 'TOKEN');
check('same whatsapp is allowed', find_duplicate_family($ts, '+91 98765-43210', [], 'tok-2') === null);
check('member aadhaar used elsewhere -> AADHAAR', find_duplicate_family($ts, '9222222222', ['200000000013'], 'tok-2')['reason'] === 'AADHAAR');
check('aadhaar with spaces normalised', find_duplicate_family($ts, '9222222222', ['2000-0000-0013'], 'tok-2') !== null);
check('own family excluded (no false positive)', find_duplicate_family($ts, '9876543210', ['200000000013'], null, $fid) === null);
check('empty whatsapp never collides', find_duplicate_family($ts, '', [], 'tok-9') === null);
check('unrelated data -> null', find_duplicate_family($ts, '9333333333', ['200000000021'], 'tok-9') === null);
check('whatsapp normalised on save helper', normalize_phone10('+91 98765 43210') === '9876543210' && normalize_phone10('') === '');
$ts->query("INSERT INTO families (leader,city,citygroup,whatsapp) VALUES ('P','C',1,'9444444444')");
$pf = $ts->insert_id;
$ts->query("INSERT INTO members (name,familyid,photoidno) VALUES ('Pass',$pf,'L1234567')");
check('passport id matches regardless of case/spaces', find_duplicate_family($ts, '9555555555', ['l 1234-567'], 'tok-3')['reason'] === 'AADHAAR');
check('too-short id ignored', find_duplicate_family($ts, '9555555555', ['AB1'], 'tok-3') === null);
check('photo_id_norm', photo_id_norm('l 1234-567') === 'L1234567');
exit($fails ? 1 : 0);
