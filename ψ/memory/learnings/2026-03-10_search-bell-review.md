# Lesson Learned

When a feature introduces a new entry point into an existing data view, review the search semantics end-to-end, not just the trigger. In `smsok-clone`, the shell search introduced in commit `362fb16` routes to the messages page, but the server query in `getMessages()` searches only `recipient` and `content`, while the client-side filter also searches `senderName`. That mismatch creates a user-visible false negative: sender-name searches can fail from the shell even though the messages page UI implies that sender names are searchable. The lesson is simple: shared behaviors like search, filtering, and authorization boundaries should have one source of truth, or they will drift.

Concepts: code-review, search-semantics, server-client-drift, notification-auth, smsok-clone
Source: rrr: smsok-clone
