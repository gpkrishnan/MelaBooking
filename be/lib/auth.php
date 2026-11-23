<?php
require_once __DIR__ . '/../base/secrets.php';

// ID-proof images live in be/storage/aadhaar (web access denied via .htaccess); secrets.php may override.
if (!defined('AADHAAR_DIR')) define('AADHAAR_DIR', __DIR__ . '/../storage/aadhaar');
if (!is_dir(AADHAAR_DIR)) @mkdir(AADHAAR_DIR, 0775, true);
$aadhaarDeny = dirname(AADHAAR_DIR) . '/.htaccess';
if (is_dir(dirname(AADHAAR_DIR)) && !is_file($aadhaarDeny)) @file_put_contents($aadhaarDeny, "Require all denied\n");

function b64u($s) { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }

function admin_token_issue($ttl = 43200)
{
    $p = b64u(json_encode(['exp' => time() + $ttl]));
    return $p . '.' . hash_hmac('sha256', $p, ADMIN_TOKEN_SECRET);
}

function admin_token_valid($token)
{
    $parts = explode('.', (string) $token);
    if (count($parts) !== 2) return false;
    if (!hash_equals(hash_hmac('sha256', $parts[0], ADMIN_TOKEN_SECRET), $parts[1])) return false;
    $p = json_decode(base64_decode(strtr($parts[0], '-_', '+/')), true);
    return is_array($p) && ($p['exp'] ?? 0) > time();
}

/** Token from "Authorization: Bearer x" or t=x in the query/form (images cannot send headers; some hosts strip the header). Exits 401 if invalid. */
function require_admin()
{
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if (!$h && function_exists('apache_request_headers')) { foreach (apache_request_headers() as $k => $v) if (strtolower($k) === 'authorization') $h = $v; }
    $tok = preg_match('/^Bearer\s+(.+)$/i', $h, $m) ? $m[1] : ($_GET['t'] ?? ($_POST['t'] ?? ''));
    if (!admin_token_valid($tok)) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'code' => 'UNAUTHORIZED', 'message' => 'Please log in again']);
        exit;
    }
}

function aadhaar_hash($digits) { return hash('sha256', $digits . AADHAAR_PEPPER); }

/** aadhaar_hash => doc_id for every stored ID image (members are matched by hashing their photo ID number). */
function aadhaar_doc_map($ts)
{
    $map = [];
    $r = mysqli_query($ts, 'SELECT doc_id, aadhaar_hash FROM aadhaar_docs');
    while ($r && ($row = mysqli_fetch_assoc($r))) $map[$row['aadhaar_hash']] = (int) $row['doc_id'];
    return $map;
}

/** 'none' (no ID number entered), 'submitted' (image stored) or 'pending'. Sets $docId when submitted. */
function photoid_state($photoidno, $docMap, &$docId = null)
{
    $digits = strtoupper(preg_replace('/[^0-9A-Za-z]/', '', (string) $photoidno));
    $docId = null;
    if (strlen($digits) < 6) return 'none';
    $h = aadhaar_hash($digits);
    if (isset($docMap[$h])) { $docId = $docMap[$h]; return 'submitted'; }
    return 'pending';
}
