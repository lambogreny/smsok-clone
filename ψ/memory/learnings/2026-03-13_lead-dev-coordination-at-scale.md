---
name: Lead Dev Coordination at Scale
description: Lessons from coordinating 5+ agents under P0 pressure — R2 debugging, agent lifecycle, commit discipline
type: learning
---

## Pattern: Infrastructure vs Code Debugging

When upload/API calls fail with 403/401, check infrastructure first (credentials, permissions, tokens) before assuming code bugs. In this session, R2 slip upload 500 was caused by Cloudflare API token missing write permission — no code change could fix it.

## Pattern: Feature-Separated Commits

Even under P0 pressure, separate commits by feature (R2 migration, Redis rate limit, security fixes, test infra, frontend, dependencies). Takes 5 extra minutes but makes git history readable and enables targeted reverts.

## Pattern: Agent Lifecycle Management

- Monitor agent context % proactively — restart at 25-30% before crash
- Permission prompts are the #1 blocker for team agents — approve aggressively
- Idle agents need explicit "inbox" kicks to resume work
- /clear + inbox is the restart pattern (not /rrr which may not be available)

## Pattern: Task Queue Hygiene

Close superseded tasks immediately when priorities change. Multiple sources (PM, lead-dev) creating similar tasks causes queue pollution. One authoritative task per objective.
