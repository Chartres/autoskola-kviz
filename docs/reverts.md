# Reverts

Pavol's method (2026-11-07): when something goes wrong, revert, clarify the instruction and retry,
rather than patching on top. Every revert gets a row here.

| Date | What was reverted (PR / commit) | What went wrong | Clarified instruction | Retry |
|---|---|---|---|---|
| 2026-11-22 | sweep commit c05c683 (clear the device account record when auth loads with no user) | Offline or on a 5xx auth refresh, `getSession()` returns null for a still-signed-in user, so the effect wiped their own waiting set and running exam | "No user after load" is not proof of sign-out; only a sign-out seen in a running tab may clear an account's set or exam | Not retried; logged for a dedicated session (case: global sign-out elsewhere, then reload) |
