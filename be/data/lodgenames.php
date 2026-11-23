<?php
header('Access-Control-Allow-Origin: *');
require_once '../base/connection.php';
$out = array();

$query="SELECT DISTINCT lodgename FROM rooms ORDER BY lodgename";
$res=mysqli_query($ts,$query);
if (mysqli_num_rows($res)>0){
      $a=0;
      while($row=mysqli_fetch_assoc($res)){
            $out[$a]=$row['lodgename'];
            $a++;
      }
}
echo json_encode($out);