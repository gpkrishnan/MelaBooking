<?php
// Saves the leader and members of a booking to Google Contacts (People API).
// Name = "PAN-<regn> <NAME>", label (contact group) = GC_LABEL. An existing contact with the same
// phone (last 10 digits) is renamed instead of duplicated.
// Credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN) live in base/secrets.php.
// Get the refresh token once with tools/google_contacts_auth.php.
require_once __DIR__ . '/dupcheck.php';
if (is_file(__DIR__ . '/../base/secrets.php')) require_once __DIR__ . '/../base/secrets.php';

const GC_LABEL      = 'PAN-2027';
const GC_PREFIX     = 'PAN-';
const GC_REGN_ADD   = 5100;   // registration number = familyid + 5100 (same as the KKID in updatefamily.php)
const GC_COUNTRY    = '+91';
const GC_API        = 'https://people.googleapis.com/v1/';

function gc_configured()
{
    return defined('GOOGLE_CLIENT_ID') && defined('GOOGLE_CLIENT_SECRET') && defined('GOOGLE_REFRESH_TOKEN')
        && GOOGLE_REFRESH_TOKEN !== '';
}

/** One HTTP call; returns decoded JSON or throws with Google's error text. */
function gc_http($method, $url, $body = null, $token = null, $form = false)
{
    $ch = curl_init($url);
    $headers = [];
    if ($token) $headers[] = 'Authorization: Bearer ' . $token;
    if ($body !== null) {
        if ($form) {
            $payload = http_build_query($body);
        } else {
            $payload = json_encode($body);
            $headers[] = 'Content-Type: application/json';
        }
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    }
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CONNECTTIMEOUT => 8,
    ]);
    $res  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);
    if ($res === false) throw new Exception('Network error: ' . $err);
    $j = json_decode($res, true);
    if ($code >= 400) {
        $msg = $j['error']['message'] ?? ($j['error_description'] ?? ($j['error'] ?? $res));
        throw new Exception("Google $code: " . (is_string($msg) ? $msg : json_encode($msg)));
    }
    return $j ?? [];
}

function gc_access_token()
{
    static $tok = null, $exp = 0;
    if ($tok && time() < $exp) return $tok;
    $j = gc_http('POST', 'https://oauth2.googleapis.com/token', [
        'client_id'     => GOOGLE_CLIENT_ID,
        'client_secret' => GOOGLE_CLIENT_SECRET,
        'refresh_token' => GOOGLE_REFRESH_TOKEN,
        'grant_type'    => 'refresh_token',
    ], null, true);
    $tok = $j['access_token'];
    $exp = time() + max(60, intval($j['expires_in'] ?? 3600) - 60);
    return $tok;
}

/** resourceName of the PAN-2027 label; created when missing. */
function gc_label_group()
{
    static $rn = null;
    if ($rn) return $rn;
    $t = gc_access_token();
    $pageToken = '';
    do {
        $j = gc_http('GET', GC_API . 'contactGroups?pageSize=200' . ($pageToken ? '&pageToken=' . urlencode($pageToken) : ''), null, $t);
        foreach (($j['contactGroups'] ?? []) as $g) {
            if (($g['groupType'] ?? '') === 'USER_CONTACT_GROUP' && ($g['name'] ?? '') === GC_LABEL) return $rn = $g['resourceName'];
        }
        $pageToken = $j['nextPageToken'] ?? '';
    } while ($pageToken);
    $j = gc_http('POST', GC_API . 'contactGroups', ['contactGroup' => ['name' => GC_LABEL]], $t);
    return $rn = $j['resourceName'];
}

/** phone10 -> contact resourceName map kept locally: searchContacts is only eventually consistent for new contacts. */
function gc_ensure_table($ts)
{
    mysqli_query($ts, "CREATE TABLE IF NOT EXISTS google_contacts (phone10 CHAR(10) NOT NULL PRIMARY KEY, resource_name VARCHAR(100) NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)");
}

function gc_find_existing($ts, $phone10)
{
    $r = mysqli_fetch_row(mysqli_query($ts, "SELECT resource_name FROM google_contacts WHERE phone10='" . mysqli_real_escape_string($ts, $phone10) . "'"));
    if ($r) return $r[0];
    $t = gc_access_token();
    if (!gc_find_existing_warm($t)) { /* warm-up request required by the API */ }
    $j = gc_http('GET', GC_API . 'people:searchContacts?pageSize=30&readMask=phoneNumbers&query=' . urlencode($phone10), null, $t);
    foreach (($j['results'] ?? []) as $res) {
        foreach (($res['person']['phoneNumbers'] ?? []) as $pn) {
            if (normalize_phone10($pn['value'] ?? '') === $phone10) return $res['person']['resourceName'];
        }
    }
    // search matches numbers poorly when they contain spaces/dashes: compare against every contact instead
    return gc_all_phones($t)[$phone10] ?? null;
}

/** phone10 => resourceName for every contact in the account (read once per request). */
function gc_all_phones($t)
{
    static $map = null;
    if ($map !== null) return $map;
    $map = [];
    $pageToken = '';
    do {
        $j = gc_http('GET', GC_API . 'people/me/connections?pageSize=1000&personFields=phoneNumbers' . ($pageToken ? '&pageToken=' . urlencode($pageToken) : ''), null, $t);
        foreach (($j['connections'] ?? []) as $c) {
            foreach (($c['phoneNumbers'] ?? []) as $pn) {
                $p = normalize_phone10($pn['value'] ?? '');
                if ($p !== '' && !isset($map[$p])) $map[$p] = $c['resourceName'];
            }
        }
        $pageToken = $j['nextPageToken'] ?? '';
    } while ($pageToken);
    return $map;
}

function gc_find_existing_warm($t)
{
    static $done = false;
    if (!$done) { // searchContacts needs an empty query first to refresh its cache
        gc_http('GET', GC_API . 'people:searchContacts?query=&readMask=names', null, $t);
        $done = true;
    }
    return true;
}

/** Create the contact or rename the existing one, then make sure it carries the label. */
function gc_upsert($ts, $name, $phone10)
{
    $t  = gc_access_token();
    $rn = gc_find_existing($ts, $phone10);
    if ($rn) {
        try {
            $p = gc_http('GET', GC_API . $rn . '?personFields=names', null, $t);
            gc_http('PATCH', GC_API . $rn . ':updateContact?updatePersonFields=names',
                ['etag' => $p['etag'], 'names' => [['givenName' => $name]]], $t);
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'Google 404') === false) throw $e;
            $rn = null; // contact was deleted in Google: create it again
        }
    }
    if (!$rn) {
        $j  = gc_http('POST', GC_API . 'people:createContact',
            ['names' => [['givenName' => $name]], 'phoneNumbers' => [['value' => GC_COUNTRY . $phone10, 'type' => 'mobile']]], $t);
        $rn = $j['resourceName'];
    }
    gc_http('POST', GC_API . gc_label_group() . '/members:modify', ['resourceNamesToAdd' => [$rn]], $t);
    mysqli_query($ts, sprintf("REPLACE INTO google_contacts (phone10, resource_name) VALUES ('%s','%s')",
        mysqli_real_escape_string($ts, $phone10), mysqli_real_escape_string($ts, $rn)));
}

/**
 * Sync leader + members of a family. Never throws.
 * Returns ['status' => 'ok'|'partial'|'failed'|'skipped', 'synced' => n, 'errors' => [...]].
 */
function gc_sync_family($ts, $familyid)
{
    if (!gc_configured()) return ['status' => 'skipped', 'synced' => 0, 'errors' => ['Google Contacts not configured']];
    $familyid = intval($familyid);
    $regn  = $familyid + GC_REGN_ADD;
    $people = []; // phone10 => name (leader first, so the leader wins if a member shares the number)
    $f = mysqli_fetch_assoc(mysqli_query($ts, "SELECT leader, whatsapp, phone2 FROM families WHERE familyid=$familyid"));
    if ($f) {
        $ph = normalize_phone10($f['whatsapp']) ?: normalize_phone10($f['phone2']);
        if ($ph !== '' && trim($f['leader']) !== '') $people[$ph] = trim($f['leader']);
    }
    $q = mysqli_query($ts, "SELECT name, phone FROM members WHERE familyid=$familyid ORDER BY memberid");
    while ($m = mysqli_fetch_assoc($q)) {
        $ph = normalize_phone10($m['phone']);
        if ($ph !== '' && trim($m['name']) !== '' && !isset($people[$ph])) $people[$ph] = trim($m['name']);
    }
    $synced = 0; $errors = [];
    try {
        gc_ensure_table($ts);
        foreach ($people as $ph => $nm) {
            try {
                gc_upsert($ts, GC_PREFIX . $regn . ' ' . $nm, $ph);
                $synced++;
            } catch (Exception $e) {
                $errors[] = "$nm ($ph): " . $e->getMessage();
            }
            if (count($errors) >= 3 && $synced == 0) break; // auth/config problem: stop hammering Google
        }
    } catch (Exception $e) {
        $errors[] = $e->getMessage();
    }
    foreach ($errors as $e) error_log('Google contacts sync, family ' . $familyid . ': ' . $e);
    $status = !$errors ? 'ok' : ($synced > 0 ? 'partial' : 'failed');
    return ['status' => $status, 'synced' => $synced, 'errors' => $errors];
}
