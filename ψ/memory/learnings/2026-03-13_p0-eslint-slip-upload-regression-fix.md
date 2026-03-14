---
title: P0 ESLint + slip upload regression fix
tags: [eslint, vitest, slip-upload, bullmq, regression, oracle, learn]
created: 2026-03-13
source: Backend Oracle fallback learn
---

# P0 ESLint + slip upload regression fix

- `npx eslint . --ext .ts,.tsx --quiet` can be brought back to green quickly by removing direct state updates from effect bodies, moving JSX returns outside `try/catch`, and replacing obvious `any`/hook-name false positives with narrower types or aliases.
- Order slip upload queue regression needed the test suite updated to match the current BullMQ contract:
  - route now calls `slipVerifyQueue.waitUntilReady()`
  - custom `jobId` must use `order-slip-${orderSlipId}` instead of `order-slip:${orderSlipId}` because BullMQ rejects the colon-delimited form
- Regression verification command:
  - `npx vitest run tests/task-2624-slip-upload-filelike.test.ts tests/task-2905-slip-queue-jobid.test.ts`
