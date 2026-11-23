<?php
header('Access-Control-Allow-Origin: *');
require_once '../base/connection.php';
$out = [];

$query = "SELECT F.* FROM families F  ORDER BY familyid ASC";
$res   = mysqli_query($ts, $query);
if (mysqli_num_rows($res) > 0) {
    $a = 0;
    while ($row = mysqli_fetch_assoc($res)) {
        $out[$a] = $row;

        $out[$a]['status'] = '';
        $out[$a]['sex']    = [["type" => "M", "count" => 0], ["type" => "F", "count" => 0]];

        $query1 = "SELECT B.brnid, B.booking_status as status, COALESCE(B.bill_amount, 0) as billamt, COALESCE(B.recd_amount, 0) as recdamt, (COALESCE(B.bill_amount, 0) - COALESCE(B.recd_amount, 0)) as balance, B.RECEIPT_NO, B.LE_ID, B.receipt_date, B.paymentdetails FROM brn B WHERE B.familyid = " . $row['familyid'];
        $res1   = mysqli_query($ts, $query1);
        if (mysqli_num_rows($res1) == 1) {
            $row1              = mysqli_fetch_assoc($res1);
            $out[$a]['status'] = $row1['status'];
            if ($row1['status'] == "A") {
                $statuscode = "A";
            } else if ($row1['status'] == "R") {
                $statuscode = "R";
            } else if ($row1['status'] == "C") {
                $statuscode = "D";
            } else if ($row1['status'] == "B") {
                $statuscode = "B";
            }

            $out[$a]['groupNo']        = "PAN-2027-" . ($row['familyid'] + 5100)."(". $statuscode . ")" ;
            $out[$a]['bill']           = $row1['billamt'] * 1;
            $out[$a]['recd']           = $row1['recdamt'] * 1;
            $out[$a]['balance']        = $row1['balance'] * 1;
            $out[$a]['brnid']          = $row1['brnid'];
            $out[$a]['RECEIPT_NO']     = $row1['RECEIPT_NO'];
            $out[$a]['LE_ID']          = $row1['LE_ID'];
            $out[$a]['receipt_date']   = $row1['receipt_date'];
            $out[$a]['paymentdetails'] = $row1['paymentdetails'];

        }
        $query2             = "SELECT * FROM members WHERE familyid = " . $row['familyid'];
        $res2               = mysqli_query($ts, $query2);
        $out[$a]['members'] = [];
        if (mysqli_num_rows($res2) > 0) {
            $c = 0;
            while ($row2 = mysqli_fetch_assoc($res2)) {
                if ($row2['sex'] == 'M') {
                    $out[$a]['sex'][0]['count']++;
                } else {
                    $out[$a]['sex'][1]['count']++;
                }
                $k = $c + 1;
                if ($k < 10) {
                    $k = '0' . $k;
                }
                $out[$a]['members'][$c]          = $row2;
                $out[$a]['members'][$c]['idno']  = 'B-' . ($row['familyid'] + 5100) . '/' . $k;
                $out[$a]['members'][$c]['city']  = $row['city'];
                $out[$a]['members'][$c]['hotel'] = '';
                $out[$a]['members'][$c]['room']  = '';
                $out[$a]['members'][$c]['bed']   = '';
                $out[$a]['members'][$c]['ac']    = '';
                $out[$a]['members'][$c]['p_type']    = $row2['p_roomtype'];
                $out[$a]['members'][$c]['bedid'] = $row2['bedid'];
                if ('' != $row2['bedid']) {
                    $query3                          = "SELECT * FROM beds INNER JOIN rooms ON beds.roomid = rooms.roomid WHERE bedid = " . $row2['bedid'];
                    $res3                            = mysqli_query($ts, $query3);
                    $row3                            = mysqli_fetch_assoc($res3);
                    $out[$a]['members'][$c]['hotel'] = $row3['lodgename'];
                    $out[$a]['members'][$c]['room']  = $row3['roomno'];
                    $out[$a]['members'][$c]['bed']   = $row3['cot'] . " . " . $row3['bed'];
                    $out[$a]['members'][$c]['ac']    = (1 == $row3['actype']) ? 'AC' : 'Non-AC';
                }

                $c++;
            }
        }
        $a++;
    }
}
echo json_encode($out);
