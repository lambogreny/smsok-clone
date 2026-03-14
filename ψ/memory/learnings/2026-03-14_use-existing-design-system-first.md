---
name: use-existing-design-system-first
description: Always audit existing CSS classes before writing new styles — the Nansen DNA v2 had 30+ premium classes unused by consent/order pages
type: learning
---

# Use Existing Design System Before Creating New

When upgrading page UI from "basic" to "premium", the first step should always be auditing what the design system already provides. In the SMSOK codebase, `globals.css` had `card-conic`, `nansen-table`, `stagger-children`, `has-gradient-border`, `expand-content`, `btn-primary`, `neon-cyan`, and 20+ more classes — none of which were used by the consent or order pages.

The fix wasn't writing new CSS. It was replacing inline styles like `background: "var(--bg-surface)"` with semantic classes like `nansen-card` or `card-conic`, and replacing generic shadcn `<Table>` with the purpose-built `nansen-table nansen-table-dense` system.

**Rule**: Before any UI redesign, run `grep -c` on the design system file to see which classes exist but have zero usage in the target files. That gap IS the upgrade path.
