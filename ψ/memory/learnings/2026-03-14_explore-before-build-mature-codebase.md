---
date: 2026-03-14
context: SMSOK sprint — 6 tasks, 3 already implemented
---

# Explore Before Build in Mature Codebases

In a mature project with 100+ files, 40-50% of "new feature" tasks may describe functionality that already exists. The task queue doesn't distinguish between greenfield and verification work.

**Pattern**: Before writing any code for a new task, spend 2-3 minutes with an Explore agent to:
1. Search for existing files matching the feature name
2. Check API routes that would support the feature
3. Read any existing components in the target directory

**Evidence**: In this session, 3/6 tasks (#3406 PDPA, #3433 Billing, parts of #3453 Error Pages) were already fully implemented. Exploration saved duplicating ~3000+ lines of existing code.

**Corollary**: Check for unused Zustand stores — architecture-first teams often scaffold state management before UI components exist. The `campaign-wizard-store.ts` was fully functional but had zero UI consumers until this session.

**Anti-pattern**: Starting to write a component immediately upon receiving a task spec, without checking if the feature already exists elsewhere in the codebase.
