---
title: Overnight Sprint Patterns — Batch Imports, Consent Models, Contextual Logging
tags: [contacts, logging, pino, asynclocalstorage, batch-import, consent, middleware, next.js]
created: 2026-03-11
source: rrr: smsok-clone
---

# Overnight Sprint Patterns

## Batch Import N+1 Fix
- Never use individual `prisma.create()` in a loop for imports
- Use `prisma.createMany({ skipDuplicates: true })` in batches of 500
- `createMany` returns count only, not IDs — query back if needed for group membership

## Consent Model Design
- Dual-track: legacy `smsConsent: Boolean` + new `consentStatus: OPTED_IN|OPTED_OUT|PENDING`
- SMS send must check BOTH for backward compatibility
- STOP webhook sets both fields + records optOutReason + optOutAt timestamp
- Re-opt-in (OPTED_IN) clears optOutAt/optOutReason

## X-Request-Id at Middleware Level
- Set in Next.js middleware, not per-route — guarantees coverage on ALL responses
- Propagate incoming X-Request-Id if present, otherwise generate UUID
- Add `Access-Control-Expose-Headers` so browsers can read it
- Also set on early returns (401, 429, CORS preflight)

## Duplicate Task Detection
- Before starting any task, grep existing code for the deliverables
- Many tasks arrive as duplicates of already-completed work
- Quick verification saves significant time vs re-implementing
