# Task #3023 — Order UI Redesign (Nansen DNA) — DONE

## Status: COMPLETED
**Agent**: UXUI Oracle
**Date**: 2026-03-14

## Deliverables

### 1. Order History Page (`app/(dashboard)/dashboard/billing/orders/page.tsx`)
- Replaced shadcn `<Table>` with `nansen-table nansen-table-dense`
- Stat cards: top accent gradient line, icon glow background, stagger animations
- Mobile: `card-conic` hover + status-colored accent line per order
- Desktop: action buttons reveal on row hover
- Countdown timer: red when < 1 hour
- Uses `PageLayout`, `PageHeader`, `FilterBar`, `PaginationBar` for consistency
- CTA: `btn-primary` with nansen teal glow

### 2. Order Rejected State (`app/(dashboard)/dashboard/billing/orders/[id]/page.tsx`)
- Enhanced rejected banner: XCircle icon box, top accent line, stronger corner glow
- Reject reason: dedicated box with AlertTriangle + label
- Re-upload CTA: inline hint with accent color
- Timeline: "ตรวจสอบ" step shows red X with glow shadow (instead of empty circle)
- Action button: label changes to "แนบสลิปใหม่" when rejected
- Card radius: rounded-xl → rounded-lg per DNA spec (xl/2xl banned)

### Also completed (prior session):
- Privacy Settings page
- PDPA Hub page
- Consent Management page

## Notes
- Logic untouched — UI/visual only
- All pages use existing Nansen DNA v2 design system classes
- Thai language preserved throughout
