<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ── Load configuration (DB credentials, KKCRT path) ──
require_once '../base/config.php';

// ── STEP 1: Connect to KKCRT as $ts (GSLV/GFV use global $ts = KKCRT) ──
$ts = mysqli_connect(KKCRT_DB_HOST, KKCRT_DB_USER, KKCRT_DB_PASS, KKCRT_DB_NAME);
if (!$ts) {
    echo json_encode(['status' => 'NOK', 'error' => 'Cannot connect to KKCRT: ' . mysqli_connect_error()]);
    exit();
}
mysqli_set_charset($ts, 'utf8');
$ts->set_charset("utf8");

// ── STEP 2: Include KKCRT helper functions (GSLV, GFV) ──
require_once KKCRT_FUNCTIONS_PATH;

// ── STEP 3: Connect to melarooms_ayodhya as $room ──
$room = mysqli_connect(MELA_DB_HOST, MELA_DB_USER, MELA_DB_PASS, MELA_DB_NAME);
if (!$room) {
    echo json_encode(['status' => 'NOK', 'error' => 'Cannot connect to melarooms_ayodhya: ' . mysqli_connect_error()]);
    exit();
}
mysqli_set_charset($room, 'utf8');
$room->set_charset("utf8");

// ── STEP 4: Parse request body ──
$data   = json_decode(file_get_contents('php://input'), true);
$brnids = isset($data['brnids']) ? $data['brnids'] : [];

if (empty($brnids)) {
    echo json_encode(['status' => 'OK', 'results' => []]);
    exit();
}

// Fetch standard description once from KKCRT (SD_ID=27)
$stdDesc = GFV("std_description", "SD_DESC", "SD_ID=27");

$out = [];

foreach ($brnids as $brnid) {
    $brnid  = intval($brnid);
    $result = [
        'brnid'          => $brnid,
        'familyid'       => null,
        'receipt_no'     => null,
        'leader'         => null,
        'whatsapp'       => null,
        'amount'         => null,
        'receipt_date'   => null,
        'paymentdetails' => null,
        'members'        => [],
        'status'         => 'error',
        'error_msg'      => ''
    ];

    // ── Fetch brn row ──
    $rBrn = mysqli_query($room, "SELECT * FROM brn WHERE brnid=$brnid LIMIT 1");
    if (!$rBrn || mysqli_num_rows($rBrn) == 0) {
        $result['error_msg'] = "BRN record not found";
        $out[] = $result;
        continue;
    }
    $brn = mysqli_fetch_assoc($rBrn);

    if ($brn['recd_amount'] <= 0) {
        $result['error_msg'] = "No received amount";
        $out[] = $result;
        continue;
    }
    if (empty($brn['receipt_date'])) {
        $result['error_msg'] = "No receipt date set";
        $out[] = $result;
        continue;
    }

    $familyid       = intval($brn['familyid']);
    $receiptDate    = $brn['receipt_date'];    // "YYYY-MM-DD"
    $amount         = $brn['recd_amount'];
    $paymentdetails = $brn['paymentdetails'];
    $leId           = $brn['LE_ID'];           // null or int
    $remarksVal     = 'B-' . (2000 + $familyid);

    $result['familyid']       = $familyid;
    $result['amount']         = $amount;
    $result['receipt_date']   = $receiptDate;
    $result['paymentdetails'] = $paymentdetails;

    // ── Fetch family leader, whatsapp, address ──
    $rFam = mysqli_query($room, "SELECT leader, whatsapp, address FROM families WHERE familyid=$familyid LIMIT 1");
    $fam  = ($rFam && mysqli_num_rows($rFam) > 0) ? mysqli_fetch_assoc($rFam) : [];
    $result['leader']  = $fam['leader']  ?? '';
    $result['whatsapp']= $fam['whatsapp'] ?? '';

    // ── Fetch all members for receipt_member rows ──
    $rMem = mysqli_query($room,
        "SELECT M.name, M.photoidno, M.KKID, F.whatsapp, F.address
         FROM members M
         INNER JOIN families F ON M.familyid = F.familyid
         WHERE M.familyid = $familyid
         ORDER BY M.memberid"
    );
    $members = [];
    if ($rMem && mysqli_num_rows($rMem) > 0) {
        while ($m = mysqli_fetch_assoc($rMem)) {
            $members[] = $m;
        }
    }
    $result['members'] = array_map(fn($m) => [
        'name'      => $m['name'],
        'photoidno' => $m['photoidno'],
        'address'   => $m['address']
    ], $members);

    // ── BRANCH A: UPDATE existing KKCRT ledger entry ──
    if (!empty($leId)) {
        $qUpd = sprintf(
            "UPDATE ledger SET
             LE_DATE=%s, LE_AMOUNT_FROM=%s, LE_AMOUNT_TO=%s,
             LE_STD_DESC=%s, LE_STD_DESC_ID=%s, LE_SPL_DESC=%s,
             LE_AC_EVENT=%s, LE_AMOUNT=%s, LE_REMARKS=%s
             WHERE LE_ID=%s",
            GSLV($receiptDate, 'date'),
            GSLV("3", 'int'),
            GSLV("2", 'int'),
            GSLV($stdDesc, 'text'),
            GSLV("27", 'int'),
            GSLV($paymentdetails, 'text'),
            GSLV("5", 'int'),
            GSLV($amount, 'double'),
            GSLV($remarksVal, 'text'),
            GSLV($leId, 'int')
        );

        if (mysqli_query($ts, $qUpd)) {
            $receiptNo = GFV("ledger", "LE_RECEIPT_NO", "LE_ID=$leId");

            // Rebuild receipt_member: delete then re-insert
            $safeNo = mysqli_real_escape_string($ts, $receiptNo);
            mysqli_query($ts, "DELETE FROM receipt_member WHERE RM_RECEIPT_NO='$safeNo'");

            foreach ($members as $m) {
                mysqli_query($ts, sprintf(
                    "INSERT INTO receipt_member
                     (RM_RECEIPT_NO, RM_MEMBER, RM_MEMBER_PHONE, RM_MEMBER_ID, RM_MEMBER_ADDRESS, RM_MEMBER_REMARKS)
                     VALUES(%s, %s, %s, %s, %s, %s)",
                    GSLV($receiptNo, 'text'),
                    GSLV($m['name'], 'text'),
                    GSLV($m['whatsapp'], 'text'),
                    GSLV($m['photoidno'], 'text'),
                    GSLV($m['address'], 'text'),
                    GSLV($m['KKID'], 'text')
                ));
            }

            // Write back updated receipt info to brn
            mysqli_query($room, sprintf(
                "UPDATE brn SET RECEIPT_NO=%s, RECEIPT_DATED=%s WHERE brnid=%s",
                GSLV($receiptNo, 'text'),
                GSLV($receiptDate, 'date'),
                GSLV($brnid, 'int')
            ));

            $result['receipt_no'] = $receiptNo;
            $result['status']     = 'updated';
        } else {
            $result['error_msg'] = mysqli_error($ts);
        }

    // ── BRANCH B: INSERT new KKCRT ledger entry ──
    } else {
        $snoVal    = GFV("sno", "SN_RECEIPT", "SN_ID=1");
        $padded    = str_pad($snoVal, 5, '0', STR_PAD_LEFT);
        $receiptNo = "A-" . $padded;

        $qIns = sprintf(
            "INSERT INTO ledger
             (LE_DATE, LE_AMOUNT_FROM, LE_AMOUNT_TO, LE_STD_DESC, LE_STD_DESC_ID,
              LE_SPL_DESC, LE_AC_EVENT, LE_AMOUNT, LE_RECEIPT_NO, LE_REMARKS)
             VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            GSLV($receiptDate, 'date'),
            GSLV("3", 'int'),
            GSLV("2", 'int'),
            GSLV($stdDesc, 'text'),
            GSLV("27", 'int'),
            GSLV($paymentdetails, 'text'),
            GSLV("4", 'int'),
            GSLV($amount, 'double'),
            GSLV($receiptNo, 'text'),
            GSLV($remarksVal, 'text')
        );

        if (mysqli_query($ts, $qIns)) {
            $newLeId = mysqli_insert_id($ts);

            // Insert receipt_member rows
            foreach ($members as $m) {
                mysqli_query($ts, sprintf(
                    "INSERT INTO receipt_member
                     (RM_RECEIPT_NO, RM_MEMBER, RM_MEMBER_PHONE, RM_MEMBER_ID, RM_MEMBER_ADDRESS, RM_MEMBER_REMARKS)
                     VALUES(%s, %s, %s, %s, %s, %s)",
                    GSLV($receiptNo, 'text'),
                    GSLV($m['name'], 'text'),
                    GSLV($m['whatsapp'], 'text'),
                    GSLV($m['photoidno'], 'text'),
                    GSLV($m['address'], 'text'),
                    GSLV($m['KKID'], 'text')
                ));
            }

            // Increment SN_RECEIPT counter in KKCRT.sno
            mysqli_query($ts, "UPDATE sno SET SN_RECEIPT=SN_RECEIPT+1 WHERE SN_ID=1");

            // Write back all three fields to melarooms_ayodhya.brn
            mysqli_query($room, sprintf(
                "UPDATE brn SET RECEIPT_NO=%s, RECEIPT_DATED=%s, LE_ID=%s WHERE brnid=%s",
                GSLV($receiptNo, 'text'),
                GSLV($receiptDate, 'date'),
                GSLV($newLeId, 'int'),
                GSLV($brnid, 'int')
            ));

            $result['receipt_no'] = $receiptNo;
            $result['status']     = 'created';
        } else {
            $result['error_msg'] = mysqli_error($ts);
        }
    }

    $out[] = $result;
}

echo json_encode(['status' => 'OK', 'results' => $out]);
