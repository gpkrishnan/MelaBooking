<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../base/connection.php';
require_once '../lib/dupcheck.php';
require_once '../lib/google_contacts.php';
require_once '../lib/roomsplan.php';

// Get JSON data from request body
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Merge with $_POST for backward compatibility
if ($data) {
    $_POST = array_merge($_POST, $data);
}

$out = ['success' => false, 'message' => 'Invalid request'];

if (isset($_POST['id'])) {
    // names and city are stored in upper case
    foreach (['name', 'city'] as $k) {
        if (isset($_POST[$k]) && is_string($_POST[$k])) {
            $_POST[$k] = mb_strtoupper(trim($_POST[$k]), 'UTF-8');
        }
    }
    foreach (($_POST['members'] ?? []) as $i => $mm) {
        if (isset($mm['name']) && is_string($mm['name'])) {
            $_POST['members'][$i]['name'] = mb_strtoupper(trim($mm['name']), 'UTF-8');
        }
    }
    // ---- duplicate-booking protection (token / WhatsApp / Aadhaar) ----
    $waNorm   = normalize_phone10($_POST['whatsapp'] ?? '');
    if ($waNorm !== '') {
        $_POST['whatsapp'] = $waNorm; // store one canonical form
    }
    $aadhaars = [];
    foreach (($_POST['members'] ?? []) as $mm) {
        $a = photo_id_norm($mm['photoid'] ?? '');
        if (strlen($a) >= 6) {
            if (in_array($a, $aadhaars, true)) {
                echo json_encode(['success' => false, 'code' => 'DUPLICATE', 'reason' => 'AADHAAR_IN_FORM', 'message' => 'The same Aadhaar number is entered for two members']);
                exit;
            }
            $aadhaars[] = $a;
        }
    }
    $token = !empty($_POST['submit_token']) ? substr(preg_replace('/[^A-Za-z0-9\-]/', '', $_POST['submit_token']), 0, 40) : null;
    ensure_rooms_plan_column($ts);
    ensure_share_column($ts);
    $setPlan   = array_key_exists('roomsplan', $_POST); // sent only when the room split was set or changed, so old bookings are left as they are
    $roomsPlan = $setPlan ? normalize_rooms_plan($_POST['roomsplan']) : '';
    if ($roomsPlan === null) { echo json_encode(['success' => false, 'message' => 'Rooms plan must be numbers like 2+3 (people in each room)']); exit; }
    $cancelling = (($_POST['brn']['booking_status'] ?? '') == 'C');
    $setShare   = array_key_exists('share_ref', $_POST) || $cancelling;
    $share      = ['id' => 0];
    if ($setShare && !$cancelling) {
        $share = resolve_share_partner($ts, $_POST['share_ref'], intval($_POST['id']), $_POST['roomcategory'] ?? '', isset($_POST['members']) ? sizeof($_POST['members']) : 0);
        if (isset($share['error'])) { echo json_encode(['success' => false, 'message' => $share['error']]); exit; }
    }
    if (!$setShare && intval($_POST['id']) > 0) { // an existing link must keep both bookings in the same room category
        $cur = mysqli_fetch_row(mysqli_query($ts, 'SELECT familyid FROM families WHERE combine_no=(SELECT combine_no FROM families WHERE familyid=' . intval($_POST['id']) . ') AND familyid<>' . intval($_POST['id']) . ' LIMIT 1'));
        $cur = $cur ? $cur[0] : null;
        if ($cur !== null && strcasecmp(trim((string) GFV('families', 'room_category', 'familyid=' . intval($cur))), trim((string) ($_POST['roomcategory'] ?? ''))) != 0) {
            echo json_encode(['success' => false, 'message' => 'This booking shares a room with booking ' . (intval($cur) + 5100) . '. Remove the sharing first to change the room category']);
            exit;
        }
    }
    $isNew = (0 == $_POST['id']);
    $preId = $isNew ? intval($_POST['prebooking_id'] ?? 0) : 0;
    $newFamilyId = $preId;
    if ($isNew && $preId == 0) { // booking made by the admin: ids 1-100 are kept for these
        $want = intval($_POST['requested_id'] ?? 0);
        if ($want != 0) { // the admin chose the number
            if ($want < 1 || $want > 100) { echo json_encode(['success' => false, 'message' => 'Booking number must be between 1 and 100']); exit; }
            if (mysqli_num_rows(mysqli_query($ts, "SELECT 1 FROM families WHERE familyid=$want")) > 0) { echo json_encode(['success' => false, 'message' => 'Booking number ' . $want . ' is already used']); exit; }
            $newFamilyId = $want;
        } else { // none given: next free number after the highest used one
            $mx = intval(mysqli_fetch_row(mysqli_query($ts, 'SELECT COALESCE(MAX(familyid),0) FROM families WHERE familyid<=100'))[0]);
            if ($mx >= 100) { echo json_encode(['success' => false, 'message' => 'Admin booking numbers 1-100 are all used']); exit; }
            $newFamilyId = $mx + 1;
        }
    }
    if ($preId > 0) { // a booking made from a pre-registration keeps its number: family id = pre-registration id
        $pr = mysqli_fetch_assoc(mysqli_query($ts, "SELECT id, mela_regn_id FROM $database_prebooking.group_head WHERE id=$preId"));
        if (!$pr) { echo json_encode(['success' => false, 'message' => 'Pre-registration not found']); exit; }
        if ($pr['mela_regn_id']) { echo json_encode(['success' => false, 'message' => 'This pre-registration is already registered (booking #' . $pr['mela_regn_id'] . ')']); exit; }
        if ($preId <= 100) { echo json_encode(['success' => false, 'message' => 'Pre-registration ids start at 101 (1-100 are kept for admin bookings)']); exit; }
        if (mysqli_num_rows(mysqli_query($ts, "SELECT 1 FROM families WHERE familyid=$preId")) > 0) { echo json_encode(['success' => false, 'message' => 'Family number ' . (5100 + $preId) . ' is already used by another booking']); exit; }
    }
    $dup   = find_duplicate_family($ts, $_POST['whatsapp'] ?? '', $aadhaars, $isNew ? $token : null, $isNew ? 0 : intval($_POST['id']));
    if ($dup) {
        if ($dup['reason'] === 'TOKEN') { // same submission sent again: report the original result
            echo json_encode(['success' => true, 'message' => 'Created successfully', 'familyid' => $dup['familyid'], 'duplicate_submit' => true]);
        } else {
            echo json_encode(['success' => false, 'code' => 'DUPLICATE', 'reason' => $dup['reason'], 'familyid' => $dup['familyid'],
                'message' => $dup['reason'] === 'WHATSAPP' ? 'This WhatsApp number is already booked in family #' . $dup['familyid'] : 'An Aadhaar number here is already booked in family #' . $dup['familyid']]);
        }
        exit;
    }
    if (0 != $_POST['id']) {
        $query = sprintf("UPDATE families set leader=%s, city=%s, citygroup=%s,whatsapp=%s,phone2=%s,fremarks=%s,address=%s,room_category=%s%s WHERE familyid=%s",
            GSLV($_POST['name'], "text"),
            GSLV($_POST['city'], 'text'),
            GSLV($_POST['citygroup'], 'int'),
            GSLV($_POST['whatsapp'], 'text'),
            GSLV($_POST['phone'], 'text'),
            GSLV($_POST['fremarks'], 'text'),
            GSLV($_POST['address'], 'text'),
            GSLV($_POST['roomcategory'], 'text'),
            $setPlan ? ',rooms_plan=' . GSLV($roomsPlan, 'text') : '',
            GSLV($_POST['id'], 'int'));
        if (mysqli_query($ts, $query)) {
            $id = $_POST['id'];
           
        } else {
            $out = ['success' => false, 'message' => 'Failed to update family', 'error' => mysqli_error($ts)];
            echo json_encode($out);
            exit;
        }
    } else {
        $uuid  = UUID();
        $query = sprintf("INSERT INTO families (familyid, " . ($preId > 0 ? "prereg_id, " : "") . "leader, city, citygroup,whatsapp,phone2,fremarks,address,room_category,rooms_plan,uuid,submit_token) VALUES ($newFamilyId, " . ($preId > 0 ? "$preId, " : "") . "%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            GSLV($_POST['name'], "text"),
            GSLV($_POST['city'], 'text'),
            GSLV($_POST['citygroup'], 'int'),
            GSLV($_POST['whatsapp'], 'text'),
            GSLV($_POST['phone'], 'text'),
            GSLV($_POST['fremarks'], 'text'),
            GSLV($_POST['address'], 'text'),
            GSLV($_POST['roomcategory'], 'text'),
            GSLV($roomsPlan, 'text'),
            GSLV($uuid, 'text'),
            GSLV($token, 'text'));
        if (mysqli_query($ts, $query)) {
            $id = mysqli_insert_id($ts);
             if (isset($_POST['prebooking_id']) && $_POST['prebooking_id']!=0){
                $queryP="UPDATE $database_prebooking.group_head set mela_regn_id=$id, status='P' WHERE id=".intval($_POST['prebooking_id']);
                mysqli_query($ts,$queryP);
            }
        } else {
            if (1062 == mysqli_errno($ts)) { // lost a race against an identical submit: unique key stopped it
                $again = $token ? find_duplicate_family($ts, '', [], $token, 0) : null;
                if ($again) {
                    echo json_encode(['success' => true, 'message' => 'Created successfully', 'familyid' => $again['familyid'], 'duplicate_submit' => true]);
                } else {
                    echo json_encode(['success' => false, 'code' => 'DUPLICATE', 'reason' => 'WHATSAPP', 'message' => 'This WhatsApp number is already booked']);
                }
                exit;
            }
            $out = ['success' => false, 'message' => 'Failed to insert family', 'error' => mysqli_error($ts)];
            echo json_encode($out);
            exit;
        }
    }
    if (isset($id)) {
        if (! isset($_POST['brn']) || '' == $_POST['brn']['booking_date']) {
            $bookdt = date('Y-m-d');
        } else {
            $bookdt = date('Y-m-d', strtotime($_POST['brn']['booking_date']));
        }
        if ('' == $_POST['brn']['receipt_date']) {
            $recptdt = '';
        } else {
            $recptdt = date('Y-m-d', strtotime($_POST['brn']['receipt_date']));
        }
        if ('' == $_POST['brn']['booking_status']) {
            $_POST['brn']['booking_status'] = 'R';
        }

        if (0 != $_POST['id']) {
            if ($_POST['brn']['booking_status']=='C'){
                $_POST['brn']['bill_amount']=0;
            }

            $query1 = sprintf("UPDATE brn set booking_date=%s, bill_amount=%s, recd_amount=%s,receipt_date=%s, pay_mode=%s, paymentdetails=%s,booking_status=%s WHERE familyid=%s",
                GSLV($bookdt, "date"),  
                GSLV($_POST['brn']['bill_amount'], 'int'),
                GSLV($_POST['brn']['recd_amount'], 'int'),
                GSLV($recptdt, "date"),
                GSLV($_POST['brn']['pay_mode'], "text"),
                GSLV($_POST['brn']['pay_detail'], "text"),
                GSLV($_POST['brn']['booking_status'], "text"),
                GSLV($id, "int"));
        } else {

            $query1 = sprintf("INSERT INTO brn (booking_date, bill_amount, recd_amount,receipt_date, pay_mode, paymentdetails,booking_status,familyid) VALUES(%s,%s,%s,%s,%s,%s,%s,%s)",
                GSLV($bookdt, "date"),
                GSLV($_POST['brn']['bill_amount'], 'int'),
                GSLV($_POST['brn']['recd_amount'], 'int'),
                GSLV($recptdt, "date"),
                GSLV($_POST['brn']['pay_mode'], "text"),
                GSLV($_POST['brn']['pay_detail'], "text"),
                GSLV($_POST['brn']['booking_status'], "text"),
                GSLV($id, "int"));
        }
        if (mysqli_query($ts, $query1)) {
            // room sharing between two single-person bookings: linked on both, removed from both on cancel
            if ($setShare) {
                apply_share($ts, $id, $share['id']);
            } elseif (isset($_POST['members']) && sizeof($_POST['members']) != 1 && GFV('families', 'combine_no', 'familyid=' . intval($id)) !== null) {
                apply_share($ts, $id, 0); // no longer a single-person booking
            }
            // keep the public pre-registration's status letter (R / B) in step with this booking
            $syncPre = $isNew ? $preId : intval(GFV('families', 'prereg_id', 'familyid=' . intval($id)));
            if ($syncPre > 0) {
                $bst = substr(preg_replace('/[^A-Z]/', '', strtoupper($_POST['brn']['booking_status'] ?? 'R')), 0, 1);
                mysqli_query($ts, "UPDATE $database_prebooking.group_head SET booking_status='$bst' WHERE id=$syncPre");
            }
            if (isset($_POST['members'])) {
                if (sizeof($_POST['members']) < 10) {
                    $totmem = '0' . sizeof($_POST['members']);
                } else {
                    $totmem = sizeof($_POST['members']);
                }
                for ($m = 0; $m < sizeof($_POST['members']); $m++) {
                    if (($m + 1) < 10) {
                        $memno = "0" . ($m + 1);
                    } else {
                        $memno = ($m + 1);
                    }
                    if ('' != $_POST['members'][$m]['arrival']['time']) {
                        $arrtime = date('Y-m-d H:i:s', strtotime($_POST['members'][$m]['arrival']['time']));
                    } else {
                        $arrtime = '';
                    }
                    if ('' != $_POST['members'][$m]['arrival']['check-in']) {
                        $checkin = date('Y-m-d H:i:s', strtotime($_POST['members'][$m]['arrival']['check-in']));
                    } else {
                        $checkin = '';
                    }
                    if ('' != $_POST['members'][$m]['depature']['time']) {
                        $deptime = date('Y-m-d H:i:s', strtotime($_POST['members'][$m]['depature']['time']));
                    } else {
                        $deptime = '';
                    }
                    if ('' != $_POST['members'][$m]['depature']['check-out']) {
                        $checkout = date('Y-m-d H:i:s', strtotime($_POST['members'][$m]['depature']['check-out']));
                    } else {
                        $checkout = '';
                    }
                    if ('C' == $_POST['brn']['booking_status']) { // if booking canceled set bed id to null
                        $_POST['members'][$m]['bed']['bedid'] = null;
                    }

                    $kkid = ($id + 5100) . "-" . $totmem . "-" . $memno;
                    if (0 == $_POST['members'][$m]['memberid']) {
                        $query2 = sprintf("INSERT INTO members (`name`,`photoidno`,phone,sex,age,familyid,p_roomtype,p_toilet,p_floor,p_cot,bedid, arr_mode,arr_train_no,arr_train_time,arr_city,pickup_bus,checkin_time,checkout_time,dep_mode,dep_train_no,dep_time,dep_city,drop_bus,KKID, arr_seat_no, dep_seat_no) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, %s, %s)",
                            GSLV($_POST['members'][$m]['name'], "text"),
                            GSLV($_POST['members'][$m]['photoid'], "text"),
                            GSLV($_POST['members'][$m]['phone'], "text"),
                            GSLV($_POST['members'][$m]['sex'], "text"),
                            GSLV($_POST['members'][$m]['age'], "int"),
                            GSLV($id, "int"),
                            GSLV($_POST['members'][$m]['prefer']['roomtype'], "text"),
                            GSLV($_POST['members'][$m]['prefer']['toilet'], "text"),
                            GSLV($_POST['members'][$m]['prefer']['floor'], "text"),
                            GSLV($_POST['members'][$m]['prefer']['cot'], "text"),
                            GSLV($_POST['members'][$m]['bed']['bedid'], "text"),
                            GSLV($_POST['members'][$m]['arrival']['mode'], "text"),
                            GSLV($_POST['members'][$m]['arrival']['train'], "text"),
                            GSLV($arrtime, "date"),
                            GSLV($_POST['members'][$m]['arrival']['city'], "text"),
                            GSLV($_POST['members'][$m]['arrival']['pickup'], "int"),
                            GSLV($checkin, "date"),
                            GSLV($checkout, "date"),
                            GSLV($_POST['members'][$m]['depature']['mode'], "text"),
                            GSLV($_POST['members'][$m]['depature']['train'], "text"),
                            GSLV($deptime, "date"),
                            GSLV($_POST['members'][$m]['depature']['city'], "text"),
                            GSLV($_POST['members'][$m]['depature']['drop'], "int"),
                            GSLV($kkid, "text"),
                            GSLV($_POST['members'][$m]['arrival']['seat'], "text"),
                            GSLV($_POST['members'][$m]['depature']['seat'], "text")
                        );
                    } else {
                        $query2 = sprintf("UPDATE members SET `name`=%s,`photoidno`=%s,phone=%s,sex=%s,age=%s,familyid=%s,p_roomtype=%s,p_toilet=%s,p_floor=%s,p_cot=%s,bedid=%s, arr_mode=%s,arr_train_no=%s,arr_train_time=%s,arr_city=%s,pickup_bus=%s,checkin_time=%s,checkout_time=%s,dep_mode=%s,dep_train_no=%s,dep_time=%s,dep_city=%s,drop_bus=%s, KKID=%s, arr_seat_no=%s, dep_seat_no=%s WHERE memberid=%s",
                            GSLV($_POST['members'][$m]['name'], "text"),
                            GSLV($_POST['members'][$m]['photoid'], "text"),
                            GSLV($_POST['members'][$m]['phone'], "text"),
                            GSLV($_POST['members'][$m]['sex'], "text"),
                            GSLV($_POST['members'][$m]['age'], "int"),
                            GSLV($id, "int"),
                            GSLV($_POST['members'][$m]['prefer']['roomtype'], "text"),
                            GSLV($_POST['members'][$m]['prefer']['toilet'], "text"),
                            GSLV($_POST['members'][$m]['prefer']['floor'], "text"),
                            GSLV($_POST['members'][$m]['prefer']['cot'], "text"),
                            GSLV($_POST['members'][$m]['bed']['bedid'], "text"),
                            GSLV($_POST['members'][$m]['arrival']['mode'], "text"),
                            GSLV($_POST['members'][$m]['arrival']['train'], "text"),
                            GSLV($arrtime, "date"),
                            GSLV($_POST['members'][$m]['arrival']['city'], "text"),
                            GSLV($_POST['members'][$m]['arrival']['pickup'], "int"),
                            GSLV($checkin, "date"),
                            GSLV($checkout, "date"),
                            GSLV($_POST['members'][$m]['depature']['mode'], "text"),
                            GSLV($_POST['members'][$m]['depature']['train'], "text"),
                            GSLV($deptime, "date"),
                            GSLV($_POST['members'][$m]['depature']['city'], "text"),
                            GSLV($_POST['members'][$m]['depature']['drop'], "int"),
                            GSLV($kkid, "text"),
                            GSLV($_POST['members'][$m]['arrival']['seat'], "text"),
                            GSLV($_POST['members'][$m]['depature']['seat'], "text"),
                            GSLV($_POST['members'][$m]['memberid'], "int"));
                    }
                    if (! mysqli_query($ts, $query2)) {
                        $out = ['success' => false, 'message' => 'Failed to save member', 'error' => mysqli_error($ts)];
                        echo json_encode($out);
                        exit;
                    }
                }
            }

            if (0 != $_POST['id']) {
                $out = ['success' => true, 'message' => 'Updated successfully', 'familyid' => $id];
            } else {
                $out = ['success' => true, 'message' => 'Created successfully', 'familyid' => $id];
            }
            // save leader + members to Google Contacts; a failure never undoes the booking
            $out['contacts_sync'] = gc_sync_family($ts, $id);
        } else {
            $out = ['success' => false, 'message' => 'Failed to save booking', 'error' => mysqli_error($ts)];
        }

    }
}
echo json_encode($out);
