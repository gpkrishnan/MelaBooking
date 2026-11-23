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

// Get JSON data from request body
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Merge with $_POST for backward compatibility
if ($data) {
    $_POST = array_merge($_POST, $data);
}
$out = array();

// Read JSON input if Content-Type is application/json
$input = json_decode(file_get_contents('php://input'), true);
if ($input) {
    $_POST = array_merge($_POST, $input);
}

if (isset($_POST['familyid'])) {

    $q1 = "SELECT distinct(B.roomid) FROM members M INNER JOIN beds B ON M.bedid=B.bedid  WHERE M.familyid=" . $_POST['familyid'];
    $r  = mysqli_query($ts, $q1);
    if (mysqli_num_rows($r) > 0) {
        $where = '( ';
        while ($ro = mysqli_fetch_assoc($r)) {
            $where .= "R.roomid=" . $ro['roomid'] . " OR ";
        }

    }
    if (isset($_POST['addrooms']) ) {
        if (!isset($where)) {
            $where = '( ';
        }
        for ($a = 0; $a < sizeof($_POST['addrooms']); $a++) {
            $where .= "R.roomid=" . $_POST['addrooms'][$a] . " OR ";
        }
    }

    if (isset($where)) {
        $where = rtrim($where, " OR ") . " )";
       $query = "SELECT *,B.bedid FROM rooms R LEFT JOIN beds B on B.roomid=R.roomid LEFT JOIN members M on M.bedid=B.bedid LEFT JOIN families F ON M.familyid=F.familyid WHERE " . $where . " ORDER BY R.lodgename,R.roomid, B.cot, B.bed, B.valid DESC ";
        $res   = mysqli_query($ts, $query);
        if (mysqli_num_rows($res) > 0) {
            $l   = -1;
            $ldg = '';
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
                    $out[$l]['floor'][$f]['rooms'][$r]['roomid']  = $row['roomid'];
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
                    $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]            = array();
                    $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['bed']     = $row['bed'];
                    $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['id']      = $row['bedid'];
                    $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['valid']   = $row['valid'];
                    $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['remarks'] = $row['remarks'];

                }
                if ('' != $row['memberid']) {
                    $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['memberid']  = $row['memberid'];
                    $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['name']      = $row['name'];
                    $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['sex']       = $row['sex'];
                    $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['age']       = $row['age'];
                    $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['familyid']  = $row['familyid'];
                    $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['leader']    = $row['leader'];
                    $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['whatsapp']  = $row['whatsapp'];
                    $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['phone']     = $row['phone2'];
                    $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['remarks']   = $row['remarks'];
                    $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['address']   = $row['address'];
                    $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['city']      = $row['city'];
                    $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['citygroup'] = GFV("citygroup", "groupname", "citygrpid=" . $row['citygroup']);

                } else {
                    $out[$l]['floor'][$f]['rooms'][$r]['cot'][$c]['bed'][$b]['memberid'] = null;
                }
            }
        }
    }
}
echo json_encode($out);
