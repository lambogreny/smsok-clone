# SMSOK SDK Examples

Base API URL: `https://smsok.example.com/api/v1`

These examples cover the minimum integration flows required by task `#3238`:

- Authentication with API keys
- Send SMS
- Check balance

Language-specific examples:

- [curl.md](/Users/lambogreny/oracles/smsok-clone/docs/examples/curl.md)
- [nodejs.md](/Users/lambogreny/oracles/smsok-clone/docs/examples/nodejs.md)
- [python.md](/Users/lambogreny/oracles/smsok-clone/docs/examples/python.md)
- [php.md](/Users/lambogreny/oracles/smsok-clone/docs/examples/php.md)

## Authentication

Use either of these headers:

```http
Authorization: Bearer sk_live_xxxxxxxxxxxxx
X-API-Key: sk_live_xxxxxxxxxxxxx
```

## Related Docs

- Swagger UI: `/api/v1/docs`
- OpenAPI JSON: `/api/v1/docs/openapi.json`
- Webhooks: [webhooks.md](/Users/lambogreny/oracles/smsok-clone/docs/webhooks.md)
