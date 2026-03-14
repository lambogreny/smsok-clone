# cURL Examples

Base URL: `https://smsok.example.com/api/v1`

## Authenticate

```bash
API_KEY="sk_live_xxxxxxxxxxxxx"
BASE_URL="https://smsok.example.com/api/v1"
```

## Send SMS

```bash
curl -X POST "$BASE_URL/sms/send" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "SMSOK",
    "to": "0812345678",
    "message": "OTP ของคุณคือ 123456"
  }'
```

## Check Balance

```bash
curl -X GET "$BASE_URL/credits/balance" \
  -H "Authorization: Bearer $API_KEY"
```

## Example Error

```json
{
  "error": "rate_limited",
  "retry_after": 60
}
```
