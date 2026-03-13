---
pattern: findUniqueOrThrow-crash-cascade
date: 2026-03-13
source: "rrr: smsok-clone"
concepts: [prisma, error-handling, server-components, nextjs, graceful-degradation]
---

# Prefer findUnique over findUniqueOrThrow in Server Components

## Pattern

Prisma's `findUniqueOrThrow` throws an unhandled error when the record doesn't exist. In Next.js server components, this crashes the entire page rendering pipeline — the user sees a 500/error page instead of a graceful fallback.

## Rule

- Use `findUnique` + explicit null check in all server-side data fetching
- Wrap all server component data fetching in try/catch with `<ErrorState>` fallback
- Re-throw Next.js digest errors (notFound, redirect) so framework features still work:
  ```ts
  catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
    return <ErrorState type="SERVER_ERROR" />;
  }
  ```

## Impact

One `findUniqueOrThrow` in `getDashboardStats()` cascaded to crash 4+ pages that called it. 10 pages total were affected due to missing try/catch in server components.

## Anti-pattern

```ts
// BAD — crashes page on missing user
const user = await db.user.findUniqueOrThrow({ where: { id } });
```

```ts
// GOOD — graceful handling
const user = await db.user.findUnique({ where: { id } });
if (!user) throw new ApiError(404, "ไม่พบบัญชีผู้ใช้");
```
