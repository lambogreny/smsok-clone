# Learning: Credentials in Git — Rotation Required After Removal

**Date**: 2026-03-10
**Source**: smsok-clone security incident

## Pattern

When secrets are found tracked in git and removed via `git rm --cached`:
1. The secrets are STILL in git history — anyone with clone access can recover them
2. `git rm --cached` only stops future tracking — it does NOT rewrite history
3. The only safe response: **rotate the credentials immediately**

## Action Required After Discovery

1. `git rm --cached .env` + update .gitignore (done)
2. **Notify Human to rotate ALL exposed credentials** (critical — easy to skip)
3. If public repo: assume credentials are compromised
4. Optional: `git filter-branch` or `bfg-repo-cleaner` to purge history

## Credentials Found This Session

- `SMS_API_PASSWORD=r6h9j6LTv8c6` (EasyThunder)
- `EASYSLIP_API_KEY=1f1069ec-7868-45a0-80c1-1b55f86ccc61`
- `JWT_SECRET=smsok-local-dev-secret-32chars-min`

**→ These should be rotated even if "just dev" credentials.**

## Concepts

`git-security`, `credential-rotation`, `secret-scanning`, `gitignore`
