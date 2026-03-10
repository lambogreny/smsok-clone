# Lesson: Checkbox + Select All + Bulk Actions Pattern

**Date**: 2026-03-10
**Context**: Built bulk actions for Contacts (delete, add to group) and Groups/:id (bulk remove) pages

## Pattern
Three pieces of state for checkbox + bulk actions:

```tsx
// 1. Selection state — Set of IDs
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

// 2. Derived: are all visible items selected?
const allSelected = paginatedItems.length > 0 &&
  paginatedItems.every((item) => selectedIds.has(item.id));

// 3. Toggle functions
const toggleSelect = (id: string) => {
  setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
};

const toggleSelectAll = () => {
  if (allSelected) setSelectedIds(new Set());
  else setSelectedIds(new Set(paginatedItems.map((i) => i.id)));
};
```

Key UX details:
- Select All only selects VISIBLE items (respects search/filter/pagination)
- Show count: "เลือก {selectedIds.size} รายชื่อ"
- Bulk action bar appears only when hasSelection
- Clear selection after successful action
- AnimatePresence for smooth bar show/hide
