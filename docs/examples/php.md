# PHP Examples

Base URL: `https://smsok.example.com/api/v1`

## Authenticate

```php
<?php
$apiKey = "sk_live_xxxxxxxxxxxxx";
$baseUrl = "https://smsok.example.com/api/v1";
```

## Send SMS

```php
<?php
$ch = curl_init("$baseUrl/sms/send");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer $apiKey",
        "Content-Type: application/json",
    ],
    CURLOPT_POSTFIELDS => json_encode([
        "sender" => "SMSOK",
        "to" => "0812345678",
        "message" => "OTP ของคุณคือ 123456",
    ]),
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
```

## Check Balance

```php
<?php
$ch = curl_init("$baseUrl/credits/balance");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer $apiKey",
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
```
