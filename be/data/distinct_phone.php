<?php
header('Access-Control-Allow-Origin: *');
require_once '../base/connection.php';
$out = [];

$query = "SELECT DISTINCT(PHONE) FROM members WHERE PHONE IS NOT NULL AND PHONE != ''";
$res1  = mysqli_query($ts, $query);
if (mysqli_num_rows($res1) > 0) {
    $a = -1;
    while ($row1 = mysqli_fetch_assoc($res1)) {
        $query2 = "SELECT NAME, familyid FROM members WHERE PHONE='" . $row1['PHONE'] . "' ORDER by memberid LIMIT 1";
        $res2   = mysqli_query($ts, $query2);
        if (mysqli_num_rows($res2) > 0) {
            while ($row2 = mysqli_fetch_assoc($res2)) {
                $status = GFV("brn", "booking_status", "familyid=" . $row2['familyid']);

                $a++;
                $out[$a]['PHONE']  = $row1['PHONE'];
                $out[$a]['NAME']   = "MA_3_" . ($row2['familyid'] + 3000) . "_" . $row2['NAME'];
                $out[$a]['STATUS'] = $status;
            }
        }

    }
}

echo json_encode($out);
