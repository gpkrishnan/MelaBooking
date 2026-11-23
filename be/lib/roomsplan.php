<?php
// families.rooms_plan: how the members are split over rooms, a JSON array of people per room, e.g. [2,3] = two rooms (2 + 3 people).
// The column is added on first use so no manual database change is needed.
function ensure_rooms_plan_column($ts)
{
    $r = mysqli_query($ts, "SHOW COLUMNS FROM families LIKE 'rooms_plan'");
    if ($r && mysqli_num_rows($r) == 0) {
        mysqli_query($ts, "ALTER TABLE families ADD COLUMN rooms_plan VARCHAR(60) NULL DEFAULT NULL");
    }
}

// Accepts "2+3", "2,3" or a JSON array; returns the JSON text to store, '' for none, or null when invalid.
function normalize_rooms_plan($raw)
{
    $raw = trim((string) $raw);
    if ($raw === '') {
        return '';
    }
    $parts = json_decode($raw, true);
    if (!is_array($parts)) {
        $parts = preg_split('/[^0-9]+/', $raw, -1, PREG_SPLIT_NO_EMPTY);
    }
    $plan = [];
    foreach ($parts as $p) {
        if (!is_numeric($p) || intval($p) < 1 || intval($p) > 20) {
            return null;
        }
        $plan[] = intval($p);
    }
    return count($plan) ? json_encode($plan) : '';
}

// ---- Single-person bookings that share a room (2, 3 or 4 bookings, depending on the room category) ----
// families.combine_no is a running number (internal use) shared by every booking in the room. It is removed from a
// booking when it is cancelled or unlinked; when only one booking is left in a group the number is dropped from it too.
// families.share_with is the older pair-only link; existing pairs are converted to a combine_no on first use.
function ensure_share_column($ts)
{
    $r = mysqli_query($ts, "SHOW COLUMNS FROM families LIKE 'combine_no'");
    if ($r && mysqli_num_rows($r) == 0) {
        mysqli_query($ts, "ALTER TABLE families ADD COLUMN combine_no INT NULL DEFAULT NULL");
    }
    $r = mysqli_query($ts, "SHOW COLUMNS FROM families LIKE 'share_with'");
    if ($r && mysqli_num_rows($r) > 0) {
        $res = mysqli_query($ts, "SELECT A.familyid AS a, A.share_with AS b FROM families A INNER JOIN families B ON A.share_with=B.familyid AND B.share_with=A.familyid WHERE A.familyid<B.familyid AND A.combine_no IS NULL AND B.combine_no IS NULL");
        while ($res && ($row = mysqli_fetch_assoc($res))) {
            $no = next_combine_no($ts);
            mysqli_query($ts, "UPDATE families SET combine_no=$no WHERE familyid IN (" . intval($row['a']) . ',' . intval($row['b']) . ')');
        }
        mysqli_query($ts, "UPDATE families SET share_with=NULL WHERE share_with IS NOT NULL");
    }
}

function next_combine_no($ts)
{
    return intval(mysqli_fetch_row(mysqli_query($ts, 'SELECT COALESCE(MAX(combine_no),0)+1 FROM families'))[0]);
}

// Most bookings that can share one room: the number at the end of the room category (e.g. "AC-3" -> 3).
function room_capacity($roomCategory)
{
    return preg_match('/(\d+)\s*$/', (string) $roomCategory, $m) ? intval($m[1]) : 1;
}

// "5250", "PAN-2027-5250" or "PAN-2027-5250(B)" -> familyid (displayed number minus 5100), 0 if not a reference.
function parse_booking_ref($ref)
{
    $ref = preg_replace('/\(.*\)\s*$/', '', trim((string) $ref));
    if (!preg_match('/(\d+)\D*$/', $ref, $m)) {
        return 0;
    }
    $n = intval($m[1]);
    return $n > 5100 ? $n - 5100 : 0;
}

function family_member_count($ts, $familyid)
{
    return intval(mysqli_fetch_row(mysqli_query($ts, 'SELECT COUNT(*) FROM members WHERE familyid=' . intval($familyid)))[0]);
}

// Checks that booking $selfId (0 = being created) may join the room of the booking named by $ref.
// Returns ['id' => partner familyid] on success (id 0 when $ref is empty = no sharing) or ['error' => message].
function resolve_share_partner($ts, $ref, $selfId, $roomCategory, $ownMemberCount)
{
    if (trim((string) $ref) === '') {
        return ['id' => 0];
    }
    $pid = parse_booking_ref($ref);
    if ($pid == 0) {
        return ['error' => 'Enter the other booking number like 5250 (PAN-2027-5250)'];
    }
    if ($pid == intval($selfId)) {
        return ['error' => 'A booking cannot share a room with itself'];
    }
    if ($ownMemberCount != 1) {
        return ['error' => 'Only a single-person booking can share a room with another booking'];
    }
    $selfId = intval($selfId);
    $p = mysqli_fetch_assoc(mysqli_query($ts, "SELECT F.familyid, F.leader, F.room_category, F.combine_no, B.booking_status FROM families F LEFT JOIN brn B ON B.familyid=F.familyid WHERE F.familyid=$pid"));
    if (!$p) {
        return ['error' => 'Booking ' . ($pid + 5100) . ' was not found'];
    }
    $label = 'Booking ' . ($pid + 5100) . ' (' . $p['leader'] . ')';
    if ($p['booking_status'] === 'C') {
        return ['error' => "$label is cancelled"];
    }
    if (family_member_count($ts, $pid) != 1) {
        return ['error' => "$label is not a single-person booking"];
    }
    if (strcasecmp(trim((string) $p['room_category']), trim((string) $roomCategory)) != 0) {
        return ['error' => "$label has room category '" . $p['room_category'] . "'. All bookings need the same room category to share"];
    }
    $cap = room_capacity($roomCategory);
    $size = 2; // this booking + the partner
    if ($p['combine_no'] !== null) {
        $size = 1 + intval(mysqli_fetch_row(mysqli_query($ts, 'SELECT COUNT(*) FROM families WHERE combine_no=' . intval($p['combine_no']) . " AND familyid<>$selfId"))[0]);
    }
    if ($size > $cap) {
        return ['error' => "Room category '$roomCategory' takes at most $cap bookings in one room"];
    }
    return ['id' => $pid];
}

// Removes a booking from its group; a group left with one booking is dissolved.
function leave_combine($ts, $familyid)
{
    $familyid = intval($familyid);
    $no = GFV('families', 'combine_no', 'familyid=' . $familyid);
    if ($no === null) {
        return;
    }
    mysqli_query($ts, "UPDATE families SET combine_no=NULL WHERE familyid=$familyid");
    $n = intval(mysqli_fetch_row(mysqli_query($ts, 'SELECT COUNT(*) FROM families WHERE combine_no=' . intval($no)))[0]);
    if ($n < 2) {
        mysqli_query($ts, 'UPDATE families SET combine_no=NULL WHERE combine_no=' . intval($no));
    }
}

// Puts the booking in the same group as $partnerId (0 = take it out of its group).
function apply_share($ts, $familyid, $partnerId)
{
    $familyid  = intval($familyid);
    $partnerId = intval($partnerId);
    $cur       = GFV('families', 'combine_no', 'familyid=' . $familyid);
    if (!$partnerId) {
        leave_combine($ts, $familyid);
        return;
    }
    $target = GFV('families', 'combine_no', 'familyid=' . $partnerId);
    if ($target !== null && $cur !== null && intval($cur) == intval($target)) {
        return; // already together
    }
    leave_combine($ts, $familyid);
    if ($target === null) {
        $target = next_combine_no($ts);
        mysqli_query($ts, "UPDATE families SET combine_no=$target WHERE familyid=$partnerId");
    }
    mysqli_query($ts, 'UPDATE families SET combine_no=' . intval($target) . " WHERE familyid=$familyid");
}
