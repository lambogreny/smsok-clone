# Lessons Learned — 2026-03-10

## 1. PM Validation Loop → Format is the Problem

When PM asks the same status question repeatedly (10+ times), the confirmation format isn't credible enough. Prose answers don't stick. What works: a markdown table with `| File | Status | Commit | Lines |` format — visual, scannable, unambiguous. Include grep output counts as proof.

## 2. Spring Color Picker Parameters

For color picker dot buttons: `stiffness: 500, damping: 25` + `animate={{ scale: selected ? 1.18 : 1 }}`. This creates snappy selection feedback without oscillation. AnimatePresence checkmark with `initial={{ scale: 0, rotate: -30 }}` → `animate={{ scale: 1, rotate: 0 }}` makes selection feel *confirmed*, not just *toggled*.

## 3. Check for In-Flight Refactors Before Editing

Before modifying a component, check recent commits for refactors that might supersede your work. `git log --oneline -5 -- path/to/file` reveals if lead-dev is actively touching the same area. Editing code that's about to be extracted wastes cycles.

## 4. Glassmorphism Depth Ladder

Dropdown popover depth: `bg-[#080F1E]/95` (darker) > `bg-[#0D1526]/95` (standard surface) > `bg-[var(--bg-elevated)]/80`. Use darker bg + violet border glow (`border-violet-500/15`) + `shadow-[0_12px_40px_rgba(0,0,0,0.6)]` for inline pickers that need to float clearly above table rows.
