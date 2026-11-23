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
    // Validate required field
    if (!isset($_POST['roomId']) || trim($_POST['roomId']) === '') {
        $out['message'] = "Missing required field: roomId";
        echo json_encode($out);
        exit();
    }

    $roomId = intval($_POST['roomId']);

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
        throw new Exception("Cannot delete room: " . $row['member_count'] . " member(s) are currently assigned to this room. Please remove members first.");
    }

    mysqli_begin_transaction($ts);

    // Delete all beds for this room
    $deleteBeds = "DELETE FROM beds WHERE roomid=" . intval($roomId);
    if (!mysqli_query($ts, $deleteBeds)) {
        throw new Exception("Failed to delete beds: " . mysqli_error($ts));
    }

    // Delete the room
    $deleteRoom = "DELETE FROM rooms WHERE roomid=" . intval($roomId);
    if (!mysqli_query($ts, $deleteRoom)) {
        throw new Exception("Failed to delete room: " . mysqli_error($ts));
    }

    mysqli_commit($ts);

    $out = [
        'success' => true,
        'message' => 'Room deleted successfully',
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
