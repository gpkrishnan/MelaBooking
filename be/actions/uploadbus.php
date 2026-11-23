<?php
header( 'Access-Control-Allow-Origin: *' );
require_once '../base/connection.php';
if ( $_REQUEST[ 'mode' ] == 'a' ) {
    $query = 'SELECT * FROM arr_bus';
} else if ( $_REQUEST[ 'mode' ] == 'd' ) {
    $query = 'SELECT * FROM dep_bus';
}
$res = mysqli_query( $ts, $query );
if ( mysqli_num_rows( $res )>0 ) {
    while ( $row=mysqli_fetch_assoc( $res ) ) {
        $kkid = substr( $row[ 'kkid' ], 2, 10 );
        if ( $_REQUEST[ 'mode' ] == 'a' ) {
            $query1 = "UPDATE members set arr_bus_no='".$row[ 'bus' ]."' WHERE members.KKID='".$kkid."'";
            mysqli_query( $ts, $query1 );
        } else if ( $_REQUEST[ 'mode' ] == 'd' ) {
            $query1 = "UPDATE members set dep_bus_no='".$row[ 'bus' ]."' WHERE members.KKID='".$kkid."'";
            mysqli_query( $ts, $query1 );

        }
        echo $query1;
        echo "<br/>";
    }
}