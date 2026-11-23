<?php
header('Access-Control-Allow-Origin: *');
require_once '../base/connection.php';
$out = array();

$query = "SELECT *,B.bedid FROM rooms R LEFT JOIN beds B on B.roomid=R.roomid LEFT JOIN members M on M.bedid=B.bedid LEFT JOIN families F ON M.familyid=F.familyid WHERE B.valid=1 ORDER BY R.lodgename,R.floor,R.roomid, B.cot, B.bed, B.valid DESC";
$res = mysqli_query($ts, $query);
if (mysqli_num_rows($res) > 0) {
    $l = -1;
    $ldg = '';
    while ($row = mysqli_fetch_assoc($res)) {

        if ($ldg != $row['lodgename']) {
            if ($l != -1) {
                $out[$l]['acbeds'] = $ac;
                $out[$l]['nacbeds'] = $nac;
                $out[$l]['dorbeds'] = $dor;
                $out[$l]['acmembers'] = $acm;
                $out[$l]['nacmembers'] = $nacm;
                $out[$l]['dormembers'] = $dorm;
            }
            $l++;
            $out[$l] = array();
            $out[$l]['name'] = $row['lodgename'];
            $ldg = $row['lodgename'];
            $out[$l]['floor'] = array();
            $f = -1;
            $flr = '';
            $ac = 0;
            $nac = 0;
            $dor = 0;
            $acm = 0;
            $nacm = 0;
            $dorm = 0;
        }
        if ($flr != $row['floor']) {
            $f++;
            $out[$l]['floor'][$f] = array();
            $out[$l]['floor'][$f]['name'] = strtoupper(substr($row['lodgename'], 0, 2)) . '-' . $row['floor'];
            $flr = $row['floor'];
            $out[$l]['floor'][$f]['rooms'] = array();
            $r = -1;
            $rom = '';
        }
        if ($rom != $row['roomno']) {
            $r++;
            $out[$l]['floor'][$f]['rooms'][$r] = array();
            $out[$l]['floor'][$f]['rooms'][$r]['name'] = $row['roomno'];
            $out[$l]['floor'][$f]['rooms'][$r]['roomid'] = $row['roomid'];
            $rom = $row['roomno'];
            $out[$l]['floor'][$f]['rooms'][$r]['ac'] = $row['actype'];
            $out[$l]['floor'][$f]['rooms'][$r]['toilet'] = $row['toilet'];
            $out[$l]['floor'][$f]['rooms'][$r]['bedtype'] = $row['bedtype'];
            $out[$l]['floor'][$f]['rooms'][$r]['rate'] = $row['rate'];
            $out[$l]['floor'][$f]['rooms'][$r]['cot'] = array();
            $c = -1;
            $cot = '';

        }
        if ($cot != $row['cot']) {
            $c++;
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c] = array();
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['name'] = $row['cot'];
            $cot = $row['cot'];
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'] = array();
            $b = -1;
            $bno = '';
        }
        if ($bno != $row['bed']) {
            $b++;
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b] = array();
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['bed'] = $row['bed'];
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['id'] = $row['bedid'];
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['valid'] = $row['valid'];
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['remarks'] = $row['remarks'];
            if ($row['roomno'] != 'Dor') {
                if ($row['actype'] == '1') {$ac++;} else { $nac++;}
            } else {
                $dor++;
            }

        }
        if ('' != $row['memberid']) {
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['memberid'] = $row['memberid'];
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['name'] = $row['name'];
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['sex'] = $row['sex'];
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['age'] = $row['age'];
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['familyid'] = $row['familyid'];
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['leader'] = $row['leader'];
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['whatsapp'] = $row['whatsapp'];
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['phone'] = $row['phone2'];
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['remarks'] = $row['remarks'];
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['address'] = $row['address'];
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['city'] = $row['city'];
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['citygroup'] = GFV("citygroup", "groupname", "citygrpid=" . $row['citygroup']);
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['status'] = GFV('brn', 'booking_status', 'familyid=' . $row['familyid']);
            if ($row['roomno'] != 'Dor') {
                if ($row['actype'] == '1') {$acm++;} else { $nacm++;}
            } else {
                $dorm++;
            }
        } else {
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['memberid'] = null;
        }
        $out[$l]['acbeds'] = $ac;
        $out[$l]['nacbeds'] = $nac;
        $out[$l]['dorbeds'] = $dor;
        $out[$l]['acmembers'] = $acm;
        $out[$l]['nacmembers'] = $nacm;
        $out[$l]['dormembers'] = $dorm;
    }
}
echo json_encode($out);
