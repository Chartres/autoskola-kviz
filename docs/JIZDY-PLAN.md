# Jízdy — Stage Plan

For builders. Read `docs/JIZDY-FRAME.md` first.

Protocol: one stage per session. After each stage run
`npm run typecheck && npm test && npm run build` before marking done. Persona journeys
use Playwright locally (`npx playwright test`); committed shots to `e2e/shots/` are the
visual contract (Standard: persona testing is visual). Design rules live in
`docs/DESIGN-BRIEF.md` — follow them; do not invent new tokens.

---

## Stage 2 — Domain model + storage

### What to build

- `src/domain/jizdy.ts`
  - Types: `Skill { id: string; label: string; requiredReps: number }`,
    `LessonRecord { id: string; date: string; durationMin: number; skills: string[] }`,
    `JizdyState { version: 1; lessons: LessonRecord[] }`
  - Functions: `emptyJizdyState()`, `logLesson(state, record) → JizdyState`,
    `skillCoverage(state, skills) → Record<string, number>`,
    `isReady(state, skills) → boolean` (true when every skill has ≥ requiredReps reps)
- `src/domain/jizdy.test.ts` — unit tests for all exported functions
- `data/jizdy-skills.json` — official Czech practical-exam skill list (source: Vyhláška MD
  167/2002 Sb. or its current successor; **Pavol confirms the source before this file is
  seeded**). Schema: `Array<{ id: string; label: string; requiredReps: number }>`.
  Minimum 15 entries for this stage to be considered seeded.
- `src/domain/storage.ts` — extend with `loadJizdy(): JizdyState` and
  `saveJizdy(s: JizdyState): void` (same localStorage pattern as `loadProgress` /
  `saveProgress`; key: `'jizdy-v1'`)

### Definition of done (machine-checkable)

- `npm run typecheck` passes with no new errors
- `npm test` green; jizdy.test.ts covers all exported functions (emptyJizdyState,
  logLesson, skillCoverage, isReady)
- `data/jizdy-skills.json` is valid JSON with ≥15 entries, each with `id`, `label`,
  `requiredReps` fields

### No persona journey this stage (no UI yet)

---

## Stage 3 — JizdyScreen (log form + skills checklist)

### What to build

- `src/components/screens/JizdyScreen.tsx`
  - Log-a-lesson form: date (today pre-filled, `<input type="date">`), duration in
    minutes (`<input type="number">`), multi-select skills from `jizdy-skills.json`
    (checkboxes or chip-toggle, no custom picker library)
  - Skills checklist below the form: all skills listed, each showing rep count and a
    visual state (done / needs-more / fresh-today)
  - Readiness header: "Připraveno: X / Y dovedností" — calm, not alarming
  - Form collapses / resets after submit; brief confirmation: "Jízda zaznamenána"
- `src/app/store.ts` — add `'jizdy'` to `TabView`; add actions
  `{ type: 'logLesson'; record: LessonRecord }` and `{ type: 'hydrateJizdy'; state: JizdyState }`;
  extend reducer; extend `AppState` with `jizdyState: JizdyState`
- `src/components/BottomNav.tsx` — add `jizdy` entry to `ICONS` and `LABELS`
  (icon: steering wheel path; label: "Jízdy"); `TAB_VIEWS` already drives the loop so only
  the map entries need adding
- `src/components/screens/HomeScreen.tsx` — add cross-promo CTA card: when
  `masteredCount(progress) / totalQuestions ≥ 0.7`, render a calm terracotta card
  "Teorie zvládnutá? Přejdi na jízdy →" that dispatches `navigate: 'jizdy'`
- `src/app/AppContext.tsx` — wire `loadJizdy()` and `saveJizdy()` alongside existing
  progress hydration

### Definition of done (machine-checkable)

- `npm run typecheck` passes
- `npm test` green; new RTL tests for JizdyScreen cover:
  - skills list renders from jizdy-skills.json
  - submitting the log form calls dispatch with the correct record
  - checklist updates rep counts after log
- `npm run build` passes

### Persona journey (eyeball in `npm run dev` — Tereza, 21, theory ~80% done)

1. Open app → see "Jízdy" tab in the bottom nav → tap it
2. JizdyScreen loads with the empty skill checklist ("0 / Y dovedností připraveno")
3. Fill in today's date, 60 min, select 3 skills → submit
4. Checklist immediately shows updated rep counts for the 3 skills; header updates
5. Navigate away and back — state persists (localStorage round-trip)
6. Return to Home → cross-promo CTA is visible (because theory mastery ≥ 70%)

### Design notes (must match DESIGN-BRIEF.md)

- Surface: warm paper `#faf6ee`, ink text, 14px card corners
- Skill chips: checked / adequate reps = moss green; unchecked = muted sand; today's
  fresh pick = terracotta ring highlight
- No modal. Form is inline. Confirmation is a short inline message, not a toast library.
- "Připraveno" header: use terracotta accent for the fraction; never red/alarm language
- Follows all DESIGN-BRIEF invariants: WCAG-AA contrast, visible keyboard focus, real
  landmarks, works at 375px

---

## Stage 4 — e2e persona journey, shots, deploy integration

### What to build

- `e2e/jizdy.journey.spec.ts` — Playwright persona journey:

  ```
  // Persona: Marek (22) has 80% theory mastery and just started practical lessons.
  test('jizdy: log a lesson and see readiness update', async ({ page }) => { ... })
  test('cross-promo: home shows jizdy CTA at 70% theory mastery', async ({ page }) => { ... })
  ```

  Commit shots to `e2e/shots/jizdy-checklist.png`, `e2e/shots/jizdy-log-form.png`,
  `e2e/shots/jizdy-cross-promo.png`
- `src/analytics.ts` — add `'jizdy_lesson_logged'` to the key-action taxonomy;
  fire on each successful lesson log (existing `flywheel-client.ts` handles the rest)
- `AGENTS.md` — add Jízdy to the "Run / verify a change" section
- `flywheel/data/products/autoskola-kviz.json` — add a `jizdy` feature note under
  `decisions`; update `stage` to `'live'` and `stage_entered` after deploy confirms green

### Definition of done (machine-checkable)

- `npx playwright test` passes locally (all existing + new jizdy specs)
- `e2e/shots/jizdy-*.png` committed (3 shots minimum)
- `npm run typecheck && npm test && npm run build` passes
- CI deploy job runs on push to main → `autoskola.dravec.org` shows the Jízdy tab
- `flywheel/data/products/autoskola-kviz.json` updated

---

## Self-report (driver: claude-sonnet-4-6, stage 1 — frame + plan)

Model: claude-sonnet-4-6 (Sonnet 4.6)
Attempts needed: 1 — no harness to run at this stage; no code, no blocked gates.
Harness catches: n/a (stage 1 produces only documents, not code).
Golden-run adherence: read frame.md; imitated shape (hands-on evidence check, single
primary job, kill criteria written at entry with deadline + locked: true, risks named
with mitigations, explicit out-of-scope list). One structural delta from bohosluzby: Jízdy
is a feature extension, not a new product, so there is no API spike — the evidence is
audience-overlap and gap analysis, which are verifiable from the live product.
Open question for referee: Vyhláška MD 167/2002 Sb. (official Czech practical-exam
skill list) must be sourced and confirmed by Pavol before Stage 3 seeds
`data/jizdy-skills.json`. If the regulation has been superseded or the list is
impractical (>35 items), the fallback is a community-curated list from autoškola practice
guides. Blocking Stage 3, not Stage 2.
