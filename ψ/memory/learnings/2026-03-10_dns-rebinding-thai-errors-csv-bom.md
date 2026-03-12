---
title: DNS Rebinding, Thai Error Patterns, CSV BOM
created: 2026-03-10
tags: [ssrf, dns-rebinding, thai-errors, csv, security]
---

# Key Learnings from Billing+Bugs+BullMQ Session

## 1. DNS Rebinding Prevention
Standard SSRF check (`isInternalUrl` → `fetch(url)`) has TOCTOU vulnerability.
`fetch()` does its own DNS resolution which can return different IPs.
Fix: `safeFetch()` — resolve DNS ourselves → validate → fetch by resolved IP with Host header.

## 2. Thai Error Message Classification
`apiError()` in `lib/api-auth.ts` classifies errors as 400 vs 500 based on Thai keywords.
If you throw a new Thai error message (e.g., "มีอยู่แล้ว"), it MUST be in the isThaiValidation pattern list.
Missing pattern = 500 Internal Server Error instead of 400 Bad Request.

## 3. CSV UTF-8 BOM for Thai
Excel needs `\uFEFF` (UTF-8 BOM) prepended to CSV content to render Thai correctly.
Without it, Thai text appears as mojibake in Excel (works fine in Google Sheets/Numbers).

## 4. prisma db push After Schema Changes
New models in schema don't exist in DB until `prisma db push` runs.
Missing tables cause cascading failures — auth, webhooks, billing all break silently.

## 5. safeFetch HTTPS Limitation
Fetching HTTPS by IP requires proper SNI handling. Setting Host header works in most runtimes
but may fail if the server checks TLS certificate against the IP instead of the Host header.
