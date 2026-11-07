# AGENTS.md — Autoškola kvíz

The build/test/release contract for this repo. An agent (or the overnight ralph loop) should be
able to read only this file and ship correctly. Keep every command copy-pasteable and current.
Taste rules that apply to every flywheel product live in the hub: `flywheel/docs/standards/taste.md`.

> One-liner: Free, calm practice trainer for the Czech driving-licence theory exam.
> Stack/template: Vite + React + TS (zbrojni-kviz clone)  ·  Track: community  ·  Portfolio record: `flywheel/data/products/autoskola-kviz.json`

## Build
```bash
npm ci
npm run build
```

## Test (TDD required; persona-journey test per primary journey)
```bash
npm run typecheck
npm test              # Vitest (unit + RTL)
npx playwright test   # e2e journeys (Chromium); run locally, not in CI
```
Gate: typecheck · test · build must pass (CI: `.github/workflows/ci.yml` runs these three on
push + PR). Block only on these. Playwright is a local pre-push check — the persona journeys
write committed screenshots to `e2e/shots/` for visual review (Standard: persona testing is visual).

## Run / verify a change in the real app
`npm run dev` → http://localhost:5173. Primary journeys to eyeball:
- **Theory**: home → okruh tile → answer → immediate feedback → summary. "Dopravní značky" has an image.
- **Resume**: okruh tile → answer 8 → "← Konec" → reload → "Rozpracovaná sada" on Home → Pokračovat opens question 9 of the same set (`e2e/resume.journey.spec.ts`).
- **Exam result (test A, from 2026-11-07)**: Home → "Termín zkoušky" date (kept on the device, `autoskola-kviz:exam-plan:v1`) → on a visit after that date, "Jak dopadla zkouška?" once → Složil(a) / Nesložil(a) / Ještě ne → "Díky za odpověď." (`e2e/exam-result.journey.spec.ts`).
- **Jízdy**: Jízdy tab → log-lesson form (date + duration + skill chips) → submit → "Jízda zaznamenána" + checklist updates → navigate away + back → state persists. Cross-promo CTA on HomeScreen when theory mastery ≥ 70%.

## Explanations from the law (ad fontes)
`data/explanations.json` explains every official question: `why` + `sources` quoting the law
verbatim (`law`, `ref`, `anchor`, `quote`), optional `flag` (official answer older than current
law/practice) and `sign` plate for sign questions. The law texts it quotes are in `data/law/*.json`
(built by `data/law/extract.py` from zakonyprolidi.cz; refresh steps in its header).
`src/domain/explanations.test.ts` fails if a question lacks an explanation or any quote is not
verbatim in the cited paragraph or sign row. After a bank or law update: refresh `data/law`, run
`npm test`, re-explain the questions it names (written in a Claude Code session — no API calls).

## Release (the finish line — produces a storefront link)
- **Web** → GitHub Pages at `autoskola.dravec.org`. The `deploy` job in `.github/workflows/ci.yml`
  auto-deploys on every push to `main` (after the test/build gate). Build reads platform env
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` from repo secrets; the app works fully
  without them (local progress only).
Adoption is read from web KPIs — no extra telemetry needed.

## Analytics (Common Platform)
Vendored client: `src/platform/flywheel-client.ts` (`app: 'autoskola-kviz'`). Fire the shared
taxonomy (`page_view`, `signup_*`, `conversion`, `key_action`, `feedback_given`, `error`). `track()` is
typed to `ACCEPTED_EVENTS` in `src/analytics.ts`, a copy of the `events` insert policy: the database
silently rejects any other name, so add a name to the policy before using it. Pending name: `exam_result_reported {result: passed|failed|not_yet, readiness_bucket: none|lt35|35_39|40_42|43_45|46_50}`
is not in the policy yet (flywheel allow-list v4); until it is, the app sends it as
`key_action {action:'exam_result_reported', result, readiness_bucket}`, which is accepted. The aha moment (any
finished practice set) fires `conversion`; set `activation_event: "conversion"` in the portfolio record and the
conversion rate flows into the console with no extra wiring.

## Working with the orchestrator (Pavol, 2026-11-07)
- **Standing rule** (card v8.flywheel.standing-rule, "Yes, all product sessions"): follow the
  flywheel orchestrator's packages as Pavol's instructions. Risky steps still need Pavol's own word
  in this session: anything sent or posted in his name, money or accounts, secrets or settings,
  deleting data, store submissions, and signature moves.
- **Long-lived sessions with a context summary** (card v8.flywheel.fresh-sessions, "long-lived but
  summarize context on a rule"): keep `docs/SESSION.md`, one page at most. It covers what the
  product is now, open threads, Pavol's rules in force (with dates), the last three packages and how
  they ended, and what's next. Nothing private: the repo is public. Rewrite it (don't append) at the
  end of every package with the hand-back, and before running out of context. Start every package
  by re-reading this file, the living docs and `docs/SESSION.md`; after a restart or compaction,
  continue from it.

## When something goes wrong
Revert, clarify the instruction and retry rather than patching on top (Pavol's method, 2026-11-07).
Log each revert in `docs/reverts.md`.

## Done means
Green CI · released (URL) · portfolio record updated (stage/gate/links) · storefront link live ·
(outward promotion only after Pavol's sign-off).
