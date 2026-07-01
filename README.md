# Autoškola kvíz — practice trainer

**Live (planned):** https://autoskola.dravec.org

A free, calm, self-paced trainer for the Czech driving-licence theory exam
(teoretická zkouška v autoškole). Built on the proven zbrojni-kviz engine:
practice by okruh, a short daily set, mistake review with spaced repetition,
and a timed exam simulation.

> Status: scaffold with a 7-question PLACEHOLDER bank (one per okruh).
> Real bank extraction from the official Ministerstvo dopravy database is a
> separate task — see [`data/README.md`](data/README.md).

## Learning design

- **Montessori.** Free topic choice from day 1 (no locked path), mastery per
  okruh instead of grades, immediate self-correcting feedback — wrong answers
  are learning moments that resurface via spaced repetition.
- **Light Duolingo.** Streak, short daily set (~10 questions), gentle progress.
  Explicitly no dark patterns: no ads, no hearts/lives, no guilt notifications,
  no paywall. See [`docs/DESIGN-BRIEF.md`](docs/DESIGN-BRIEF.md).
- **Exam simulation.** Official format: 25 questions / 30 minutes (point
  weighting lands with the real bank).
- **Profiles & sync (optional).** Supabase Google/magic-link sign-in with
  offline-first merge; fully usable without an account.

## Tech & engineering

Vite + React 19 + TypeScript + Tailwind 4; Vitest + RTL unit/journey tests,
Playwright e2e; PWA (offline). TDD; CI gates on typecheck · test · build.
Analytics is first-party and cookieless via the shared flywheel client.

```bash
npm ci
npm run dev        # local dev
npm run typecheck && npm test && npm run build
npx playwright test  # e2e (needs a built preview; see playwright.config.ts)
```

Build/test/release contract: [`AGENTS.md`](AGENTS.md).
