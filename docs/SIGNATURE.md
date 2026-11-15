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
| Benjamin Bloom, "Learning for Mastery" — https://en.wikipedia.org/wiki/Mastery_learning | 1968 | Mastery is a threshold, not a grade: a question counts as mastered after two right answers in a row. Readiness is shown per okruh in the exam's own unit, points, against the points the okruh carries (Připravenost, adapted from Zbrojní's readiness card). |
| *Roadcraft*, UK police system of car control and commentary driving — https://en.wikipedia.org/wiki/Roadcraft | 1955 | Not a move yet. Idea for the 202 animated questions: name the hazard before seeing the options. Needs hazard notes per clip. |
| Accursius, *Glossa ordinaria*, the marginal gloss to the Corpus Juris — https://en.wikipedia.org/wiki/Glossa_ordinaria_(Accursius); and the "Průvodce číslem" of the Czech magazine ČILICHILI (2006–2009), a character who comments through an issue | c. 1230; 2006 | Not a move yet. Proposal below: a passenger (spolujezdec) who remarks in the margin of an answer. The law stays in the text; the gloss only reacts. |

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
| **Sady po 20** | An okruh is practised in sets of 20; after each set a results screen gives the score, what was missed, the okruh's answered-question bar, and "Dalších 20" or "Zpět". Questions not yet answered come first. | Bloom (mastery in short units); Montessori (a work you can finish) | `conversion` and `session_finish {set, sets}` per finished set; activation = share of new visitors with a conversion | approved 2026-10-30 (option A) · live with #24 |
| **Stránka otázky** | `/otazka/<id>-<slug>/`: one official question, its answer, why, and the quoted provision, in HTML without JS; with JS it opens a set of 20 starting at that question. `/zkouska-nanecisto/` gives the exam format. | the annotated statute; *ad fontes* | page views of `/otazka/` landings; `start_practice {from:'question-page'}` | approved 2026-10-30 (option 1) · live with #18 |
| **Připravenost** | On Home each okruh tile shows the points it is expected to bring in the exam against what it carries ("7,2 z 12 bodů"), from the learner's own recorded answers; the okruh losing most points is marked "Nejvíc ztrát" once two have an estimate; the total "Odhad u zkoušky: 45 z 50 bodů · potřeba 43" appears once every okruh has ≥ 10 answered questions. Before that: "max. 12 bodů · zatím 3/10 otázek", no bar, no number. | Bloom; adapts Zbrojní's readiness card | `exam_finish {passed}`; pass rate of people who saw ≥ 43 expected | approved 2026-11-03 (option B) · live with #28 |

Status: proposed → approved (dated) → live → or changed / reverted.

### Proposal: Spolujezdec (the gloss in the margin)
**Proposed 2026-11-14. Built on branch `spolujezdec` as a draft, not merged.** Pavol asked to "go with the top passengers and see how it would look"; he has not picked an option. Screenshots: `e2e/shots/spolujezdec-*.png` (390 px).

**It collides with a line in "Refused": "Toy design: … mascots".** A passenger with a face is a mascot by any plain reading. Merging it means changing that line, and that is Pavol's call. What the branch does to stay inside the rest of the list: no confetti, badges or rewards; nothing is pushed or counted; the passenger is off until chosen and can be dismissed with one tap.

What the learner sees:
- On Home, a "Spolujezdec" card: four passengers and "Nikdo" (the default). The chosen one introduces itself in the first person, under a plate set like a sign plate: "Dopravní kužel · Z 1 · příloha č. 10 vyhlášky č. 294/2015 Sb."
- In practice, under "Proč" and the quoted law, one line from the passenger after a mistake, and once at five and at ten right answers in a row. Kužel: "Nic si z toho nedělej. Mě dneska porazili třikrát." Pan Karel: "Hm. Já bych brzdil. Já jsem brzdil."
- On the results of a set, one closing line.

Rules, each held by a test (`src/domain/passenger.test.ts`, `e2e/spolujezdec.journey.spec.ts`):
- The passenger never states a rule of the road: no paragraph signs, speeds, distances or right of way in any line. The explanation from the law does that.
- Silent in the mock exam and on first-aid questions.
- No line addresses the learner in a gendered past tense.
- The nth mistake of a set gets the nth line, so a set does not repeat itself.

The four: Dopravní kužel (gets knocked over, stays on your side), Testovací panák (Hybrid III, has seen worse), Vonný stromeček (hangs there, nothing is urgent), Pan Karel (thirty years an instructor, sighs as praise). The first three use "ty"; Pan Karel uses "vy", as the app does.

**Added 2026-11-15, on Pavol's word the same night** ("the drawings are quite poor… make sure that each character has a large battery of truly funny reactions, not the same one every time"; "i also want the full bold design as discussed rather than the generic ai-typical app"):
- The four passengers are redrawn as layered inline SVG moved by CSS: the cone wobbles when clipped and hops on a good run, the dummy's neck whips while its face stays the same, the tree swings as if the car braked, Pan Karel sighs a small cloud and puts the thermos down. `prefers-reduced-motion` stops all of it.
- Each passenger has 62 lines: 24 for a mistake, and sets for the third mistake in a row, five and ten right in a row, a pass, a fail, a near miss, a clean set and a corrected set. A set of 20 does not repeat a line, and the starting point changes from set to set. The lines were rewritten once on 2026-11-15 after Pavol asked for better ones: each now comes from that passenger's own world (nine years on the D1, technik Luboš, a week in cellophane, Jarmila at home).
- **The bold design.** The branch also re-themes the app: off-white paper, ink frames with hard shadows, sign red, yellow, blue and green, headings in Anton, text in Bitter. Home opens with the number that matters, a cropped "43" on red. This replaces the sand, terracotta and moss palette described under "Visual signature" and in `docs/DESIGN-BRIEF.md`; those two texts are not yet rewritten and wait for his look at the screenshots.

- **Second look, 2026-11-15** ("The contrast solid borders and color palette is still a bit AI-y, there's a math rule to what colors go together. Let's give it more premium and more art/graphics"): the hard ink frames and offset shadows are gone. The palette is now built by rule in OKLCH and written down at the top of `src/index.css`: two complementary inks (vermilion 33°, petrol 213°–233°), paper and mustard on one hue (85°), a fixed lightness ladder so text clears 4.5:1. Headings are Fraunces, text is DM Sans. Home opens on a drawn poster (`src/components/passengers/hero.svg`): the 43 on the horizon, a road, and two passengers living in it. This supersedes the "bold design" bullet above.

- **The leaflet.** The guide (Průvodce) opens with "Příbalová informace": what the app is, set as a medicine leaflet with the exam's own numbers ("účinná dávka 43 bodů"), and a button "Užít první dávku" that starts the daily set. Pavol picked this copy on 2026-11-14.

- **Option A, the gloss as built.** Off by default, practice only. Cost: built; about 250 lines and four small drawings. Risk: the app reads less calm for those who turn it on.
- **Option B, Home and results only.** The passenger introduces itself and closes a set, and says nothing during questions. Cost: remove one prop. Keeps question pages exactly as they are.
- **Option C, not merged.** "Refused: mascots" stands. The branch stays as a record.
- **Recommendation: A**, with the Refused line reworded to what it was guarding against: characters that cheer, reward or pressure. The gloss has a tradition older than the app store, it is the learner's choice, and no other Czech trainer has a voice (competition check of 2026-11-14).
- **Metric if merged:** `key_action {action:'passenger_chosen', passenger}`; share of weekly set completers with a passenger chosen; sets finished per completer with and without one.

### Proposal: Připravenost (Bloom readiness)
**Decided 2026-11-03: Option B. Built in #28.** Kept below as the record of what was shown.
Not built at the time. Screenshots of each option come with the build branch once Pavol has picked one.
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
| 2026-10-30 | Activation: A sets of 20 with results / B daily set first / C no change | **A** — "okruh practice in sets of 20 with a results screen after each" | Shipped in #24. Default taken: questions never answered come first in the queue, so "next 20" moves through the okruh; it applies to any practice selection, not only one okruh. |
| 2026-10-30 | Explanations: automatically after answering / on tap | **automatically** — "automatically" | Confirmed as the current behaviour: "Proč" opens with the answer in practice (`QuestionCard.tsx`, `answered && reveal`), never in the exam. No change. |
| 2026-10-30 | Listings (autotrip.cz, "best autoškola app" round-ups): Pavol sends / skip | **Pavol sends** — "Prep this for me." | Five drafts in `docs/outreach/2026-10-30.md`. Nothing sent. |
| 2026-10-30 | A move approved for one product may be reused by another | **yes** — "Dont just blindly copy the pattern though." | Zbrojní's readiness card is not adopted here; still open. |
| 2026-11-01 | For all quiz apps: 1 every answer counts when given / 2 an unfinished set waits with Pokračovat and Nový trénink / 3 a mock exam left early keeps its answers | **1, 2 and 3, without the half rule** — "For all quiz apps, remember the user's solution to a question even if they dont complete the round. Eg I start, complete 8 out of 12, then start again, I should [not] get another set of the first 8"; then "123 but without the half rule" | Answers already counted in progress on tap; new sets put never-answered questions first, and the daily set's review share stays ≤ 40 %. Added: an okruh or daily set left partway (or lost to a reload) waits on Home as "Rozpracovaná sada" with Pokračovat (same questions, first unanswered one, Oprava chyb included) and Nový trénink (a fresh set of the same kind). Streak and `conversion` only on a finished set; no partial threshold. A mock exam left early keeps its answers and records no attempt or score. Snapshot per device in localStorage (`autoskola-kviz:round:v1`), not synced. |
| 2026-11-03 | Připravenost: A Home line / B per-okruh bars / C after mock exam | **B** — "B: a bar per okruh on Home" (decision page card v6.autoskola-kviz.readiness, 11:49 UTC; relayed by the orchestrating session; no note) | Built in #28. Adopts Zbrojní's readiness card under the 30 Oct reuse rule, fitted to this exam rather than copied: weights from the official composition (pravidla 20, situace 12, zásady 8, předpisy 4, značky 3, podmínky 2, zdravověda 1 = 50, pass 43); estimate = the okruh's share of right answers over its recorded practice answers (Oprava chyb retries are not recorded) × its points, shown to a tenth and rounded down, the total being the sum of the tiles (never rounded up across 43); "Nejvíc ztrát" once two okruhy have an estimate; shown after ≥ 10 answered questions per okruh, total only when all seven have one. It replaces the mastery count on the Home tiles; mastery stays on Postup. |
| 2026-11-15 | Bold design and animated passengers on the same branch | **build it** — "i also want the full bold design as discussed rather than the generic ai-typical app" | On branch `spolujezdec`, draft. Screenshots first, then his word to merge; DESIGN-BRIEF and "Visual signature" get rewritten on merge. |
| 2026-11-14 | Spolujezdec: A the gloss as built / B Home and results only / C not merged | pending | Draft on branch `spolujezdec`. Needs Pavol's word because it is a signature move and it changes a line in "Refused". |
| 2026-11-07 | "After the App" directions (flywheel): sell the result / distribution through submissions / … | **Sell the result: Pursue. Technical submissions: Test first** — "Test this through technical submissions, I am still uneasy posting on social media, but the email to the Met and Danish museum was great because it was in response to their call for sharing." (relayed by the orchestrating session) | Test A built in #31: exam date on the device, then once "Jak dopadla zkouška?" (složil(a) / nesložil(a) / ještě ne) as one event with the readiness bucket. No money or guarantee wording. Stop after 6 weeks if < 30 real results or readiness predicts pass/fail with AUC < 0.7. Test B: research and drafts in `docs/outreach/2026-11-07.md`; stop after 6 weeks if AI search still finds the app in 0 of 14 queries and visitors rose < 20 %. |
