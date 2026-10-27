# Signature — Autoškola kvíz

What this trainer is built on, what it refuses, and the mechanics that follow. Written 27 Oct 2026
for the deep round (flywheel `docs/program/2026-10-27-deep-round.md`). Research first, then design,
then build; statuses are kept current below.

## 1. Lineage

**Erasmus and the humanists — *ad fontes*, "back to the sources" (c. 1500).**
Read the text itself, not the commentary on the commentary. For a driving test the source is
public and short: zákon č. 361/2000 Sb. and vyhláška č. 294/2015 Sb. Most trainers paraphrase it;
nobody shows it. https://en.wikipedia.org/wiki/Ad_fontes
*changes:* every explained answer quotes the sentence of law it rests on, verbatim, with paragraph,
letter or sign number and a link to the consolidated text. A test fails the build if a quote is not
in the law.

**Jan Amos Komenský — *Orbis sensualium pictus* (1658) and *Didactica magna* (1657).**
The picture with its word, numbered, so the thing and its name are learnt together; from the known to
the unknown. A road sign is exactly that: a picture with an official number and name in an annex.
https://en.wikipedia.org/wiki/Orbis_Pictus · https://en.wikipedia.org/wiki/Didactica_magna
*changes:* after a sign question the learner sees the sign's number and official name from the annex
of vyhláška 294/2015 Sb. ("A 1a — Zatáčka vpravo") next to its meaning, instead of a bare "správně".

**Maria Montessori — control of error and the three-period lesson (*The Montessori Method*, 1912).**
The material itself shows the mistake; the learner corrects it without a judge. One difficulty at a
time; name it, recognise it, recall it. https://en.wikipedia.org/wiki/Montessori_education
*changes:* a question answered wrong comes back at the end of the same set, after the explanation,
until it is answered right. No red cross counter, no penalty — the set simply isn't finished while
an error stands.

**Roediger & Karpicke — the testing effect (Psychological Science 17(3), 2006); Ebbinghaus — spacing
(*Über das Gedächtnis*, 1885).** Retrieval strengthens memory more than rereading; spaced retrieval
more than massed. https://doi.org/10.1111/j.1467-9280.2006.01693.x ·
https://en.wikipedia.org/wiki/Spacing_effect
*changes:* the second attempt above is a retrieval, not a reread (the options are shown again, the
explanation is not); the daily set already spaces review of weak questions.

**Benjamin Bloom — mastery learning ("Learning for Mastery", 1968; the 2 sigma problem, 1984).**
Move on when a unit is mastered, not when time is up; mastery is a threshold, not a grade.
https://en.wikipedia.org/wiki/Mastery_learning
*changes:* a question counts as mastered only after two correct answers in a row; readiness for the
exam is shown per okruh against the points that okruh carries in the real test (situace weigh 4).

***Roadcraft* — the UK police system of car control (1955) and commentary driving.**
Information, position, speed, gear, acceleration; the driver says aloud what they see and what they
will do. https://en.wikipedia.org/wiki/Roadcraft
*changes (proposed):* for the 202 animated situations, a "what do you see" step before the options —
the learner names the hazard first. Needs hazard annotations per clip; not built this round.

## 2. Refused

- Toy gamification: confetti, mascots, cartoon emoji, badges for their own sake, leaderboards.
- Streak anxiety: the streak is shown, never threatened; no "you'll lose it" notifications.
- Caps, paywalls, ads, "premium explanations". Everything is free, including the explanations.
- Paraphrase passed off as law. Where no paragraph says it (zásady bezpečné jízdy, first aid) the
  explanation says so and cites nothing.
- The generic AI-app look (purple gradients, blobs, "✨"). The app stays in its sand/terra/moss print
  palette.
- Engagement bought at the cost of learning: no infinite feed of questions without review.

## 3. Signature mechanics

| # | Mechanic | What the learner sees | From | How we'll know (event · number) | Status |
|---|---|---|---|---|---|
| 1 | **Ze zákona** (ad fontes) | After answering: one or two plain sentences on why, then the quoted sentence of law with "§ 22 odst. 1 zákona č. 361/2000 Sb." linking to the text | Erasmus, *ad fontes* | `key_action {action:'source_opened'}` per explained answer; target ≥ 15 % of answered questions in week 1 | shipped |
| 2 | **Obraz a jméno** (picture and word) | Sign questions show the sign's number and official name from the annex of vyhláška 294/2015 Sb. | Komenský, *Orbis Pictus* | share of sign questions answered right on second sight (progress stats) | shipped (plates checked against each picture) |
| 3 | **Kontrola chyby** (control of error) | Wrong answers return at the end of the set until right; the set ends when no error stands | Montessori; Roediger & Karpicke | `key_action {action:'errors_corrected', count}` on results; share of sets with misses that reach results ≥ 80 % | shipped |
| 4 | **Připravenost** (mastery readiness) | Expected exam points per okruh vs the 43 needed, from mastered questions | Bloom | `conversion` on exam with `passed`; pass rate of users who saw ≥ 43 expected | proposed |

## 4. Visual signature

The statute book, not the app store. Citations are set like the Sbírka zákonů: the reference in small
caps mono (§ 22 odst. 1), the quoted sentence in the body serif with a hairline rule on the left, no
box or card chrome. Sign questions follow the *Orbis Pictus* plate: the picture, a number beside it,
the name under it. Everything stays inside `docs/standards/taste.md` and `mobile-ux.md` (44 px targets,
text ≥ 16 px, contrast ≥ 4.5:1, no layout shift when an explanation opens).

## 5. Founder lens

- **Art. VIII** (never lie, cheat or trick): an explanation that cites law is checked against the law
  by a test; where we have no source we say so. No fake reviews, no invented pass rates, no dark
  patterns, no paid unlock of the truth about an answer.
- **Art. VI** (the moat is distribution, reputation, frozen judgment; nothing is finished until it
  reaches the people it's for): the explained questions are public, prerendered pages that search
  engines and AI assistants can read and cite. The verified corpus is frozen judgment that compounds
  with each Věstník release.
- **Art. II** (the products must not cost his presence): the corpus is rebuilt by a script and checked
  in CI; a new bank release is an extractor run and a test, not an evening.

Differentiation that follows: the only Czech trainer where every answer can be traced to its sentence
of law, free and readable by anyone — learner, instructor or assistant.
