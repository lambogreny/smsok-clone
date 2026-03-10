# Lesson: Grep Entire Codebase When Removing UI Labels

**Date**: 2026-03-10
**Context**: Human ordered "remove Beta from entire codebase" — found it in CampaignsClient + old .next_backup build artifacts

## Pattern
When removing a UI label (Beta, Alpha, Preview, etc.) from a product:
1. Grep case-insensitive across ALL file types: `[Bb]eta`
2. Check source code files (`.tsx`, `.ts`, `.jsx`, `.css`)
3. Check build artifacts (`.next/`, `dist/`, `build/`) — these regenerate but confirm scope
4. Check config files (`package.json` descriptions, `manifest.json`, meta tags)
5. After removal, re-grep to verify 0 matches in source

## Anti-pattern
Only checking the file you remember adding it to. Labels propagate — other devs may have added Beta badges to related pages, tooltips, or meta descriptions.
