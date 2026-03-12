# CSV BOM Handling + Server-Side Search Patterns

**Date**: 2026-03-10
**Context**: smsok-clone reviewer fixes (Tasks #84, #89)

## CSV BOM Stripping (Thai Encoding)

Thai CSV exports from Excel/Google Sheets include UTF-8 BOM (`\uFEFF`) as the first character.
This invisible character breaks header detection when parsing CSV.

**Fix pattern** — always strip BOM and normalize line endings before parsing:
```typescript
let text = evt.target?.result as string;
if (!text) return;
text = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
```

**Note**: The export function already adds BOM for compatibility:
```typescript
const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
```

## Server-Side Search for Add-to-Group Dialogs

**Anti-pattern**: Loading all contacts upfront as props (`getContacts(userId, { limit: 100 })`)
- Doesn't scale beyond limit
- Client-side filtering misses contacts beyond the limit

**Better pattern**: Debounced server-side search
```typescript
const [searchedContacts, setSearchedContacts] = useState([]);

useEffect(() => {
  if (!dialogOpen) return;
  const timer = setTimeout(async () => {
    const results = await searchContactsBasic(userId, search, 50);
    setSearchedContacts(results);
  }, search ? 300 : 0); // immediate on open, debounced on type
  return () => clearTimeout(timer);
}, [dialogOpen, search, userId]);
```

**Server action** (lightweight, select only needed fields):
```typescript
export async function searchContactsBasic(userId: string, search: string, limit = 50) {
  return db.contact.findMany({
    where: { userId, ...(search ? { OR: [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ]} : {}) },
    select: { id: true, name: true, phone: true },
    take: limit,
  });
}
```
