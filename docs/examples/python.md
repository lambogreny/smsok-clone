# Python Examples

Base URL: `https://smsok.example.com/api/v1`

## Authenticate

```python
import requests

API_KEY = "sk_live_xxxxxxxxxxxxx"
BASE_URL = "https://smsok.example.com/api/v1"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}
```

## Send SMS

```python
response = requests.post(
    f"{BASE_URL}/sms/send",
    headers=HEADERS,
    json={
        "sender": "SMSOK",
        "to": "0812345678",
        "message": "OTP ของคุณคือ 123456",
    },
)

print(response.json())
```

## Check Balance

```python
balance_response = requests.get(
    f"{BASE_URL}/credits/balance",
    headers={"Authorization": f"Bearer {API_KEY}"},
)

balance = balance_response.json()["data"]["balance"]
print(balance)
```
