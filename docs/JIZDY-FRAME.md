# Jízdy — Feature Frame

> Feature of autoskola-kviz (autoskola.dravec.org). Read before building.

## Who desperately needs this

Czech driving-licence candidates who have passed (or are close to passing) the theory exam and
are now working through mandatory practical lessons. Czech law requires a minimum number of
practical jízdní hodiny with a licensed instructor before the practical exam. Instructors track
their own logbook; the candidate has no self-owned record of which skills have been covered, how
many times, and which are still weak.

The same person who spent weeks in autoskola-kviz drilling theory faces this next — immediately
after the theory-exam gate. The product already has them at peak engagement.

## Evidence

- **Audience overlap is verified**: every theory-exam user takes a practical exam. The same
  cohort, sequential phases. autoskola.dravec.org is live and has users.
- **Cross-promo is structural**: a Jízdy tab inside the existing app costs zero distribution —
  the CTA lives inside the product the user is already in.
- **Gap confirmed**: no free, non-ugly Czech driving-lesson tracker exists for candidates.
  Autoškoly use paper logbooks; apps like iŘidič focus on GPS logging, not skill mastery
  tracking against the official practical exam checklist.
- **Data model is user-entered**: no external API to spike. The only data risk is the official
  skill list (see Risks below).

**Risk / open question**: The official Czech practical-exam skill checklist is defined in
Vyhláška MD 167/2002 Sb. (or its amended successor). This list must be verified from the
official source before Stage 3. If the list exceeds ~30 items, seed with the most-tested
skills and allow user-added custom items. Mitigation: skill list is a data file
(`data/jizdy-skills.json`), not hardcoded — it can be updated without a code change. Pavol
confirms the source before Stage 3 begins.

## The ONE primary journey

> Open Jízdy → log today's lesson (date + duration + skills practiced) → see which skills
> still need more work → feel confident I am ready for the practical exam.

Secondary hook (not a separate journey): HomeScreen shows a Jízdy CTA when theory mastery
reaches ~70% ("Teorie zvládnutá? Přejdi na jízdy →"). Cross-promo is structural, not a
pop-up.

## Kill criteria

Statement: <15% of weekly active users open Jízdy, OR <30% of Jízdy triers log a 2nd lesson,
by 4 weeks post-launch → remove the tab, archive the feature.
(Rates are among-exposed: denominator is weekly active users for the first criterion,
Jízdy openers for the second. Absolute volume alone is not the gate.)
Deadline: 2026-09-28 (4 weeks after target launch 2026-08-31)
Locked: true

North star: % of Jízdy users who log ≥5 lessons (signal they used it through a real lesson
block, not just clicked once).

## Out of scope

- Instructor management, scheduling, or booking.
- GPS tracking or route recording.
- Video or dashcam analysis.
- Driving school (autoškola) integration or instructor-side view.
- Automated readiness gate ("you may book the exam now") — visual signal only, not a blocker.
- Payments or premium gating — feature is free.
- Multiple vehicle categories (B only; A/C/D are later if the kill criteria pass).
