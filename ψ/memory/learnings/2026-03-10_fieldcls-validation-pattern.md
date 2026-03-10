# Learning: fieldCls Validation Pattern for React Forms

**Date**: 2026-03-10
**Context**: BUG-51 Input Validation UI sweep across 10+ forms

## Pattern

```ts
// lib/form-utils.ts
export function fieldCls(error: string | undefined, value: string, extra = ""): string {
  const border = error
    ? "border-red-500/60 focus:border-red-500"
    : value
    ? "border-emerald-500/40 focus:border-emerald-500/60"
    : "";
  return ["input-glass", border, extra].filter(Boolean).join(" ");
}
```

**Usage**:
```tsx
<input className={fieldCls(errors.phone, phone)} />
// Error state (any truthy string) → red border
// Valid state (non-empty value, no error) → green border
// Neutral state (empty) → no border override
```

## Key Insight

`fieldCls` accepts any truthy string as error — the actual message is displayed separately. This decouples the border color logic from the error message display, which is cleaner than checking error && error.length > 0.

## Companion Utilities

- `blockNonNumeric(e)` — prevents non-digit keydown
- `blockThai(e)` — prevents Thai characters (email fields)
- `allowAlphaNumericSpace(e)` — for sender name fields (A-Z, 0-9, space only)
- `smsCounterText(message)` — Thai 70 chars/SMS, EN 160 chars/SMS

## DashboardShell Rule

**NEVER** wrap child pages with `<DashboardShell>` — the layout already does it.
Every `app/(dashboard)/dashboard/*/page.tsx` gets the shell from the parent layout.

## Edit Tool Rule

Always `Read` or `tail` the file end before Edit operations on closing tags.
Whitespace differences cause "string not found" silently.
