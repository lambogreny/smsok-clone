# Whitelist-based Error Sanitization for Frontend

**Date**: 2026-03-10
**Context**: Security audit of smsok-clone — 18 files had raw error.message displayed to users

## Pattern
Instead of trying to filter out dangerous messages (blacklist), whitelist only known-safe Thai messages from our own server actions. Everything else gets a generic message.

```typescript
// lib/error-messages.ts
const SAFE_PATTERNS = ["อีเมลนี้ถูกใช้งานแล้ว", "กรุณากรอก", ...];

export function safeErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return GENERIC;
  if (SAFE_PATTERNS.some((p) => error.message.includes(p))) return error.message;
  return GENERIC;
}
```

## Why whitelist > blacklist
- New error types automatically get blocked (safe by default)
- No risk of missing a dangerous pattern
- Easy to maintain: add new safe messages as needed

## Next.js Error Boundaries
- `app/(dashboard)/error.tsx` catches all dashboard route errors
- `app/(auth)/error.tsx` catches all auth route errors
- These are automatic — no wrapping needed, Next.js handles it
