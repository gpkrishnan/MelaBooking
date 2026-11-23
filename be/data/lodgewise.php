<?php
header('Access-Control-Allow-Origin: *');
require_once '../base/connection.php';
$out = [];

if (isset($_POST['lodgename'])) {

    $query1 = "SELECT * FROM rooms LEFT JOIN beds ON rooms.roomid=beds.roomid WHERE lodgename='" . $_POST['lodgename'] . "'  ORDER BY roomno";
    $res1   = mysqli_query($ts, $query1);
    if (mysqli_num_rows($res1) > 0) {
        $out['lodge'] = $_REQUEST['lodgename'];
        $out['rooms'] = [];
        $a            = -1;
        $roomno       = '';
        while ($row1 = mysqli_fetch_assoc($res1)) {
            if ($roomno != $row1['roomno']) {
                $a++;
                $out['rooms'][$a]['roomno'] = $row1['roomno'];
                if ($row1['roomno'] == 'Dor') {
                    $out['rooms'][$a]['actype'] = 'Dormitory';

                } else {
                    $out['rooms'][$a]['actype'] = $row1['actype'] == '1' ? 'AC' : 'Non-AC';

                }
                $b                           = -1;
                $out['rooms'][$a]['members'] = [];
                $roomno                      = $row1['roomno'];

            }
            $query2 = "SELECT * FROM members  LEFT JOIN families ON members.familyid=families.familyid LEFT JOIN brn on brn.familyid=families.familyid WHERE brn.booking_status<>'C' AND members.bedid='" . $row1['bedid'] . "'";
            $res2   = mysqli_query($ts, $query2);

            if (mysqli_num_rows($res2) > 0) {
                $b++;
                $row2                                            = mysqli_fetch_assoc($res2);
                $out['rooms'][$a]['members'][$b]['KKID']         = "PAN-2027-" . (5100+$row2['familyid'])." (".($b+1).")";;
                $out['rooms'][$a]['members'][$b]['whatsApp']     = $row2['whatsapp'];
                $out['rooms'][$a]['members'][$b]['emergency']    = $row2['phone2'];
                $out['rooms'][$a]['members'][$b]['name']         = $row2['name'];
                $out['rooms'][$a]['members'][$b]['age']          = $row2['age'];
                $out['rooms'][$a]['members'][$b]['sex']          = $row2['sex'];
                $out['rooms'][$a]['members'][$b]['phone']        = $row2['phone'];
                $out['rooms'][$a]['members'][$b]['photoid']      = $row2['photoidno'];
                $out['rooms'][$a]['members'][$b]['arrival']      = $row2['arr_train_no'];
                $out['rooms'][$a]['members'][$b]['arrivalseat']  = $row2['arr_seat_no'] ? $row2['arr_seat_no'] : '-';
                $out['rooms'][$a]['members'][$b]['depatureseat'] = $row2['dep_seat_no'] ? $row2['dep_seat_no'] : '-';

                if ($row2['arr_train_time'] != '') {
                    $out['rooms'][$a]['members'][$b]['arrivaltime'] = date('d/m/y h:i A', strtotime($row2['arr_train_time']));
                } else {
                    $out['rooms'][$a]['members'][$b]['arrivaltime'] = '';

                }
                $out['rooms'][$a]['members'][$b]['arrivalcity'] = $row2['arr_city'];
                $out['rooms'][$a]['members'][$b]['depature']    = $row2['dep_train_no'];
                if ($row2['dep_time'] != '') {
                    $out['rooms'][$a]['members'][$b]['depaturetime'] = date('d/m/y h:i A', strtotime($row2['dep_time']));
                } else {
                    $out['rooms'][$a]['members'][$b]['depaturetime'] = '';
                }
                $out['rooms'][$a]['members'][$b]['depaturecity'] = $row2['dep_city'];
                if ($row2['checkin_time'] != '') {
                    $out['rooms'][$a]['members'][$b]['checkin'] = date('d/M/y h:i A', strtotime($row2['checkin_time']));

                } else {
                    $out['rooms'][$a]['members'][$b]['checkin'] = '';
                }
                if ($row2['checkout_time'] != '') {
                    $out['rooms'][$a]['members'][$b]['checkout'] = date('d/M/y h:i A', strtotime($row2['checkout_time']));

                } else {
                    $out['rooms'][$a]['members'][$b]['checkout'] = '';
                }
                $out['rooms'][$a]['members'][$b]['arr_bus_no'] = $row2['arr_bus_no'];
                $out['rooms'][$a]['members'][$b]['dep_bus_no'] = $row2['dep_bus_no'];

            } else {
                $b++;
                $out['rooms'][$a]['members'][$b]['KKID']         = '';
                $out['rooms'][$a]['members'][$b]['whatsApp']     = '';
                $out['rooms'][$a]['members'][$b]['emergency']    = '';
                $out['rooms'][$a]['members'][$b]['name']         = '-';
                $out['rooms'][$a]['members'][$b]['age']          = '';
                $out['rooms'][$a]['members'][$b]['sex']          = '';
                $out['rooms'][$a]['members'][$b]['phone']        = '';
                $out['rooms'][$a]['members'][$b]['photoid']      = '';
                $out['rooms'][$a]['members'][$b]['arrival']      = '';
                $out['rooms'][$a]['members'][$b]['arrivaltime']  = '';
                $out['rooms'][$a]['members'][$b]['arrivalcity']  = '';
                $out['rooms'][$a]['members'][$b]['depature']     = '';
                $out['rooms'][$a]['members'][$b]['depaturetime'] = '';
                $out['rooms'][$a]['members'][$b]['depaturecity'] = '';
                $out['rooms'][$a]['members'][$b]['arrivalseat']  = '';
                $out['rooms'][$a]['members'][$b]['depatureseat'] = '';
                $out['rooms'][$a]['members'][$b]['checkin']      = '';
                $out['rooms'][$a]['members'][$b]['checkout']     = '';
                $out['rooms'][$a]['members'][$b]['arr_bus_no']   = '';
                $out['rooms'][$a]['members'][$b]['dep_bus_no']   = '';

            }
        }

    }
//     array_walk_recursive( $out, function( &$item ) {
    //         $item = strval( $item );
    //     }
}
echo json_encode($out);
