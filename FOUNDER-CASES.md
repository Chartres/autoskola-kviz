# Founder cases — real situations with known answers

Every sweep and release candidate checks these. Drafted 2026-10-21 from the repo's history; none is confirmed yet. A row becomes binding (and gets a CI check) when Pavol marks it confirmed. A case changes only with a written reason.

Commit SHAs are the pre-squash commits on the PR branches (#7, #8 and #11 were squash-merged into main as b4af487, 5b76f4f and 69c1be4); open the PR to find them.

| # | Situation | Known right answer | Source | Confirmed |
|---|---|---|---|---|
| 1 | Mock exam (skupina B) is built and graded | 25 questions (10×2 pravidla, 3×1 značky, 3×4 situace, 4×2 zásady, 2×1 podmínky, 2×2 předpisy, 1×1 zdravověda) = 50 points, 30 minutes; 43 points passes, 42 fails | data/README.md "Exam model", data/meta.json `exam` (source: MD ČR eTesty, etesty.md.gov.cz); test commit ed5488e, PR #7 | no |
| 2 | Streak is 10 with the last lesson yesterday; the user finishes a lesson today on another device and the two progress records merge | Merged streak is 11, not 1 | commit a69b586, PR #11 (C3-3); src/domain/progress.test.ts "extends the earlier streak…" | no |
| 3 | Two signed-in devices: device A answers questions, then device B's debounced save runs | Cloud row keeps A's newer answers and B's; every write is fetch → merge → save | commit 8b11f7e, PR #11 (C3-1) | no |
| 4 | Two tabs open; the stale tab saves after the other tab recorded answers or a Jízdy lesson | The other tab's answers and lessons survive (storage listener merges) | commit 96b2fde, PR #11 (C3-2) | no |
| 5 | User signs out while the cloud flush fails (5xx or RLS) or the sign-in sync is still running | Local progress is not wiped; it merges into the next sign-in. Sign-out finishes within ~3 s even if the flush hangs | PR #8 (tests "keeps local progress on sign-out when the flush save fails", "signs out after ~3 s…") | no |
| 6 | Returning user logs a Jízdy lesson while signed out, then signs in, then signs out and in again | The lesson is in the log after each sign-in (anonymous `jizdy-v1` merged into `jizdy-v1:<uid>`, deduped by lesson id) | PR #7, commit 4c73f8c | no |
| 7 | Exam timer runs out with questions still unanswered | Results review lists the unanswered questions alongside the wrong ones | commit bc0cc9f, PR #11 (C5-3) | no |
| 8 | User answers one of the 23 picture-answer questions wrong and opens the review | Review shows the correct answer's image, not a blank | commit 3656716, PR #11 (C2-3) | no |
| 9 | User searched in Procvičování, then taps an okruh tile on Home | The full okruh opens; the old search is cleared (no silent subset or empty set) | commit 6a9d5be, PR #11 (C1-2) | no |
| 10 | App open and Home okruh start fire analytics (`app_open`, `start_topic`) | `app_open` counts as `page_view` in the portfolio KPI pull, and a `start_topic` insert is accepted by Supabase. Open defect: flywheel data/products/autoskola-kviz.json has no `kpi_event_map`, and the RLS allowlist in flywheel scripts/sql/common-platform.sql:60-61 lacks `start_topic` | flywheel docs/research/pmo-2026-10-17/options-synthesis.json (measurement defects); src/app/AppContext.tsx:115, src/components/screens/HomeScreen.tsx:30 | no |
