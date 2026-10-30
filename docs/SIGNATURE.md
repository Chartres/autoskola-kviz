# Autoškola kvíz — signature
The part of Autoškola kvíz that could only have come from Pavol. Nothing in "Signature moves" is built before Pavol has picked it.

The three live moves below shipped in #17 on 27 Oct 2026, before that rule existed. Pavol reviewed them on 30 Oct 2026 and kept all three.

## Lineage
| Source | Year | changes: |
|---|---|---|
| Erasmus and the humanists, *ad fontes* ("back to the sources") — https://en.wikipedia.org/wiki/Ad_fontes | c. 1500 | Every explained answer quotes the sentence of law it rests on, verbatim, with paragraph or sign number and a link to the consolidated text (zákon 361/2000, vyhláška 294/2015, zákon 56/2001, zákon 247/2000). A test fails the build if a quote is not in the law. |
| Jan Amos Komenský, *Orbis sensualium pictus* — https://en.wikipedia.org/wiki/Orbis_Pictus | 1658 | The picture with its number and name, learnt together: after a sign question the learner sees the sign's number and official name from the annex of vyhláška 294/2015 ("A 2b — Dvojitá zatáčka, první vlevo"). |
| Maria Montessori, control of error, *The Montessori Method* — https://en.wikipedia.org/wiki/Montessori_education | 1912 | The material shows the mistake and the learner corrects it without a judge: a missed question comes back at the end of the set until it is answered right. No penalty, no red counter. |
| Roediger & Karpicke, the testing effect, *Psychological Science* 17(3) — https://doi.org/10.1111/j.1467-9280.2006.01693.x; Ebbinghaus, spacing (1885) | 2006 | The second attempt is a retrieval, not a reread: the options come back, the explanation doesn't. The daily set spaces review of weak questions. |
| Benjamin Bloom, "Learning for Mastery" — https://en.wikipedia.org/wiki/Mastery_learning | 1968 | Mastery is a threshold, not a grade: a question counts as mastered after two right answers in a row. Proposed: readiness shown per okruh against the points it carries in the real exam. |
| *Roadcraft*, UK police system of car control and commentary driving — https://en.wikipedia.org/wiki/Roadcraft | 1955 | Not a move yet. Idea for the 202 animated questions: name the hazard before seeing the options. Needs hazard notes per clip. |

## Refused
- Toy design: confetti, mascots, cartoon emoji, badges for their own sake, leaderboards.
- Streak anxiety: the streak is shown, never threatened; no "you'll lose it" notifications.
- Dark patterns: caps, paywalls, ads, "premium explanations", fake urgency. Everything is free, explanations included.
- Paraphrase passed off as law. Where no paragraph says it (zásady bezpečné jízdy, first aid), the explanation says so and cites nothing (164 of 1136).
- The generic AI-app look: purple gradients, blobs, "✨". The app stays in its sand/terra/moss print palette.
- Engagement bought with learning: no endless feed of questions without review.

## Signature moves
| Move | What the user sees | From | Metric (event in kpi_event_map) | Status |
|---|---|---|---|---|
| **Ze zákona** | After answering in practice: one or two plain sentences on why, then the quoted sentence of law with "§ 54 odst. 3 zákona č. 361/2000 Sb." linking to the text. Never in the exam. | Erasmus, *ad fontes* | `key_action {action:'source_opened'}` per explained answer; target ≥ 15 % of answered questions | approved 2026-10-30 (keep) · live since #17 |
| **Obraz a jméno** | Under a sign picture: the sign's number and official name from the annex of vyhláška 294/2015 (144 plates; per #17, 27 ambiguous sign pictures get none) | Komenský, *Orbis Pictus* | no event yet; share of sign questions right on second sight (progress stats) | approved 2026-10-30 (keep) · live since #17 |
| **Kontrola chyby** | Missed questions return at the end of the set, labelled "Oprava chyb", until right; results keep the first-attempt score and say how many errors were put right | Montessori; Roediger & Karpicke | `key_action {action:'errors_corrected', count}`; share of sets with misses that reach results ≥ 80 % | approved 2026-10-30 (keep) · live since #17 |
| **Sady po 20** | An okruh is practised in sets of 20; after each set a results screen gives the score, what was missed, the okruh's answered-question bar, and "Dalších 20" or "Zpět". Questions not yet answered come first. | Bloom (mastery in short units); Montessori (a work you can finish) | `conversion` and `session_finish {set, sets}` per finished set; activation = share of new visitors with a conversion | approved 2026-10-30 (option A) · live with #23 |
| **Stránka otázky** | `/otazka/<id>-<slug>/`: one official question, its answer, why, and the quoted provision, in HTML without JS; with JS it opens a set of 20 starting at that question. `/zkouska-nanecisto/` gives the exam format. | the annotated statute; *ad fontes* | page views of `/otazka/` landings; `start_practice {from:'question-page'}` | approved 2026-10-30 (option 1) · live with #18 |
| **Připravenost** | Expected exam points per okruh against the 43 needed, from mastered questions | Bloom | `exam_finish {passed}`; pass rate of people who saw ≥ 43 expected | proposed |

Status: proposed → approved (dated) → live → or changed / reverted.

### Proposal: Připravenost (Bloom readiness)
Not built. Screenshots of each option come with the build branch once Pavol has picked one.
- **Option A, one line on Home.** "Odhad u zkoušky: 38 z 50 bodů (potřeba 43)", computed from mastered questions weighted by each okruh's exam points. Cost: about half a day; no new screen.
- **Option B, per-okruh bars on Home.** One bar per okruh, each showing expected points against that okruh's maximum (situace 12, pravidla 20, …), so the learner sees where the missing points are. Cost: about a day. It replaces the current mastery percentages.
- **Option C, after each mock exam only.** Results show expected points next to the score. Nothing changes on Home. Cost: about half a day.
- **Recommendation: B.** It answers the question learners actually ask ("am I ready, and where am I short?") in the exam's own unit, points. The current per-okruh percentage treats 35 first-aid questions worth 1 point the same as 154 situations worth 4 points each.

### Proposal: question pages (from #18)
**Decided 2026-10-30: Option 1, with the guide page. Shipped in #18.** Kept below as the record of what was shown. Screenshots in `docs/review/2026-10-28/`.
- **Option 1, a page per question, as on Zbrojní** (837 such pages live on zbrojnikviz.dravec.org). `/otazka/<id>-<slug>/` shows the question, its picture with the sign plate, the official answer marked, why, and the quoted provision with a link. The page is real HTML without JavaScript, with QAPage JSON-LD. Okruh pages list their questions, and each page links to the previous and next. With JavaScript, the page opens practice of its okruh on that question. Shots: `opt1-question-page-*.png`, `opt1-question-page-sign-*.png`, `opt1-question-page-with-js-*.png`, `opt1-topic-page-list-*.png`. Cost: about 16 MB more per deploy (1136 pages of about 14 KB), and 1136 URLs to keep right; the explanation tests already guard the content.
- **Option 2, okruh pages with every question inline.** The same content, all on the 7 okruh pages. Shots: `opt2-topic-inline-mock-*.png` (a mock). Cost: a 600 KB page for Dopravní značky (222 questions), long scrolling on a phone, and no URL that answers exactly one question.
- **Option 3, neither.** The okruh pages stay as they are. Shots: `opt3-topic-page-live-*.png`. Cost: nothing to build. The AIO baseline stays at 0 of 14 queries.
- **The tradition it draws on:** the annotated statute (komentované vydání zákona: one provision, then its commentary) and *ad fontes*. One question, one answer, one source.
- **Recommendation: Option 1.** People and assistants search the question's own wording. A page that answers exactly that question and quotes its source is what gets cited, and Zbrojní already runs this pattern. One change before merge: a visitor arriving with JavaScript lands in "01 / 444" of a whole okruh. A short set starting at that question would serve them better; see the activation decision in the 2026-10-28 review.
- **Also on #18: `/zkouska-nanecisto/`**, a mock-exam guide page with the real format (25 questions, 30 minutes, 43/50, points per okruh) and FAQPage JSON-LD. With JavaScript it opens the timed exam. Shots: `exam-guide-page-*.png`. Recommendation: ship it with Option 1.

## Visual signature
The statute book, not the app store. Citations are set like the Sbírka zákonů: the reference in small mono (§ 22 odst. 1), the quoted sentence in italic body type with a hairline rule on the left, no card chrome. Sign questions follow the *Orbis Pictus* plate: the picture, its number, its name under it. Everything stays inside the hub's `taste.md` and `mobile-ux.md` (44 px targets, text ≥ 16 px, contrast ≥ 4.5:1, no layout shift when an explanation opens).

## Founder lens
Constitution articles that bind it: II, VI, VIII.

## Decision log
| Date | Options shown | Pavol chose | Note |
|---|---|---|---|
| 2026-10-27 | — | — | Ze zákona, Obraz a jméno, Kontrola chyby shipped in #17 before rule 10; review pending |
| 2026-10-28 | Question pages: 1 per question / okruh inline / neither | see 2026-10-30 | #18 merge-ready as a draft; recommendation Option 1 |
| 2026-10-28 | Připravenost: A Home line / B per-okruh bars / C after mock exam | pending | recommendation B; still open on the decision page, not built |
| 2026-10-30 | Question pages: 1 per question / okruh inline / neither | **1** — "a page per question, as Zbrojní built them (answer + quoted provision, no JS needed, linked from okruh pages)" | Shipped in #18 after code-review (high). Two changes from Zbrojní, per his "Dont just blindly copy the pattern though": FAQPage instead of QAPage (QAPage is for user-answered forums), and the guide page no longer starts a timer on load. |
| 2026-10-30 | Mock-exam guide /zkouska-nanecisto/: with the question pages / alone / drop | **with the question pages** — "ship with the question pages" | Shipped in #18. With JS it opens the Procvičovat tab, whose first button is the timed test. |
| 2026-10-30 | Ze zákona: keep / change / revert | **keep** | — |
| 2026-10-30 | Obraz a jméno: keep / change / revert | **keep** | — |
| 2026-10-30 | Kontrola chyby: keep / change / revert | **keep** | — |
| 2026-10-30 | Activation: A sets of 20 with results / B daily set first / C no change | **A** — "okruh practice in sets of 20 with a results screen after each" | Shipped in #23. Default taken: questions never answered come first in the queue, so "next 20" moves through the okruh; it applies to any practice selection, not only one okruh. |
| 2026-10-30 | Explanations: automatically after answering / on tap | **automatically** — "automatically" | Confirmed as the current behaviour: "Proč" opens with the answer in practice (`QuestionCard.tsx`, `answered && reveal`), never in the exam. No change. |
| 2026-10-30 | Listings (autotrip.cz, "best autoškola app" round-ups): Pavol sends / skip | **Pavol sends** — "Prep this for me." | Five drafts in `docs/outreach/2026-10-30.md`. Nothing sent. |
| 2026-10-30 | A move approved for one product may be reused by another | **yes** — "Dont just blindly copy the pattern though." | Zbrojní's readiness card is not adopted here; still open. |
