---
name: Sequential E2E against Turbopack
description: Run Playwright suites one at a time to avoid Turbopack dev server crashes during long test runs
type: lesson
date: 2026-03-14
source: "rrr: smsok-clone"
tags: [playwright, turbopack, e2e, testing, stability]
---

# Sequential E2E Against Turbopack

## Pattern

When running Playwright E2E tests against Next.js Turbopack dev server (`bun dev`), never run multiple test suites concurrently. The dev server crashes under sustained browser automation load, corrupting results and requiring manual restart.

## Solution

Run suites sequentially: `npx playwright test tests/e2e/auth.spec.ts && npx playwright test tests/e2e/sms.spec.ts` etc.

For production-grade E2E reliability, test against `next build && next start` instead of `next dev`.

## Evidence

- 39/53 topup tests failed in concurrent run, 25/25 passed when run alone (after server restart)
- Dev server returned ERR_CONNECTION_REFUSED mid-suite when 3+ Playwright instances ran simultaneously
- QA-REPORT.md Bug #1 documents this as a known blocker since 2026-03-09

## Also Learned

- When tests fail en masse, check for stale selectors (UI refactor) before assuming real bugs
- QA role = test only, report PASS/FAIL with file:line evidence, never fix
