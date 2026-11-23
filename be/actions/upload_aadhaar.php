<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { exit; }
require_once '../base/connection.php';
require_once '../lib/auth.php';
require_admin();

$fail = function ($msg, $code = 400) { http_response_code($code); echo json_encode(['success' => false, 'message' => $msg]); exit; };
$digits = strtoupper(preg_replace('/[^0-9A-Za-z]/', '', $_POST['aadhaar'] ?? ''));
if (strlen($digits) < 6) $fail('Enter the photo ID / Aadhaar number first');
if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) $fail('No file received');
$f = $_FILES['file'];
if ($f['size'] > 5 * 1024 * 1024) $fail('File is larger than 5 MB');
$mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
$ext  = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'application/pdf' => 'pdf'][$mime] ?? null;
if (!$ext) $fail('Only JPG, PNG or PDF files are allowed');
if (!is_dir(AADHAAR_DIR)) $fail('Storage folder is not configured', 500);

$hash = aadhaar_hash($digits);
$s = $ts->prepare('SELECT doc_id, file_name FROM aadhaar_docs WHERE aadhaar_hash=?');
$s->bind_param('s', $hash); $s->execute();
$old = $s->get_result()->fetch_assoc();
if ($old && empty($_POST['replace'])) $fail('An image is already stored for this Aadhaar. Use Replace to overwrite.', 409);

$name = bin2hex(random_bytes(16)) . '.' . $ext;
if (!move_uploaded_file($f['tmp_name'], AADHAAR_DIR . '/' . $name)) $fail('Could not store the file', 500);
$last4 = substr($digits, -4); $orig = substr(basename($f['name']), 0, 200);
if ($old) {
    @unlink(AADHAAR_DIR . '/' . basename($old['file_name']));
    $u = $ts->prepare('UPDATE aadhaar_docs SET last4=?, file_name=?, orig_name=?, mime=?, uploaded_at=NOW() WHERE doc_id=?');
    $u->bind_param('ssssi', $last4, $name, $orig, $mime, $old['doc_id']); $u->execute();
    $docId = (int) $old['doc_id'];
} else {
    $i = $ts->prepare('INSERT INTO aadhaar_docs (aadhaar_hash,last4,file_name,orig_name,mime) VALUES (?,?,?,?,?)');
    $i->bind_param('sssss', $hash, $last4, $name, $orig, $mime); $i->execute();
    $docId = $ts->insert_id;
}
$m = $ts->prepare("UPDATE members SET aadhaar_doc_id=? WHERE UPPER(REGEXP_REPLACE(photoidno,'[^0-9A-Za-z]',''))=?");
$m->bind_param('is', $docId, $digits); $m->execute();
echo json_encode(['success' => true, 'doc_id' => $docId]);
