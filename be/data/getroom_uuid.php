<?php
header('Access-Control-Allow-Origin: *');
require_once '../base/connection.php';

if (isset($_POST['uuid'])) {
    echo $familyid = GFV('families', 'familyid', "uuid='" . $_POST['uuid'] . "'");
} else {
    echo "";
}
