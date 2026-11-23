<?php
require_once '../base/connection.php';
require_once '../lib/api.php';
api_start();
$digits = strtoupper(preg_replace('/[^0-9A-Za-z]/', '', $_GET['aadhaar'] ?? ''));
if (strlen($digits) < 6) { echo json_encode(['found' => false]); exit; }
$hash = aadhaar_hash($digits);
$s = $ts->prepare('SELECT doc_id, last4, mime, uploaded_at FROM aadhaar_docs WHERE aadhaar_hash=?');
$s->bind_param('s', $hash); $s->execute();
$r = $s->get_result()->fetch_assoc();
echo json_encode($r ? ['found' => true] + $r : ['found' => false]);
