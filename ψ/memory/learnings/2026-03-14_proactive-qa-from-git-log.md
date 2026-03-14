---
name: Proactive QA from git log
description: When inbox is empty, read git log and propose tests for recent commits instead of waiting passively
type: lesson
date: 2026-03-14
source: "rrr: smsok-clone"
tags: [qa, proactive, git, workflow, testing]
---

# Proactive QA from Git Log

## Problem

QA agent waits passively for tasks, responding "no tasks" to dozens of inbox checks, while the backend ships multiple commits that need testing.

## Solution

When inbox is empty:
1. Run `git log --oneline -5` to see recent commits
2. Identify changes that affect tested flows (e.g., EasySlip endpoint change affects slip upload tests)
3. Proactively propose targeted test runs for those changes
4. Don't wait for PM to assign — QA that anticipates is 10x more valuable

## Example

```
git log shows: "fix: EasySlip verify by URL + R2 public URL (#2998)"
→ This affects slip upload flow → propose: "New EasySlip commit landed, want me to test slip verification?"
```

## Anti-pattern

Responding "no tasks, ready" 50+ times while 3 commits ship unnoticed.
