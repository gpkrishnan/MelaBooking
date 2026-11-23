<?php
require_once '../base/connection.php';
require_once '../lib/auth.php';
require_admin();
$id = intval($_GET['doc_id'] ?? 0);
$s = $ts->prepare('SELECT file_name, mime FROM aadhaar_docs WHERE doc_id=?');
$s->bind_param('i', $id); $s->execute();
$r = $s->get_result()->fetch_assoc();
$path = $r ? AADHAAR_DIR . '/' . basename($r['file_name']) : '';
if (!$r || !is_file($path)) { http_response_code(404); exit; }
header('Content-Type: ' . $r['mime']);
header('Content-Length: ' . filesize($path));
header('Content-Disposition: inline');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
readfile($path);
