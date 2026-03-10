# Lesson: Shared Dropdown Components Prevent Input Validation Bugs

**Date**: 2026-03-10
**Context**: CampaignsClient had text input for sender name — users could type invalid names

## Pattern
When a form field has a fixed set of valid values (e.g. approved sender names), ALWAYS use a dropdown, never a text input.

Extract shared dropdown components when the same field appears on multiple pages:
```tsx
// components/ui/SenderDropdown.tsx
<SenderDropdown value={v} onChange={setV} senderNames={["EasySlip", ...approved]} />
```

Benefits:
- Impossible to enter invalid values
- Auto-select when only 1 option (Hick's Law)
- Consistent UX across all pages
- Single source of truth for display logic

## Anti-pattern
Text input with validation regex for a field that has known valid values. Validation can be bypassed, typos happen, and error messages confuse users.
