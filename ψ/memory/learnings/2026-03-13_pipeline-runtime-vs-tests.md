---
name: pipeline-runtime-vs-tests
description: Unit tests passing doesn't mean runtime works — need integration tests with real APIs before Human testing
type: feedback
---

# Pipeline: Runtime vs Tests Gap

## Pattern
Session 2026-03-13: 11 commits pushed, reviewer approved, vitest passed (19 tests), but Human immediately hit runtime failures (SMS send error, slip upload broken) during live testing.

## Root Cause
- Unit tests mock external services (EasyThunder SMS, SlipOK, R2 storage)
- No integration tests that actually call real APIs
- Playwright E2E had 37 failed suites but was ignored as "not blocking"

## Lesson
1. Full Playwright E2E gate MUST pass before Human tests — 37 failures = not ready
2. Need at least smoke tests against real APIs (even in dev mode)
3. "Reviewer APPROVED" + "vitest PASSED" ≠ "production ready"
4. Human should never test before QA E2E 100% complete — this is a process failure not a code failure
