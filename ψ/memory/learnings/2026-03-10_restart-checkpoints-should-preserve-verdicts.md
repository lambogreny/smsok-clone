# Lesson Learned

When a session looks like it may restart, the right use of `/rrr` is to preserve verdicts, not to restate everything. In a fast-moving repo like `smsok-clone`, the durable facts are the latest commit hash, the commits that are still blocked, and the exact behavioral reasons they are blocked. Saving those three things prevents review drift after restart and lets the next session resume with real continuity instead of rebuilding context from scratch.
