# Design brief — Autoškola kvíz

The zbrojni-kviz pattern, **but even better**. Same proven engine (question bank →
practice/daily set/exam sim → mastery + spaced repetition), tuned for the Czech
driving-licence theory exam and a younger, broader audience.

## Learning design

**Montessori first:**

- **Free topic choice from day 1.** All seven okruhy are open tiles on the home
  screen — no locked linear path, no "complete unit 3 to unlock signs". The
  learner directs their own work.
- **Mastery per okruh, not grades.** Progress is shown as mastered/total per
  okruh (a question counts as mastered after two consecutive correct answers).
  No percentages-as-judgement, no red F.
- **Self-correction (control of error).** Every answer gets immediate feedback
  with the correct answer shown in place; wrong answers are learning moments —
  they quietly re-enter the queue via spaced repetition ("Opakovat chyby"),
  never a punishment.

**Light Duolingo (the good parts only):**

- Streak counter (days in a row).
- Short daily set ("Denní dávka", ~10 questions), always finishable.
- Immediate per-question feedback.
- Gentle progress path: home shows a calm summary, details live under Postup.

**Explicitly NO dark patterns:**

- No ads. No hearts/lives/energy. No guilt notifications. No paywall.
- No countdown pressure outside the exam simulation (where the real exam has one).

## Visual identity

Its own — **not** zbrojni's dark gunmetal. Bright, calm, Montessori-warm:

- Warm paper background (`#faf6ee` family), ink text, soft 14px corners.
- One terracotta accent for primary actions and the streak; muted moss green for
  "correct", calm rust for "wrong" (feedback, not alarm).
- Nunito (rounded, friendly, latin-ext for diacritics) + IBM Plex Mono for numbers.
- Invariants per `flywheel/docs/standards/taste.md`: WCAG-AA contrast, visible
  keyboard focus, real landmarks, works at 375px, no cookie banner.

Tokens live in `src/index.css`. The sand scale is semantic (950 = page surface,
50 = strongest ink) so the whole component tree stays contrast-correct.

## Exam facts (for the real bank, a later task)

Official test: 25 questions from 7 okruhy, 30 minutes, point-weighted
(50 max, pass at **43 points** — questions are worth 1/2/4 points).
Current engine scores by count (ponytail: switch to point weighting with the
real bank). Official questions: Ministerstvo dopravy ČR, etesty2.mdcr.cz.
Many questions carry a traffic-sign/situation image — the schema's `image`
field and `<img loading="lazy">` rendering are already in place.
