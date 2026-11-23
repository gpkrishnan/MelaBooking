<?php
function GSLV($theValue, $theType, $theDefinedValue = "", $theNotDefinedValue = "")
{
    global $ts;
    // Magic quotes was removed in PHP 7.0, no longer needed for PHP 8
    // if (PHP_VERSION < 6) {
    //     $theValue = get_magic_quotes_gpc() ? stripslashes($theValue) : $theValue;
    // }

    // Handle null values for PHP 8.1+ compatibility
    $theValue = $theValue ?? '';
    $theValue = mysqli_real_escape_string($ts, (string)$theValue);
    switch ($theType) {
        case "text":
            $theValue = ("" != $theValue) ? "'" . $theValue . "'" : "NULL";
            break;

        case "long":
        case "int":
            $theValue = ("" != $theValue) ? intval($theValue) : "NULL";
            break;

        case "double":
            $theValue = ("" != $theValue) ? doubleval($theValue) : "NULL";
            break;

        case "date":
            $theValue = ("" != $theValue) ? "'" . $theValue . "'" : "NULL";
            break;

        case "defined":
            $theValue = ("" != $theValue) ? $theDefinedValue : $theNotDefinedValue;
            break;
    }

    return $theValue;
}
function GFV($tabel, $getfiled, $criteria)
{
    $returnresult = '';
    global $ts;
    if (strlen($criteria) == 0) {
        $query_function = "SELECT $getfiled FROM " . $tabel . " LIMIT 1";
    } else {
        $query_function = "SELECT $getfiled FROM " . $tabel . " WHERE " . $criteria . " LIMIT 1";
    }
    $fun = mysqli_query($ts, $query_function);
    if ($fun && mysqli_num_rows($fun) > 0) {
        $row_fun      = mysqli_fetch_assoc($fun);
        $returnresult = $row_fun[$getfiled];
        return $returnresult;
    } else {
        return null;
    }
}
function UUID()
{
    // Generate 16 bytes (128 bits) of random data or use the data passed into the function.
    $data = random_bytes(16);
    assert(strlen($data) == 16);
    // Set version to 0100
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    // Set bits 6-7 to 10
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    // Output the 36 character UUID.
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
function base64_to_jpeg($base64_string, $output_file)
{
    $ifp  = fopen('../images/' . $output_file, 'w');
    $data = explode(',', $base64_string);
    fwrite($ifp, base64_decode($data[1]));
    fclose($ifp);
    return $output_file;
}
