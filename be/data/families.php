<?php
header( 'Access-Control-Allow-Origin: *' );
require_once '../base/connection.php';
$out = array();

$query = 'SELECT F.* FROM families F  ORDER BY familyid DESC';
$res   = mysqli_query( $ts, $query );
if ( mysqli_num_rows( $res ) > 0 ) {
    $a = 0;
    while ( $row = mysqli_fetch_assoc( $res ) ) {
        $out[ $a ]           = $row;
        $out[ $a ][ 'status' ] = '';
        $out[ $a ][ 'sex' ]    = array();

        $query1 = 'SELECT  B.booking_status as  status, (COALESCE(B.bill_amount,0)-COALESCE(B.recd_amount,0)) as balance FROM brn B  WHERE B.familyid=' . $row[ 'familyid' ];
        $res1   = mysqli_query( $ts, $query1 );
        if ( mysqli_num_rows( $res1 ) == 1 ) {
            $row1               = mysqli_fetch_assoc( $res1 );
            $out[ $a ][ 'status' ]  = $row1[ 'status' ];
            $out[ $a ][ 'balance' ] = $row1[ 'balance' ] * 1;

        }
        $query2             = 'SELECT *, COUNT(*) as count, p_roomtype FROM members WHERE familyid=' . $row[ 'familyid' ] . ' GROUP BY sex ORDER BY sex';
        $res2               = mysqli_query( $ts, $query2 );

        $out[ $a ][ 'members' ] = 0;
        if ( mysqli_num_rows( $res2 ) > 0 ) {
            $c = 0;
            while ( $row2 = mysqli_fetch_assoc( $res2 ) ) {
                $out[ $a ][ 'roomtype' ] = $row2[ 'p_roomtype' ];
                $out[ $a ][ 'sex' ][ $c ]          = array();
                $out[ $a ][ 'sex' ][ $c ][ 'sex' ]   = $row2[ 'sex' ];
                $out[ $a ][ 'sex' ][ $c ][ 'count' ] = $row2[ 'count' ];
                if ( 0 == $c && '' != $row2[ 'bedid' ] ) {

                    $actype            = GFV( 'rooms', 'actype', 'roomid=' . GFV( 'beds', 'roomid', 'bedid=' . $row2[ 'bedid' ] ) );
                    $out[ $a ][ 'actype' ] = '';
                    if ( 1 == $actype ) {
                        $out[ $a ][ 'actype' ] = 'IN AC ROOM';
                    } else if ( 0 == $actype ) {
                        $out[ $a ][ 'actype' ] = 'IN NAC ROOM';
                    }

                }

                $out[ $a ][ 'members' ] += $row2[ 'count' ];
                $c++;
            }
        }
        $query3 = 'SELECT  COUNT(*) as count FROM members WHERE familyid=' . $row[ 'familyid' ] . " AND (bedid=0 OR bedid='' OR bedid IS NULL)";
        $res3   = mysqli_query( $ts, $query3 );
        if ( mysqli_num_rows( $res3 ) > 0 ) {
            $row3             = mysqli_fetch_assoc( $res3 );
            $out[ $a ][ 'nobed' ] = $row3[ 'count' ] * 1;
        }

        $a++;

    }
}
echo json_encode( $out );
