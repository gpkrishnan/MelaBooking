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

$out = ['success' => false, 'message' => 'Invalid request'];

try {
    // Validate required fields
    $requiredFields = ['lodgeName', 'roomNo', 'roomType', 'floor', 'toilet', 'rate'];
    foreach ($requiredFields as $field) {
        if (!isset($_POST[$field]) || trim($_POST[$field]) === '') {
            $out['message'] = "Missing required field: $field";
            echo json_encode($out);
            exit();
        }
    }

    // Extract and sanitize form data
    $lodgeName = $_POST['lodgeName'];
    $roomNo = $_POST['roomNo'];
    $roomType = $_POST['roomType'];
    $floor = $_POST['floor'];
    $toilet = $_POST['toilet'];
    $rate = $_POST['rate'];
    $noOfSingleCots = isset($_POST['noOfSingleCots']) ? intval($_POST['noOfSingleCots']) : 0;
    $noOfDoubleCots = isset($_POST['noOfDoubleCots']) ? intval($_POST['noOfDoubleCots']) : 0;
    $roomId = isset($_POST['roomId']) ? intval($_POST['roomId']) : null;

    // Map roomType to actype (AC=1, NONAC=0, Dormitory=2)
    $actype = 0;
    if ($roomType === 'AC') {
        $actype = 1;
    } elseif ($roomType === 'Dormitory') {
        $actype = 2;
    }

    // Determine bedtype based on cots
    $bedtype = '';
    if ($noOfSingleCots > 0 && $noOfDoubleCots > 0) {
        $bedtype = 'Mixed';
    } elseif ($noOfSingleCots > 0) {
        $bedtype = 'Single';
    } elseif ($noOfDoubleCots > 0) {
        $bedtype = 'Double';
    }

    mysqli_begin_transaction($ts);

    if ($roomId) {
        // UPDATE existing room
        $updateRoomQuery = sprintf(
            "UPDATE rooms SET lodgename=%s, roomno=%s, actype=%s, bedtype=%s, floor=%s, toilet=%s, rate=%s WHERE roomid=%s",
            GSLV($lodgeName, "text"),
            GSLV($roomNo, "text"),
            GSLV($actype, "int"),
            GSLV($bedtype, "text"),
            GSLV($floor, "int"),
            GSLV($toilet, "text"),
            GSLV($rate, "double"),
            GSLV($roomId, "int")
        );

        if (!mysqli_query($ts, $updateRoomQuery)) {
            throw new Exception("Failed to update room: " . mysqli_error($ts));
        }

        // Check if any members are assigned to beds in this room
        $checkMembersQuery = "SELECT COUNT(*) as member_count FROM members M
                              INNER JOIN beds B ON M.bedid = B.bedid
                              WHERE B.roomid = " . intval($roomId);
        $checkResult = mysqli_query($ts, $checkMembersQuery);

        if (!$checkResult) {
            throw new Exception("Failed to check member assignments: " . mysqli_error($ts));
        }

        $row = mysqli_fetch_assoc($checkResult);
        if ($row['member_count'] > 0) {
            throw new Exception("Cannot update room: " . $row['member_count'] . " member(s) are currently assigned to this room. Please remove members first.");
        }

        // Delete existing beds for this room (safe now as no members are assigned)
        $deleteBeds = "DELETE FROM beds WHERE roomid=" . intval($roomId);
        if (!mysqli_query($ts, $deleteBeds)) {
            throw new Exception("Failed to delete existing beds: " . mysqli_error($ts));
        }
    } else {
        // INSERT new room
        $insertRoomQuery = sprintf(
            "INSERT INTO rooms (lodgename, roomno, actype, bedtype, floor, toilet, rate) VALUES(%s, %s, %s, %s, %s, %s, %s)",
            GSLV($lodgeName, "text"),
            GSLV($roomNo, "text"),
            GSLV($actype, "int"),
            GSLV($bedtype, "text"),
            GSLV($floor, "int"),
            GSLV($toilet, "text"),
            GSLV($rate, "double")
        );

        if (!mysqli_query($ts, $insertRoomQuery)) {
            throw new Exception("Failed to insert room: " . mysqli_error($ts));
        }

        // Get the last inserted room ID
        $roomId = mysqli_insert_id($ts);
    }

    // Create beds based on single and double cots
    $bedInserts = [];

    // Format remarks as "LodgePrefix-RoomNo" (e.g., "MB-103")
    $lodgePrefix = explode('-', $lodgeName)[0];
    $remarks = $lodgePrefix . '-' . $roomNo;

    // Single cots - each cot has 1 bed
    for ($cot = 1; $cot <= $noOfSingleCots; $cot++) {
        $bedInserts[] = sprintf(
            "(%s, %s, %s, %s, %s)",
            GSLV($roomId, "int"),
            GSLV($cot, "int"),
            GSLV(1, "int"), // bed 1
            GSLV(1, "int"), // valid = 1
            GSLV($remarks, "text") // remarks
        );
    }

    // Double cots - each cot has 2 beds
    $startCot = $noOfSingleCots + 1;
    for ($cot = $startCot; $cot < $startCot + $noOfDoubleCots; $cot++) {
        // Bed 1 of the cot
        $bedInserts[] = sprintf(
            "(%s, %s, %s, %s, %s)",
            GSLV($roomId, "int"),
            GSLV($cot, "int"),
            GSLV(1, "int"), // bed 1
            GSLV(1, "int"), // valid = 1
            GSLV($remarks, "text") // remarks
        );

        // Bed 2 of the cot
        $bedInserts[] = sprintf(
            "(%s, %s, %s, %s, %s)",
            GSLV($roomId, "int"),
            GSLV($cot, "int"),
            GSLV(2, "int"), // bed 2
            GSLV(1, "int"), // valid = 1
            GSLV($remarks, "text") // remarks
        );
    }

    // Insert all beds in one query
    if (!empty($bedInserts)) {
        $insertBedsQuery = "INSERT INTO beds (roomid, cot, bed, valid, remarks) VALUES " . implode(", ", $bedInserts);

        if (!mysqli_query($ts, $insertBedsQuery)) {
            throw new Exception("Failed to insert beds: " . mysqli_error($ts));
        }
    }

    mysqli_commit($ts);

    $out = [
        'success' => true,
        'message' => $roomId ? 'Room updated successfully' : 'Room created successfully',
        'roomId' => $roomId
    ];

} catch (Exception $e) {
    mysqli_rollback($ts);
    $out = [
        'success' => false,
        'message' => $e->getMessage()
    ];
}

echo json_encode($out);
