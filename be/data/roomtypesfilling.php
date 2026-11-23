<?php
header('Access-Control-Allow-Origin: *');
require_once '../base/connection.php';
$out = array();

$query = "SELECT count(roomid)as Totalrooms, lodgename,`floor`,bedtype FROM `rooms` GROUP BY lodgename,`floor`,bedtype Order BY lodgename,`floor`,`bedtype`";
$res   = mysqli_query($ts, $query);
if (mysqli_num_rows($res) > 0) {
    $a = 0;
    while ($row = mysqli_fetch_assoc($res)) {
        $out[$a]                     = array();
        $out[$a]['Total']            = $row;
        $out[$a]['Total']['bedtype'] = "[" . $out[$a]['Total']['bedtype'] . "]+1e";

        $out[$a]['booked']     = array('members' => 0, 'roomcount' => 0, 'status' => 'B');
        $out[$a]['registered'] = array('members' => 0, 'roomcount' => 0, 'status' => 'R');
        $out[$a]['canceled']   = array('members' => 0, 'roomcount' => 0, 'status' => 'C');

        $query1 = "SELECT COUNT(M.memberid) as members, COUNT(R.roomid) as roomcount,brn.booking_status as `status` FROM `members` M LEFT JOIN `beds` B ON M.bedid=B.bedid INNER JOIN rooms R on B.roomid=R.roomid INNER JOIN families F ON M.familyid=F.familyid INNER JOIN brn ON F.familyid=brn.familyid WHERE R.lodgename='" . $row['lodgename'] . "' AND floor='" . $row['floor'] . "' AND bedtype='" . $row['bedtype'] . "' GROUP BY brn.booking_status";
        $res1   = mysqli_query($ts, $query1);
        if (mysqli_num_rows($res1) > 0) {
            while ($row1 = mysqli_fetch_assoc($res1)) {
                if ('R' == $row1['status']) {
                    $status = 'registered';
                } else if ('B' == $row1['status']) {
                    $status = 'booked';
                } else if ('C' == $row1['status']) {
                    $status = 'canceled';
                }
                $out[$a][$status]['members']   = $row1['members'];
                $out[$a][$status]['roomcount'] = $row1['roomcount'];
            }
        }
        $a++;
    }
}
echo json_encode($out);
