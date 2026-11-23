<?php
header('Access-Control-Allow-Origin: *');
require_once '../base/connection.php';
$out = [];

if (isset($_REQUEST['trainno']) && isset($_REQUEST['mode'])) {
    // while ($row=mysqli_fetch_assoc($res)){
    if ($_REQUEST['mode'] == 'arrival') {
        if ($_REQUEST['trainno'] != 0) {
            $query1 = "SELECT * FROM members  LEFT JOIN beds ON members.bedid=beds.bedid LEFT JOIN rooms ON beds.roomid=rooms.roomid LEFT JOIN families ON members.familyid=families.familyid LEFT JOIN brn on brn.familyid=families.familyid WHERE arr_train_no='" . $_REQUEST['trainno'] . "' AND brn.booking_status<>'C' ORDER BY lodgename, KKID";
        } else {
            $query1 = "SELECT * FROM members  LEFT JOIN beds ON members.bedid=beds.bedid LEFT JOIN rooms ON beds.roomid=rooms.roomid LEFT JOIN families ON members.familyid=families.familyid LEFT JOIN brn on brn.familyid=families.familyid WHERE arr_train_no IS NULL  AND brn.booking_status<>'C' ORDER BY lodgename, KKID";
        }
    }
    if ($_REQUEST['mode'] == 'depature') {
        if ($_REQUEST['trainno'] != 0) {
            $query1 = "SELECT * FROM members  LEFT JOIN beds ON members.bedid=beds.bedid LEFT JOIN rooms ON beds.roomid=rooms.roomid LEFT JOIN families ON members.familyid=families.familyid LEFT JOIN brn on brn.familyid=families.familyid WHERE dep_train_no='" . $_REQUEST['trainno'] . "'  AND brn.booking_status<>'C' ORDER BY lodgename, KKID";
        } else {
            $query1 = "SELECT * FROM members  LEFT JOIN beds ON members.bedid=beds.bedid LEFT JOIN rooms ON beds.roomid=rooms.roomid LEFT JOIN families ON members.familyid=families.familyid LEFT JOIN brn on brn.familyid=families.familyid WHERE dep_train_no IS NULL AND brn.booking_status<>'C' ORDER BY lodgename, KKID";
        }
    }
    if (isset($query1)) {
        $res1 = mysqli_query($ts, $query1);
        if (mysqli_num_rows($res1) > 0) {
            $out['train'] = $_REQUEST['trainno'];
            $out['lodge'] = [];
            $a            = -1;
            $lodge        = 'XX';
            while ($row1 = mysqli_fetch_assoc($res1)) {
                if ($lodge != $row1['lodgename']) {
                    $a++;
                    $out['lodge'][$a]['lodgename'] = $row1['lodgename'];
                    $b                             = -1;
                    $out['lodge'][$a]['members']   = [];
                    $lodge                         = $row1['lodgename'];
                }
                $b++;
                $out['lodge'][$a]['members'][$b]['KKID']     = "PAN-2027-" . (5100+$row1['familyid'])." (".($b+1).")";
                $out['lodge'][$a]['members'][$b]['whatsApp'] = $row1['whatsapp'];

                if ($_REQUEST['mode'] == 'arrival') {
                    $out['lodge'][$a]['members'][$b]['seat_no'] = $row1['arr_seat_no'] ? $row1['arr_seat_no'] : "-";
                } else {
                    $out['lodge'][$a]['members'][$b]['seat_no'] = $row1['dep_seat_no'] ? $row1['dep_seat_no'] : "-";
                }
                $out['lodge'][$a]['members'][$b]['emergency'] = $row1['phone2'];

                $out['lodge'][$a]['members'][$b]['roomno'] = $row1['roomno'];
                if ($row1['p_roomtype'] == 'A') {
                    $out['lodge'][$a]['members'][$b]['type'] = 'AC';
                } else if ($row1['p_roomtype'] == 'N') {
                    $out['lodge'][$a]['members'][$b]['type'] = 'NAC';
                } else {
                    $out['lodge'][$a]['members'][$b]['type'] = 'Dor';
                }
                $out['lodge'][$a]['members'][$b]['name']    = $row1['name'];
                $out['lodge'][$a]['members'][$b]['age']     = $row1['age'];
                $out['lodge'][$a]['members'][$b]['sex']     = $row1['sex'];
                $out['lodge'][$a]['members'][$b]['phone']   = $row1['phone'];
                $out['lodge'][$a]['members'][$b]['photoid'] = $row1['photoidno'];
                $out['lodge'][$a]['members'][$b]['arrival'] = $row1['arr_train_no'];
                if ($row1['arr_train_time'] != '') {
                    $out['lodge'][$a]['members'][$b]['arrivaltime'] = date('d/m/y h:i A', strtotime($row1['arr_train_time']));
                } else {
                    $out['lodge'][$a]['members'][$b]['arrivaltime'] = '';
                }
                $out['lodge'][$a]['members'][$b]['arrivalcity'] = $row1['arr_city'];
                $out['lodge'][$a]['members'][$b]['depature']    = $row1['dep_train_no'];
                if ($row1['dep_time'] != '') {
                    $out['lodge'][$a]['members'][$b]['depaturetime'] = date('d/m/y h:i A', strtotime($row1['dep_time']));
                } else {
                    $out['lodge'][$a]['members'][$b]['depaturetime'] = '';
                }
                $out['lodge'][$a]['members'][$b]['depaturecity'] = $row1['dep_city'];
                if ($row1['checkin_time'] != '') {
                    $out['lodge'][$a]['members'][$b]['checkin'] = date('d/M/y h:i A', strtotime($row1['checkin_time']));
                } else {
                    $out['lodge'][$a]['members'][$b]['checkin'] = '';
                }
                if ($row1['checkout_time'] != '') {
                    $out['lodge'][$a]['members'][$b]['checkout'] = date('d/M/y h:i A', strtotime($row1['checkout_time']));
                } else {
                    $out['lodge'][$a]['members'][$b]['checkout'] = '';
                }
                $out['lodge'][$a]['members'][$b]['arr_bus_no'] = $row1['arr_bus_no'];
                $out['lodge'][$a]['members'][$b]['dep_bus_no'] = $row1['dep_bus_no'];

            }
        }
    }

    // }
}
array_walk_recursive($out, function (&$item) {$item = strval($item);});
echo json_encode($out);
