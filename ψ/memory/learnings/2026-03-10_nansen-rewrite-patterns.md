# Nansen DNA Rewrite Patterns

**Date**: 2026-03-10
**Context**: Sprint 4 — rewrote 4 Audience pages from framer-motion/glass/violet to Nansen/shadcn

## Pattern: Page Rewrite Checklist

1. **Remove**: framer-motion, AnimatePresence, motion.*, glass classes, backdrop-blur, violet/pink colors, var(--*) CSS vars, btn-primary/btn-glass/input-glass
2. **Replace with**: shadcn components (Dialog, AlertDialog, Table, Card, Checkbox, Button, Input, Form)
3. **Nansen colors**: bg #06080b, card #131415, accent #00E2B5, border #08283B, table header #093A57, striped #042133, hover #000, muted text #9BA1A5
4. **Responsive**: grid-cols-1 default, md: breakpoint for desktop. Mobile cards, desktop tables. pb-20 md:pb-8 for bottom nav.
5. **Touch targets**: 44px minimum on mobile (min-w-[44px] min-h-[44px])
6. **Verify**: grep for violation patterns, build check

## Pattern: N+1 → Server Action $transaction

When frontend does `Promise.all(ids.map(id => updateSingle(id)))`, create a server action that takes the full array and wraps in `db.$transaction()`.

## Pattern: Centralize Validation Regex

Inline regex like `/^0[689]\d{8}$/` scattered across files → always import from `lib/validations.ts` schemas. Grep for the pattern after fixing to catch all instances.
