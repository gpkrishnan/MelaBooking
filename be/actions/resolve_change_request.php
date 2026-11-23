<?php
require_once '../base/connection.php';
require_once '../lib/api.php';
$in = api_start();
$id = intval($in['id'] ?? 0);
$done = !empty($in['done']);
$st = $done ? 'D' : 'O';
$s = $ts->prepare("UPDATE $database_prebooking.change_requests SET status=?, done_at=IF(?='D', NOW(), NULL) WHERE id=?");
$s->bind_param('ssi', $st, $st, $id);
$s->execute();
echo json_encode(['success' => $s->affected_rows >= 0 && $id > 0]);
