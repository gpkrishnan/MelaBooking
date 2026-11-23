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
require_once '../lib/roomsplan.php';
ensure_rooms_plan_column($ts);
ensure_share_column($ts);
ensure_related_group_column($ts);

// Get JSON data from request body
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Merge with $_POST for backward compatibility
if ($data) {
    $_POST = array_merge($_POST, $data);
}

$out = [];

if (isset($_POST['familyid'])) {
    $query = "SELECT *,F.familyid as fmlyid FROM families F LEFT JOIN members M ON F.familyid=M.familyid LEFT JOIN brn ON F.familyid=brn.familyid LEFT JOIN beds B ON M.bedid=B.bedid  LEFT JOIN rooms R ON B.roomid=R.roomid  WHERE F.familyid=" . $_POST['familyid'] . " ORDER BY leader, city,M.memberid, B.roomid";
    $res   = mysqli_query($ts, $query);
    if (mysqli_num_rows($res) > 0) {
        $a   = -1;
        $fid = 0;
        while ($row = mysqli_fetch_assoc($res)) {

            if ($row['fmlyid'] != $fid) {
                $a++;
                $out[$a]           = [];
                $out[$a]['id']     = $row['fmlyid'];
                $out[$a]['status'] = $row['booking_status'];
                if ($row['booking_status'] == "A") {
                    $statuscode = "A";
                } else if ($row['booking_status'] == "R") {
                    $statuscode = "R";
                } else if ($row['booking_status'] == "C") {
                    $statuscode = "D";
                } else if ($row['booking_status'] == "B") {
                    $statuscode = "B";
                }
                $out[$a]['groupNo']               = "PAN-2027-" . ($row['familyid'] + 5100) . "(" . $statuscode . ")";
                $out[$a]['name']                  = $row['leader'];
                $out[$a]['city']                  = $row['city'];
                $out[$a]['citygroup']             = $row['citygroup'];
                $out[$a]['whatsapp']              = $row['whatsapp'];
                $out[$a]['phone']                 = $row['phone2'];
                $out[$a]['fremarks']              = $row['fremarks'];
                $out[$a]['room_category']         = $row['room_category'];
                $plan = $row['rooms_plan'] ?? '';
                if ($plan === '' || $plan === null) { // booking made from a pre-registration: start from its plan
                    $plan = GFV($database_prebooking . '.group_head', 'rooms_plan', 'mela_regn_id=' . intval($row['fmlyid']));
                }
                $out[$a]['rooms_plan']            = $plan ? (json_decode($plan, true) ?: []) : [];
                $out[$a]['related_group']         = $row['related_group'] ?? '';
                $out[$a]['combine_no']            =$row['combine_no'] === null ? null : intval($row['combine_no']);
                $others = [];
                if ($row['combine_no'] !== null) {
                    $or = mysqli_query($ts, 'SELECT familyid, leader FROM families WHERE combine_no=' . intval($row['combine_no']) . ' AND familyid<>' . intval($row['fmlyid']) . ' ORDER BY familyid');
                    while ($or && ($o = mysqli_fetch_assoc($or))) {
                        $others[] = $o;
                    }
                }
                $out[$a]['share_ref']             = $others ? 'PAN-2027-' . (intval($others[0]['familyid']) + 5100) : '';
                $out[$a]['share_name']            = implode(', ', array_map(function ($o) { return (intval($o['familyid']) + 5100) . ' ' . $o['leader']; }, $others));
                $out[$a]['address']               = $row['address'];
                $out[$a]['uuid']                  = $row['uuid'];
                $out[$a]['members']               = [];
                $out[$a]['brn']                   = [];
                $out[$a]['brn']['brnid']          = $row['brnid'] * 1;
                $out[$a]['brn']['booking_date']   = ('' != $row['booking_date']) ? date('M d,Y', strtotime($row['booking_date'])) : '';
                $out[$a]['brn']['bill_amount']    = $row['bill_amount'] * 1;
                $out[$a]['brn']['recd_amount']    = $row['recd_amount'] * 1;
                $out[$a]['brn']['receipt_date']   = ('' != $row['receipt_date']) ? date('M d,Y', strtotime($row['receipt_date'])) : '';
                $out[$a]['brn']['pay_mode']       = $row['pay_mode'];
                $out[$a]['brn']['pay_detail']     = $row['paymentdetails'];
                $out[$a]['brn']['booking_status'] = $row['booking_status'];
                $out[$a]['brn']['RECEIPT_NO']     = $row['RECEIPT_NO'];
                $out[$a]['brn']['LE_ID']          = $row['LE_ID'];

                $m   = 0;
                $fid = $row['fmlyid'];
            }
            if (null != $row['name']) {
                $out[$a]['members'][$m]             = [];
                $out[$a]['members'][$m]['memberid'] = $row['memberid'];
                $out[$a]['members'][$m]['name']     = $row['name'];
                $out[$a]['members'][$m]['sex']      = $row['sex'];
                $out[$a]['members'][$m]['age']      = $row['age'] * 1;
                $out[$a]['members'][$m]['photoid']  = $row['photoidno'];
                $out[$a]['members'][$m]['phone']    = $row['phone'];

                $out[$a]['members'][$m]['prefer']             = [];
                $out[$a]['members'][$m]['prefer']['roomtype'] = $row['p_roomtype'];
                $out[$a]['members'][$m]['prefer']['toilet']   = $row['p_toilet'];
                $out[$a]['members'][$m]['prefer']['floor']    = $row['p_floor'];
                $out[$a]['members'][$m]['prefer']['cot']      = $row['p_cot'];

                $out[$a]['members'][$m]['arrival']             = [];
                $out[$a]['members'][$m]['arrival']['mode']     = $row['arr_mode'];
                $out[$a]['members'][$m]['arrival']['time']     = ('' != $row['arr_train_time']) ? date('M d,Y h:i A', strtotime($row['arr_train_time'])) : '';
                $out[$a]['members'][$m]['arrival']['train']    = $row['arr_train_no'];
                $out[$a]['members'][$m]['arrival']['city']     = $row['arr_city'];
                $out[$a]['members'][$m]['arrival']['seat']     = $row['arr_seat_no'] ? $row['arr_seat_no'] : '-';
                $out[$a]['members'][$m]['arrival']['pickup']   = $row['pickup_bus'];
                $out[$a]['members'][$m]['arrival']['check-in'] = ('' != $row['checkin_time']) ? date('M d,Y h:i A', strtotime($row['checkin_time'])) : '';

                $out[$a]['members'][$m]['depature']              = [];
                $out[$a]['members'][$m]['depature']['check-out'] = ('' != $row['checkout_time']) ? date('M d,Y h:i A', strtotime($row['checkout_time'])) : '';
                $out[$a]['members'][$m]['depature']['mode']      = $row['dep_mode'];
                $out[$a]['members'][$m]['depature']['time']      = ('' != $row['dep_time']) ? date('M d,Y h:i A', strtotime($row['dep_time'])) : '';
                $out[$a]['members'][$m]['depature']['train']     = $row['dep_train_no'];
                $out[$a]['members'][$m]['depature']['city']      = $row['dep_city'];
                $out[$a]['members'][$m]['depature']['seat']      = $row['dep_seat_no'] ? $row['dep_seat_no'] : '-';
                $out[$a]['members'][$m]['depature']['drop']      = $row['drop_bus'];

                $out[$a]['members'][$m]['bed'] = [];
                if ('C' != $row['booking_status']) {
                    $out[$a]['members'][$m]['bed']['bedid']  = $row['bedid'];
                    $out[$a]['members'][$m]['bed']['roomno'] = $row['roomno'];
                    $out[$a]['members'][$m]['bed']['lodge']  = $row['lodgename'];
                    if ($row['p_roomtype'] == 'A') {
                        $out[$a]['members'][$m]['bed']['actype'] = 'AC';
                    } else if ($row['p_roomtype'] == 'N') {
                        $out[$a]['members'][$m]['bed']['actype'] = 'Non-AC';
                    } else {
                        $out[$a]['members'][$m]['bed']['actype'] = 'Non-AC Dormitory';
                    }

                    $out[$a]['members'][$m]['bed']['toilet']   = $row['toilet'];
                    $out[$a]['members'][$m]['bed']['cot']      = $row['cot'];
                    $out[$a]['members'][$m]['bed']['bed']      = $row['bed'];
                    $out[$a]['members'][$m]['bed']['bedtype']  = $row['bedtype'];
                    $out[$a]['members'][$m]['bed']['floor']    = $row['floor'];
                    $out[$a]['members'][$m]['bed']['roomtype'] = $row['bedtype'] . '+ Extra Bed';
                }

                $m++;
            }
        }
    }
}
echo json_encode($out);
