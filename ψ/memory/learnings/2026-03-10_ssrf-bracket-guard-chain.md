---
title: SSRF Bracket Fix Must Be Before Guard Check
created: 2026-03-10
tags: [ssrf, ipv6, security, execution-flow]
---

# SSRF IPv6 Bracket Fix — Guard Check Ordering

## Problem
`isIP("[::1]")` returns 0 (not recognized as IP with brackets).
If your bracket-stripping logic is inside `isBlockedIP()` but the caller has:
```ts
if (isIP(hostname)) {     // ← guard returns 0 for "[::1]"
  return isBlockedIP(hostname)  // ← never reached!
}
```
The fix never executes.

## Solution
Strip brackets at the ENTRY POINT, before any isIP() guard:
```ts
const hostname = stripBrackets(parsed.hostname)
if (isIP(hostname)) {     // ← now checks "::1" → returns 6
  return isBlockedIP(hostname)  // ← correctly called
}
```

## Rule
When fixing input sanitization, trace the FULL call chain. Fix at the earliest point, not the deepest function.

## Also: "use server" + API routes
Server actions call `getSession()` (cookie). API routes use `authenticateApiKey()` (Bearer).
Must pass userId explicitly from API route → server action, or getSession() returns null.
