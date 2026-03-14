---
name: Anti-fraud requires full code path audit
description: Security audits must trace every path to the critical resource (credits/money), not just the main flow. Hidden endpoints can bypass all controls.
type: learning
---

## Anti-Fraud: Full Path Audit

When auditing payment/credit systems, map EVERY code path that touches the critical resource:

1. **Don't trust the happy path** — The main flow (order → slip → verify → credits) was secure. But `/api/v1/packages/purchase` created active credits with zero verification.

2. **Search for the function, not the flow** — Instead of tracing the UI flow, search for all calls to the credit-granting function (`activateOrderPurchase`, `packagePurchase.create`). Found 8 paths, 2 were unguarded.

3. **Check admin bypasses** — Admin endpoints often skip verification intentionally. Document which bypasses are intentional vs accidental.

4. **Data source alignment** — When fixing writes (save tax profile → taxProfile table), verify reads come from the same table. The checkout page was reading from legacy `customerTaxInfo` while orders wrote to `taxProfile`.

5. **Status mapping layers create invisible bugs** — API serializers that transform status values can hide database states from the frontend. The REJECTED state existed in DB but was mapped to PENDING by the serializer.

### Key Pattern
```
# Find all credit-granting paths
grep -r "activateOrderPurchase\|packagePurchase.create" --include="*.ts" -l
# Then verify each path has proper guards
```
