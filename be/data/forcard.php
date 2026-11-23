<?php
header('Access-Control-Allow-Origin: *');
require_once '../base/connection.php';
$out = array();

$query="SELECT members.name, members.KKID,members.phone, members.arr_train_no, members.dep_train_no, members.arr_bus_no,members.dep_bus_no ,rooms.lodgename, rooms.roomno, rooms.actype, rooms.bedtype FROM members LEFT JOIN beds on members.bedid=beds.bedid LEFT JOIN rooms on beds.roomid=rooms.roomid ORDER BY memberid";
$res=mysqli_query($ts,$query);
if (mysqli_num_rows($res)>0){
      $a=0;
      while ($row=mysqli_fetch_assoc($res)){
            $out[$a]=$row;
            if ($row['lodgename']!=null){
                $out[$a]['lodgename']=str_replace("_"," ",explode("-",$row['lodgename'])[1]);
                 $out[$a]['lodgeshortname']=str_replace("_"," ",explode("-",$row['lodgename'])[0]);
            } else{
               $out[$a]['lodgename']='-'; 
                $out[$a]['lodgeshortname']="";  
            }
            $a++;
      }
}
echo json_encode($out);