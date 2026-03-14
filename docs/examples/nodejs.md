# Node.js Examples

Base URL: `https://smsok.example.com/api/v1`

## Authenticate

```js
const API_KEY = "sk_live_xxxxxxxxxxxxx";
const BASE_URL = "https://smsok.example.com/api/v1";

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};
```

## Send SMS

```js
const response = await fetch(`${BASE_URL}/sms/send`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    sender: "SMSOK",
    to: "0812345678",
    message: "OTP ของคุณคือ 123456",
  }),
});

const result = await response.json();
console.log(result);
```

## Check Balance

```js
const balanceResponse = await fetch(`${BASE_URL}/credits/balance`, {
  headers: { Authorization: `Bearer ${API_KEY}` },
});

const balance = await balanceResponse.json();
console.log(balance.data.balance);
```
