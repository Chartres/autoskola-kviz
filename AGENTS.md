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
- **Jízdy**: Jízdy tab → log-lesson form (date + duration + skill chips) → submit → "Jízda zaznamenána" + checklist updates → navigate away + back → state persists. Cross-promo CTA on HomeScreen when theory mastery ≥ 70%.

## Release (the finish line — produces a storefront link)
- **Web** → GitHub Pages at `autoskola.dravec.org`. The `deploy` job in `.github/workflows/ci.yml`
  auto-deploys on every push to `main` (after the test/build gate). Build reads platform env
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` from repo secrets; the app works fully
  without them (local progress only).
- **iOS (App Store)** → Capacitor 8 shell (`ios/`, bundle `org.dravec.autoskola`). Local build:
  ensure `.env.local` (VITE_* values are baked at build time — CI secrets don't reach local builds)
  → `npm run build && npx cap sync ios` → Xcode Archive → Distribute. Metadata, screenshots and the
  human submission checklist: `docs/store/app-store.md`; process standard:
  `flywheel/docs/standards/ios-app.md` (incl. the September "2026→2027" rename ritual).
  Submission only after Pavol's sign-off. Android stays portable (`npx cap run android`), no Play
  submission implied.
Adoption is read from web KPIs — no extra telemetry needed.

## Analytics (Common Platform)
Vendored client: `src/platform/flywheel-client.ts` (`app: 'autoskola-kviz'`). Fire the shared
taxonomy (`page_view`, `signup_*`, `conversion`, `key_action`, `feedback_given`, `error`). The aha
moment fires `conversion`; set `activation_event: "conversion"` in the portfolio record and the
conversion rate flows into the console with no extra wiring.

## Done means
Green CI · released (URL) · portfolio record updated (stage/gate/links) · storefront link live ·
(outward promotion only after Pavol's sign-off).
