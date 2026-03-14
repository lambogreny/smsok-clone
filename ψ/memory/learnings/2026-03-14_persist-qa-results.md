---
name: Persist QA results across sessions
description: Save test results to file so they survive session resets and avoid re-reporting completed work
type: lesson
date: 2026-03-14
source: "rrr: smsok-clone"
tags: [qa, session-management, persistence, workflow]
---

# Persist QA Results Across Sessions

## Problem

QA task results are lost when Claude Code sessions reset. This causes:
- Re-reporting the same completed tasks 4+ times
- User/orchestration system asserting tasks are "pending" when they're done
- Wasted context window on redundant status checks

## Solution

After completing a QA task, write results to a persistent file:

```bash
# Example: qa-results.json
{
  "2773": { "status": "done", "result": "5/7 PASS", "date": "2026-03-14" },
  "2919": { "status": "done", "result": "91/93 PASS", "date": "2026-03-14" }
}
```

On "inbox" check, read this file first before declaring "no tasks."

## Also Learned

- Proactively ask PM for next priorities instead of passively waiting after all tasks complete
- Cache E2E results for <5 min if no code changes — don't re-run unnecessarily
