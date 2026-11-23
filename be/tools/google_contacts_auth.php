<?php
// One-time setup: php be/tools/google_contacts_auth.php
// 1. Google Cloud Console: enable "People API"; OAuth consent screen (add yourself as test user, or publish);
//    Credentials -> OAuth client ID -> type "Desktop app". Put GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in be/base/secrets.php.
// 2. Run this script, open the URL, allow access. The browser then fails to load http://localhost/?code=...;
//    copy the code= value from the address bar and paste it here.
// 3. Put the printed GOOGLE_REFRESH_TOKEN line into be/base/secrets.php.
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }
require_once __DIR__ . '/../base/secrets.php';
require_once __DIR__ . '/../lib/google_contacts.php';

if (!defined('GOOGLE_CLIENT_ID') || !defined('GOOGLE_CLIENT_SECRET')) {
    fwrite(STDERR, "Define GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in be/base/secrets.php first.\n");
    exit(1);
}
$redirect = 'http://localhost';
echo "Open this URL:\n\nhttps://accounts.google.com/o/oauth2/v2/auth?" . http_build_query([
    'client_id' => GOOGLE_CLIENT_ID, 'redirect_uri' => $redirect, 'response_type' => 'code',
    'scope' => 'https://www.googleapis.com/auth/contacts', 'access_type' => 'offline', 'prompt' => 'consent',
]) . "\n\nPaste the code: ";
$code = trim(fgets(STDIN));
$j = gc_http('POST', 'https://oauth2.googleapis.com/token', [
    'code' => urldecode($code), 'client_id' => GOOGLE_CLIENT_ID, 'client_secret' => GOOGLE_CLIENT_SECRET,
    'redirect_uri' => $redirect, 'grant_type' => 'authorization_code',
], null, true);
if (empty($j['refresh_token'])) { fwrite(STDERR, "No refresh token returned.\n"); exit(1); }
echo "\nAdd to be/base/secrets.php:\n\ndefine('GOOGLE_REFRESH_TOKEN', '" . $j['refresh_token'] . "');\n";
