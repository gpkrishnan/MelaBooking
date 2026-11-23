<?php
header('Access-Control-Allow-Origin: *');
require_once '../base/connection.php';
require_once '../lib/roomsplan.php';
ensure_rooms_plan_column($ts);
ensure_share_column($ts);
$out    = [];
$output = [];
$query  = 'SELECT DISTINCT(lodgename) FROM rooms ORDER BY lodgename';
$res    = mysqli_query($ts, $query);
$a      = -1;
if (mysqli_num_rows($res) > 0) {
    $lodgename = '';
    while ($row = mysqli_fetch_assoc($res)) {
        if ($lodgename != $row['lodgename']) {
            $a++;
            $lodgename = $row['lodgename'];
        }
        $out[$a]['lodge'] = $row['lodgename'];
        $out[$a]['NACR']  = 0;
        $out[$a]['NACB']  = 0;
        $out[$a]['NACA']  = 0;
        $out[$a]['NAC']   = 0;
        $out[$a]['ACR']   = 0;
        $out[$a]['ACB']   = 0;
        $out[$a]['ACA']   = 0;
        $out[$a]['AC']    = 0;
        $out[$a]['DORR']  = 0;
        $out[$a]['DORB']  = 0;
        $out[$a]['DORA']  = 0;
        $out[$a]['DOR']   = 0;
        $query1           = "SELECT count(beds.bedid) as avbl, count(members.bedid) as allotted, actype, booking_status FROM rooms LEFT JOIN beds on rooms.roomid=beds.roomid LEFT JOIN members ON members.bedid=beds.bedid LEFT JOIN families on members.familyid=families.familyid LEFT JOIN brn on brn.familyid=families.familyid WHERE beds.valid=1 AND lodgename ='" . $row['lodgename'] . "' GROUP by actype, brn.booking_status";
        $res1             = mysqli_query($ts, $query1);
        if (mysqli_num_rows($res1) > 0) {

            while ($row1 = mysqli_fetch_assoc($res1)) {
                if ($row1['actype'] == '0') {
                    if ($row1['booking_status'] == '') {
                        $out[$a]['NAC'] = $row1['avbl'];
                    }
                    if ($row1['booking_status'] == 'R') {
                        $out[$a]['NACR'] = $row1['allotted'];
                    }
                    if ($row1['booking_status'] == 'B') {
                        $out[$a]['NACB'] = $row1['allotted'];
                    }
                    if ($row1['booking_status'] == 'A') {
                        $out[$a]['NACA'] = $row1['allotted'];
                    }
                }
                if ($row1['actype'] == '1') {
                    if ($row1['booking_status'] == '') {
                        $out[$a]['AC'] = $row1['avbl'];
                    }
                    if ($row1['booking_status'] == 'R') {
                        $out[$a]['ACR'] = $row1['allotted'];
                    }
                    if ($row1['booking_status'] == 'B') {
                        $out[$a]['ACB'] = $row1['allotted'];
                    }
                    if ($row1['booking_status'] == 'A') {
                        $out[$a]['ACA'] = $row1['allotted'];
                    }
                }
                if ($row1['actype'] == '2') {
                    if ($row1['booking_status'] == '') {
                        $out[$a]['DOR'] = $row1['avbl'];
                    }
                    if ($row1['booking_status'] == 'R') {
                        $out[$a]['DORR'] = $row1['allotted'];
                    }
                    if ($row1['booking_status'] == 'B') {
                        $out[$a]['DORB'] = $row1['allotted'];
                    }
                    if ($row1['booking_status'] == 'A') {
                        $out[$a]['DORA'] = $row1['allotted'];
                    }
                }
            }
        }

    }
}
$a++;

$out[$a]['lodge'] = 'zz-Yet To Allot';
$out[$a]['NACR']  = 0;
$out[$a]['NACB']  = 0;
$out[$a]['NACA']  = 0;
$out[$a]['NAC']   = 0;
$out[$a]['ACR']   = 0;
$out[$a]['ACB']   = 0;
$out[$a]['ACA']   = 0;
$out[$a]['AC']    = 0;
$out[$a]['DORR']  = 0;
$out[$a]['DORB']  = 0;
$out[$a]['DORA']  = 0;
$out[$a]['DOR']   = 0;

$query2 = 'SELECT count(memberid) as c, members.p_roomtype as actype, booking_status from members LEFT JOIN brn on brn.familyid=members.familyid WHERE members.bedid is null AND booking_status<>"C" GROUP BY p_roomtype, booking_status';
$res2   = mysqli_query($ts, $query2);
if (mysqli_num_rows($res2) > 0) {

    while ($row1 = mysqli_fetch_assoc($res2)) {
        if ($row1['actype'] == 'N') {
            if ($row1['booking_status'] == 'R') {
                $out[$a]['NACR'] = $row1['c'];
            }
            if ($row1['booking_status'] == 'B') {
                $out[$a]['NACB'] = $row1['c'];
            }
            if ($row1['booking_status'] == 'A') {
                $out[$a]['NACA'] = $row1['c'];
            }
            $out[$a]['NAC'] ='';
        }
        if ($row1['actype'] == 'A') {
            if ($row1['booking_status'] == 'R') {
                $out[$a]['ACR'] = $row1['c'];
            }
            if ($row1['booking_status'] == 'B') {
                $out[$a]['ACB'] = $row1['c'];
            }
            if ($row1['booking_status'] == 'A') {
                $out[$a]['ACA'] = $row1['c'];
            }
            $out[$a]['AC'] ='';
        }
        if ($row1['actype'] == 'D') {
            if ($row1['booking_status'] == 'R') {
                $out[$a]['DORR'] = $row1['c'];
            }
            if ($row1['booking_status'] == 'B') {
                $out[$a]['DORB'] = $row1['c'];
            }
            if ($row1['booking_status'] == 'A') {
                $out[$a]['DORA'] = $row1['c'];
            }
            $out[$a]['DOR']='';
        }
    }
}

$output[0] = $out;
$arr       = [];
$query     = "SELECT count(members.memberid) as qty,p_roomtype, booking_status FROM members LEFT JOIN families on members.familyid=families.familyid LEFT JOIN brn on brn.familyid=members.familyid WHERE  booking_status!='C' GROUP BY p_roomtype,brn.booking_status";
$res       = mysqli_query($ts, $query);
if (mysqli_num_rows($res) > 0) {

    $roomtype = '';
    while ($row = mysqli_fetch_assoc($res)) {
        if ($roomtype != $row['p_roomtype']) {
            $roomtype = $row['p_roomtype'];
        }
        $arr[$roomtype][$row['booking_status']] = $row['qty'];
        // if ($row['p_roomtype'] == 'A') {
        //     $arr[$a]['Roomtype'] = 'AC';
        // } else if ($row['p_roomtype'] == 'N') {
        //     $arr[$a]['Roomtype'] = 'NAC';
        // } else {
        //     $arr[$a]['Roomtype'] = 'Dormitory';
        // }
        // if ($row['booking_status'] == 'A') {
        //     $arr[$a]['Status'] = 'Blocked';
        // } else if ($row['booking_status'] == 'B') {
        //     $arr[$a]['Status'] = 'Booked';
        // } else if ($row['booking_status'] == 'R') {
        //     $arr[$a]['Status'] = 'Reserved';
        // }
        // $arr[$a]['Quantity'] = $row['qty'];
    }
}
$output[1] = $arr;

$query = 'SELECT brn.booking_status, sum(brn.bill_amount) as billamt, sum(brn.recd_amount) as recdamt FROM families LEFT JOIN brn on brn.familyid=families.familyid GROUP BY brn.booking_status';
$res   = mysqli_query($ts, $query);
$output[2] = ['booked' => 0, 'reserved' => 0];
if (mysqli_num_rows($res) > 0) {
    while ($row = mysqli_fetch_assoc($res)) {
        if ($row['booking_status'] == 'B') {
            $output[2]['booked'] = $row['recdamt'] * 1;
        }
        if ($row['booking_status'] == 'R') {
            $output[2]['reserved'] = $row['billamt'] * 1;
        }
    }

}

// Rooms per booking = number of rooms in its rooms_plan (set on the booking page, else the pre-registration's) (AC [2,3] = 2 rooms, AC [5] = 1 room);
// single-person bookings sharing a room count 1/(bookings in the room) each; bookings without a plan fall back to members / per-room capacity of the room category.
function roomSummary($ts, $statusCond)
{
    global $database_prebooking;
    $query = "SELECT UT.room_category, sum(UT.fmly) as fmlycnt, sum(UT.rooms) as roomcnt, sum(UT.pax) as paxcnt, sum(UT.billamount) as ba, sum(UT.recd_amount) as ra FROM ("
        . "(SELECT count(families.familyid) as fmly, 0 as rooms, room_category, 0 as pax, sum(bill_amount) as billamount, sum(recd_amount) as recd_amount FROM families INNER JOIN brn on families.familyid=brn.familyid WHERE $statusCond GROUP BY room_category)"
        . " UNION ALL (SELECT 0 as fmly, 0 as rooms, room_category, count(members.memberid) as pax, 0 as billamount, 0 as recd_amount FROM families INNER JOIN members ON families.familyid=members.familyid INNER JOIN brn on families.familyid=brn.familyid WHERE $statusCond GROUP BY room_category)"
        . " UNION ALL (SELECT 0 as fmly, sum(IF(F.combine_no IS NOT NULL, 1 / (SELECT COUNT(*) FROM families C WHERE C.combine_no=F.combine_no), COALESCE(NULLIF(JSON_LENGTH(F.rooms_plan), 0), CEIL(F.pax / GREATEST(CAST(SUBSTRING_INDEX(F.room_category, '-', -1) AS UNSIGNED), 1))))) as rooms, F.room_category, 0 as pax, 0 as billamount, 0 as recd_amount FROM (SELECT families.familyid, families.room_category, families.combine_no, COALESCE(NULLIF(families.rooms_plan, ''), (SELECT G.rooms_plan FROM $database_prebooking.group_head G WHERE G.mela_regn_id=families.familyid LIMIT 1)) as rooms_plan, count(members.memberid) as pax FROM families INNER JOIN members ON families.familyid=members.familyid INNER JOIN brn on families.familyid=brn.familyid WHERE $statusCond GROUP BY families.familyid, families.room_category) F GROUP BY F.room_category)"
        . ") UT GROUP BY UT.room_category";
    $res = mysqli_query($ts, $query);
    $rows = [];
    if ($res && mysqli_num_rows($res) > 0) {
        while ($row = mysqli_fetch_assoc($res)) {
            $rows[] = $row;
        }
    }
    return $rows;
}

$rows = roomSummary($ts, "brn.booking_status NOT in('A','C')");
if (count($rows) > 0) {
    $output[3] = $rows;
}

$rows = roomSummary($ts, "brn.booking_status ='A'");
if (count($rows) > 0) {
    $output[4] = $rows;
}
// single-person bookings that share a room (same combine_no; cancelled bookings are taken out of the group)
$output[5] = [];
$res = mysqli_query($ts, "SELECT F.combine_no, F.familyid, F.leader, F.room_category FROM families F INNER JOIN brn B ON B.familyid=F.familyid
    WHERE F.combine_no IS NOT NULL AND B.booking_status<>'C' ORDER BY F.combine_no, F.familyid");
$groups = [];
while ($res && ($row = mysqli_fetch_assoc($res))) {
    $no = intval($row['combine_no']);
    if (!isset($groups[$no])) {
        $groups[$no] = ['combine_no' => $no, 'room_category' => $row['room_category'], 'members' => []];
    }
    $groups[$no]['members'][] = ['id' => intval($row['familyid']) + 5100, 'name' => $row['leader']];
}
foreach ($groups as $g) {
    if (count($g['members']) > 1) {
        $output[5][] = $g;
    }
}
foreach ([3, 4] as $k) {
    if (!isset($output[$k])) {
        $output[$k] = [];
    }
}
ksort($output); // keep a plain JSON array
echo json_encode($output, JSON_NUMERIC_CHECK);
// echo json_encode( $out );
