<?php
header('Access-Control-Allow-Origin: *');
require_once '../base/connection.php';
$out = array();

$query = "SELECT B.*, R.* FROM beds B INNER JOIN rooms R ON B.roomid=R.roomid  ORDER BY R.lodgename, R.floor ,  R.roomno ASC,B.cot, B.bed";
$res   = mysqli_query($ts, $query);
if (mysqli_num_rows($res) > 0) {
    $ldg = '';
    $l   = -1;
    while ($row = mysqli_fetch_assoc($res)) {
        if ($ldg != $row['lodgename']) {
            $l++;
            $out[$l]          = array();
            $out[$l]['name']  = $row['lodgename'];
            $ldg              = $row['lodgename'];
            $out[$l]['floor'] = array();
            $f                = -1;
            $flr              = '';
        }
        if ($flr != $row['floor']) {
            $f++;
            $out[$l]['floor'][$f]          = array();
            $out[$l]['floor'][$f]['name']  = strtoupper(substr($row['lodgename'], 0, 2)) . '-' . $row['floor'];
            $flr                           = $row['floor'];
            $out[$l]['floor'][$f]['rooms'] = array();
            $r                             = -1;
            $rom                           = '';
        }
        if ($rom != $row['roomno']) {
            $r++;
            $out[$l]['floor'][$f]['rooms'][$r]            = array();
            $out[$l]['floor'][$f]['rooms'][$r]['name']    = $row['roomno'];
            $rom                                          = $row['roomno'];
            $out[$l]['floor'][$f]['rooms'][$r]['ac']      = $row['actype'];
            $out[$l]['floor'][$f]['rooms'][$r]['toilet']  = $row['toilet'];
            $out[$l]['floor'][$f]['rooms'][$r]['bedtype'] = $row['bedtype'];
            $out[$l]['floor'][$f]['rooms'][$r]['cot']     = array();
            $c                                            = -1;
            $cot                                          = '';
        }
        if ($cot != $row['cot']) {
            $c++;
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]         = array();
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['name'] = $row['cot'];
            $cot                                                  = $row['cot'];
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed']  = array();
            $b                                                    = -1;
            $bno                                                  = '';
        }
        if ($bno != $row['bed']) {
            $b++;
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]         = array();
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['name'] = $row['bed'];
            $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['id']   = $row['bedid'];
// $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['memberid']   = $row['memberid'];
            // $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['membername'] = $row['name'];
            // $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['sex']        = $row['sex'];
            // $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['age']        = $row['age'];
            // $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['familyid']   = $row['familyid'];
            // $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['familyname'] = $row['leader'];
            // $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['city']       = $row['city'];
            // $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['wa']         = $row['whatsapp'];
            // $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['phone']      = $row['phone2'];
            $bno = $row['bed'];
        }
    }
}
echo json_encode($out);
