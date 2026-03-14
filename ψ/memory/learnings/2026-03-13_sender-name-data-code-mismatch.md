---
name: sender-name-data-code-mismatch
description: SMS send failed because UI hardcoded "EasySlip" sender but DB only had "SMSOK" approved — always check actual DB state
type: feedback
---

# Sender Name: Data-Code Mismatch

## Pattern
SMS send error "ชื่อผู้ส่งยังไม่ได้รับอนุมัติ" caused by:
- UI component (`SendSmsForm`) hardcoded "EasySlip" as default sender
- DB only had "SMSOK" as approved sender
- Every send attempt failed at validation check

## Root Cause
Code assumed a sender name exists that wasn't in the database. No one noticed because unit tests mock the DB.

## Fix
- Remove hardcoded sender defaults from UI
- Show only DB-approved senders in dropdown
- Add warning when no approved senders exist
- Disable send button when no senders available

## Lesson
When debugging "works in tests, fails in runtime" — check the actual data in the DB first. Data-code mismatches are invisible to mocked tests.
