# Next.js Standalone Deploy Pitfalls

**Date**: 2026-03-14
**Context**: SMSOK Clone production deployment

## Lesson
Next.js standalone mode has 3 non-obvious deploy requirements that caused production outages:

1. **Static assets not copied**: `output: 'standalone'` doesn't include `.next/static/` — must manually `cp -r .next/static .next/standalone/.next/static` every deploy
2. **Git index ghost files**: Deleted files that remain in git index (`git ls-files --cached`) are picked up by TypeScript's `**/*.ts` glob, causing build failures. Fix: `git rm --cached <file>`
3. **Race conditions in seed scripts**: `findUnique` + `create` pattern races on shared DBs — always use `upsert` for idempotent operations

## Prevention
- Deploy script must automate static copy step
- Pre-commit hook should verify no cached-but-deleted files exist
- Code review should flag findUnique+create patterns → suggest upsert
