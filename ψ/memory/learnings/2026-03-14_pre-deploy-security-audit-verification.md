---
title: Pre-deploy security audit — verify before delegate
tags: [security-audit, verification, false-positives, otp-rate-limit, lead-dev-workflow]
created: 2026-03-14
source: Oracle Learn
---

# Pre-deploy security audit — verify before delegate

Key lessons from SMSOK pre-deploy security marathon:

1. **Verify claims against code before delegating fixes** — QA flagged 5 security issues, but 3 were already handled (CSP headers exist in middleware.ts:54, error messages use safeErrorMessage whitelist, JWT in response is just 2FA challenge token with 5min TTL). Only 2 needed actual fixes.

2. **OTP exponential backoff should be user-friendly** — Original tiers [0, 60, 300, 900, 1800] meant users could wait 15-30 minutes. Changed to [0, 30, 60, 120, 300] — max 5 minutes is reasonable for security while not frustrating users.

3. **Production deploy issues ≠ code bugs** — When production showed CSS missing + API 503, the instinct is to look at code. But all 6 issues were server config: PM2 cluster not passing env vars, TWO_FA key too short, R2_PUBLIC_URL invalid. Zero code changes needed.

4. **Route verification before bug reports** — QA reported /dashboard/send-sms as CRITICAL 404 bug. Actual route is /dashboard/send. A simple `grep` or checking sidebar links would prevent false alarms.

5. **Lead Dev value = verification layer** — The most impactful thing a lead dev does is NOT writing code but verifying: checking if bugs are real, if fixes are already in place, if the right person is assigned. This prevents cascading wasted effort.

---
*Added via Oracle Learn*
