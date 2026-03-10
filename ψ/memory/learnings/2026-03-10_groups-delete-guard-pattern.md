# Groups Delete Guard + Duplicate Member Protection

**Date**: 2026-03-10
**Context**: Groups page buttons not working — handleDelete had no try/catch, addContact had no duplicate guard

## Pattern 1: Always try/catch optimistic deletes
```typescript
// BAD — if server fails, item vanishes from UI permanently
function handleDelete(id: string) {
  startTransition(async () => {
    await deleteItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  });
}

// GOOD — rollback on failure
function handleDelete(id: string) {
  startTransition(async () => {
    try {
      await deleteItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      setError(safeErrorMessage(e));
    }
  });
}
```

## Pattern 2: Check-before-create for unique constraints
```typescript
// Server action — prevent @@unique crash
const existing = await db.model.findUnique({ where: { compositeKey } });
if (existing) return existing; // idempotent
const created = await db.model.create({ data });
```

## Why
- Optimistic UI without error recovery = data corruption
- Double-click / race condition can trigger unique constraint errors
- Prisma unique constraint errors expose internal details
