<?php
/** Last 10 digits of a phone/WhatsApp value ('' if fewer than 10 digits). */
function normalize_phone10($raw)
{
    $d = preg_replace('/\D+/', '', (string) $raw);
    return strlen($d) >= 10 ? substr($d, -10) : '';
}

/** Photo ID (Aadhaar / passport / other) -> letters+digits only, upper case. */
function photo_id_norm($raw)
{
    return strtoupper(preg_replace('/[^0-9A-Za-z]/', '', (string) $raw));
}

function digits_only($raw)
{
    return preg_replace('/\D+/', '', (string) $raw);
}

/**
 * Finds an existing family that makes this booking a duplicate.
 * Returns ['reason' => 'TOKEN'|'AADHAAR', 'familyid' => int] or null.
 */
function find_duplicate_family($ts, $whatsapp, array $aadhaars, $token, $excludeFamilyId = 0)
{
    $excl = intval($excludeFamilyId);

    if ($token) {
        $s = $ts->prepare('SELECT familyid FROM families WHERE submit_token=? AND familyid<>?');
        $s->bind_param('si', $token, $excl);
        $s->execute();
        if ($r = $s->get_result()->fetch_row()) return ['reason' => 'TOKEN', 'familyid' => (int) $r[0]];
    }

    // The same WhatsApp number may be used by more than one family, so it is not checked.

    foreach ($aadhaars as $a) {
        $a = photo_id_norm($a);
        if (strlen($a) < 6) continue;
        $s = $ts->prepare("SELECT familyid FROM members WHERE familyid<>? AND photoidno IS NOT NULL AND UPPER(REGEXP_REPLACE(photoidno,'[^0-9A-Za-z]',''))=? LIMIT 1");
        $s->bind_param('is', $excl, $a);
        $s->execute();
        if ($r = $s->get_result()->fetch_row()) return ['reason' => 'AADHAAR', 'familyid' => (int) $r[0]];
    }
    return null;
}
