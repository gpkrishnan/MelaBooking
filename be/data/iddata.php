<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');
require_once '../base/connection.php';

$sql = "SELECT M.name, M.bedid, M.familyid, R.`lodgename`, R.roomNo, R.actype FROM members M INNER JOIN brn B on M.familyid=B.familyid LEFT JOIN beds BE on M.bedid=BE.bedid LEFT JOIN rooms R on R.roomid=BE.roomid WHERE B.booking_status!='C'  ORDER BY M.familyid, M.memberid";

$res = mysqli_query($ts, $sql);
$out = array();

if (mysqli_num_rows($res) > 0) { 
    $a = 0;
    $familyid = 0;
    $mc = 0;
    while ($row = mysqli_fetch_assoc($res)) {
        if ($familyid != $row['familyid']) {
            $familyid = $row['familyid'];
            $mc = 1;
        }
        $out[$a]['name'] = $row['name'];
        $out[$a]['regnNo'] = 'PAN-2027-' . ($row['familyid'] + 5100) . "(" . $mc.")";
        $ac=$row['actype']=='1'?'A':'N';
        $out[$a]['code'] = explode('-',$row['lodgename'])[0]."-".$row['roomNo']."-".$ac;
        $out[$a]['mc'] = $a+1;
        $a++;
        $mc++;
    }
}
echo json_encode($out);
