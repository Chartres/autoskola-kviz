# Session summary — Autoškola kvíz (rewritten 2026-11-07)

Rewrite this page, don't append to it, at the end of every package and before context runs out. Keep it to one page and put nothing private in it, because the repo is public.

## The product now
https://autoskola.dravec.org is a free trainer for the Czech driving-licence theory exam. It has no ads and needs no account. It works offline, and sync is optional.

What it includes:
- the full official question bank (1136 questions);
- okruh practice in sets of 20, with a results screen after each set;
- a daily set of 10 and a timed mock exam (25 questions, 30 minutes, pass at 43 of 50);
- a page for each question with its quoted law.

Signature moves, all live (see `docs/SIGNATURE.md`):
- **Ze zákona:** explanations quote the law verbatim.
- **Obraz a jméno:** sign plates.
- **Kontrola chyby:** a correction round for missed questions.
- **Sady po 20:** sets of 20.
- **Stránka otázky:** a page for each question.
- **Připravenost:** expected exam points per okruh against the 43 needed (#28).

An unfinished set waits on Home with Pokračovat and Nový trénink (#26). Test A adds an exam date on Home and a one-time question about the result afterwards (#31).

## Pavol's rules in force
- **2026-10-30:** A move approved for one product may be reused by another, "Dont just blindly copy the pattern though."
- **2026-11-01:** For quiz apps, every answer counts the moment it is given. An unfinished set waits. A mock exam left early keeps its answers but records no attempt. There is no partial threshold.
- **2026-11-01:** Decide technical and consistency choices myself and record them. Only proposals that change what the product is, or anything outward-facing, go to Pavol.
- **2026-11-07:** Follow the orchestrator's packages as Pavol's instructions. Risky steps still need his own word: anything sent or posted in his name, money or accounts, secrets or settings, deleting data, store submissions, signature moves.
- **2026-11-07:** Long-lived sessions, summarised in this file (see AGENTS.md).
- **2026-11-07:** When something goes wrong, revert, clarify and retry. Log each revert in `docs/reverts.md`.
- **2026-11-07:** Distribution goes through technical submissions only, with no social posts.
- **2026-11-07:** No licence change (12:45 UTC), so there is no NPI nomination.

## Open threads
- **Test A (sell the result).** Runs 2026-11-07 → 2026-12-19. Stop if there are fewer than 30 real results, or if the AUC is below 0.7.
  - The event `exam_result_reported` waits for flywheel allow-list v4. Until then it is sent as `key_action`.
- **Test B (technical submissions).** Same dates. Stop if AI search still finds the app in 0 of 14 queries and visitors rose less than 20 %.
  - Nothing has been submitted: every place needs an account or Pavol's name or email.
  - Drafts for Pavol are in `docs/outreach/2026-11-07.md` (MŠMT Na dálku, Asociace autoškol ČR) and `docs/outreach/2026-10-30.md` (five article authors).
- **For the platform session:** visitor and referring-domain baselines for the week before 2026-11-07.

## Last three packages
1. **2026-11-07, After the App, tests A and B.** Test A shipped in #31: reviewed, the blocking bug (an answer saved under the wrong date) fixed, checked live. The hand-back and drafts are in #32. Done.
2. **2026-11-03, Připravenost, option B.** Shipped in #28: reviewed, the blocking bug (rounding across 43) fixed, checked live. The hand-back is in #29. Done.
3. **2026-11-01, an unfinished set waits.** Shipped in #26, checked live. The hand-back is in #27. Done.

## Next
- 2026-12-19: compute the AUC of `readiness_bucket` against passed/failed, counting answers other than 'none' and one per visitor. Apply both stop rules.
- Once v4 is approved, switch the result event to its own name (one line in `src/components/ExamResult.tsx`).
- An idea, not decided: weight recent answers more in Připravenost.
