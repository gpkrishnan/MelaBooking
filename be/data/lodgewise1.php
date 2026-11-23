<?php
header('Access-Control-Allow-Origin: *');
require_once '../base/connection.php';
$out = array();


if (isset($_POST['lodgename'])){
      // while ($row=mysqli_fetch_assoc($res)){
            $query1="SELECT * FROM rooms LEFT JOIN beds ON rooms.roomid=beds.roomid LEFT JOIN members ON beds.bedid=members.bedid LEFT JOIN families ON members.familyid=families.familyid LEFT JOIN brn on brn.familyid=families.familyid WHERE lodgename='".$_POST['lodgename']."' AND brn.booking_status<>'C' ORDER BY roomno";
            $res1=mysqli_query($ts,$query1);
            if (mysqli_num_rows($res1)>0){
                  $out['lodge']=$_REQUEST['lodgename'];
                  $out['rooms']=array();
                  $a=-1; $roomno='';
                  while($row1=mysqli_fetch_assoc($res1)){
                       if ($roomno!=$row1['roomno']){
                              $a++;
                              $out['rooms'][$a]['roomno']=$row1['roomno'];
                              if ($row1['roomno']=='Dor'){
                              $out['rooms'][$a]['actype']='Dormitory';  
                              } else{
                              $out['rooms'][$a]['actype']=$row1['actype']=='1'?'AC':'Non-AC'; 
                              }
                              $b=-1;
                              $out['rooms'][$a]['members']=array();
                       
                       }

                        $b++;
                        if ($row1['familyid']){
                              $out['rooms'][$a]['members'][$b]['KKID']=$row1['booking_status']."_".$row1['KKID'];
                              $out['rooms'][$a]['members'][$b]['whatsApp']=$row1['whatsapp'];
                              $out['rooms'][$a]['members'][$b]['emergency']=$row1['phone2'];
                        } else{
                              $out['rooms'][$a]['members'][$b]['KKID']='';  
                              $out['rooms'][$a]['members'][$b]['whatsApp']='';
                              $out['rooms'][$a]['members'][$b]['emergency']='';
                        }
                        $out['rooms'][$a]['members'][$b]['name']=$row1['name'];
                        $out['rooms'][$a]['members'][$b]['age']=$row1['age'];
                        $out['rooms'][$a]['members'][$b]['sex']=$row1['sex'];
                        $out['rooms'][$a]['members'][$b]['phone']=$row1['phone'];
                        $out['rooms'][$a]['members'][$b]['photoid']=$row1['photoidno'];
                        $out['rooms'][$a]['members'][$b]['arrival']=$row1['arr_train_no'];
                        if($row1['arr_train_time']!=''){
                              $out['rooms'][$a]['members'][$b]['arrivaltime']=date('d/m/y h:i A', strtotime($row1['arr_train_time']));
                        } else {
                              $out['rooms'][$a]['members'][$b]['arrivaltime']='';  
                        }
                        $out['rooms'][$a]['members'][$b]['arrivalcity']=$row1['arr_city'];
                        $out['rooms'][$a]['members'][$b]['depature']=$row1['dep_train_no'];
                        if ($row1['dep_time']!=''){
                              $out['rooms'][$a]['members'][$b]['depaturetime']=date('d/m/y h:i A', strtotime($row1['dep_time']));
                        } else{
                              $out['rooms'][$a]['members'][$b]['depaturetime']='';
                        }
                        $out['rooms'][$a]['members'][$b]['depaturecity']=$row1['dep_city'];
                        if ($row1['checkin_time']!=''){
                              $out['rooms'][$a]['members'][$b]['checkin']=date('_d/M/y h:i A', strtotime($row1['checkin_time']));;
                        } else{
                               $out['rooms'][$a]['members'][$b]['checkin']='';
                        }
                         if ($row1['checkout_time']!=''){
                              $out['rooms'][$a]['members'][$b]['checkout']=date('_d/M/y h:i A', strtotime($row1['checkout_time']));;
                        } else{
                               $out['rooms'][$a]['members'][$b]['checkout']='';
                        }
                         $out['rooms'][$a]['members'][$b]['arr_bus_no']=$row1['arr_bus_no'];
                          $out['rooms'][$a]['members'][$b]['dep_bus_no']=$row1['dep_bus_no'];
                       
                  }
            }
            
      // }
}
array_walk_recursive($out,function(&$item){$item=strval($item);});
echo json_encode($out);