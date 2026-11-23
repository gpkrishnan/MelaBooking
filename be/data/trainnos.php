<?php
header('Access-Control-Allow-Origin: *');
require_once '../base/connection.php';
$out = array();

if (isset($_REQUEST['mode']) && $_REQUEST['mode']=='arrival' ){
      $query="SELECT DISTINCT arr_train_no as trainno FROM members ORDER BY arr_train_no";
}
if (isset($_REQUEST['mode']) && $_REQUEST['mode']=='depature' ){
      $query="SELECT DISTINCT dep_train_no as trainno FROM members ORDER BY dep_train_no";
}
if (isset($query)){
      $res=mysqli_query($ts,$query);
      if (mysqli_num_rows($res)>0){
            $a=0;
            while($row=mysqli_fetch_assoc($res)){
                  $out[$a]=$row['trainno'];
                  $a++;
            }
      }
}
echo json_encode($out);