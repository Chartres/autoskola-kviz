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
npm test
npx playwright test   # e2e journeys (Chromium)
```
Gate: typecheck · test · build must pass (CI: `.github/workflows/ci.yml`). Block only on these.

## Run / verify a change in the real app
`npm run dev` → http://localhost:5173. Primary journey to eyeball: home → okruh tile →
answer → immediate feedback → summary. The "Dopravní značky" question has an image.

## Release (the finish line — produces a storefront link)
- **Web** → GitHub Pages at `autoskola.dravec.org` (re-add the Pages deploy job to
  `.github/workflows/ci.yml` + repo secrets); platform env: `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_PUBLISHABLE_KEY`. App works fully without them (local progress only).
Adoption is read from web KPIs — no extra telemetry needed.

## Analytics (Common Platform)
Vendored client: `src/platform/flywheel-client.ts` (`app: 'autoskola-kviz'`). Fire the shared
taxonomy (`page_view`, `signup_*`, `conversion`, `key_action`, `feedback_given`, `error`). The aha
moment fires `conversion`; set `activation_event: "conversion"` in the portfolio record and the
conversion rate flows into the console with no extra wiring.

## Done means
Green CI · released (URL) · portfolio record updated (stage/gate/links) · storefront link live ·
(outward promotion only after Pavol's sign-off).
