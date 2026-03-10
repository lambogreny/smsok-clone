# Lesson: Adding Columns to CSS Grid Data Tables

**Date**: 2026-03-10
**Context**: Adding Source column to API Logs table in smsok-clone

## Pattern
When adding a new column to a CSS Grid-based data table:

1. **Update the type** — add the field to the data type
2. **Update ALL grid templates** — header, row button, and any responsive variants. Use `replace_all` if the template string is identical across locations.
3. **Update mock data** — add realistic distribution
4. **Update filters** — add state, filter logic, dropdown, clear function, hasFilters check
5. **Update exports** — CSV header + row data
6. **Update detail view** — if there's an expanded detail panel

## Anti-pattern
Forgetting one grid template definition. If header says 7 columns but row says 6, the layout breaks silently — no error, just misaligned columns.

## Better approach
Extract the grid template into a constant:
```tsx
const GRID_COLS = "grid-cols-[150px_70px_1fr_80px_80px_60px_130px]";
```
Then reference it in all three locations. One change updates everywhere.
