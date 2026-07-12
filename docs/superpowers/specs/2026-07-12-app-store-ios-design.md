# Autoškola → Apple App Store (design)

Date: 2026-07-12 · Status: approved by Pavol · First flywheel iOS release; also the template run for the `ios-app` standard.

## Goal

Ship the existing web app (Vite + React + TS PWA, autoskola.dravec.org) to the Apple App Store as a Capacitor 8 app, keep it trivially portable to Android, and document the whole path as an actionable flywheel standard (`flywheel/docs/standards/ios-app.md`).

## Positioning (locked)

- **Lead: pedagogy, not price.** The market leader (eTesty+, 23k ratings) and the whole top 5 are drill tools. We are a teaching tool: lessons (Studijní průvodce) → spaced repetition of weak spots → faithful mock exam when ready. Description leads with "skutečně tě to naučí", free/no-ads is the supporting punch.
- **Name:** `Autoškola 2026: testy zdarma` (27 chars). Subtitle: `Skutečně se nauč. Bez reklam.` (29 chars). Year bumps each September with the ministry bank.
- **Seller:** Pavol Dravecky (individual Apple Developer account — legal name is mandatory; "dravec.org" would need org enrollment + D-U-N-S).
- **Free, no ads, no IAP** → DSA **non-trader** declaration; every top-5 competitor monetizes and their review complaints all map to monetization.

## Decisions (locked)

| Decision | Choice |
|---|---|
| Shell | Capacitor 8 (Xcode 26 toolchain — mandatory for uploads since 2026-04-28; iOS 15 target; SPM, no CocoaPods) |
| Devices | iPhone + iPad (13″ iPad screenshots + layout pass included) |
| Analytics | Keep flywheel-client; add `platform: ios/android/web` property; privacy label "Usage Data, not linked to identity" |
| Auth | Sign in with Apple (iOS), native Google (Android), Google OAuth (web) — all via Supabase; always optional, never a wall |
| Android | `cap add android` committed and building; no Play submission yet |
| Bundle ID | `org.dravec.autoskola` |

## Workstreams

### 1. Video questions (fixes #105489 + exam-coverage gap; ships to web too)

24 of 1136 questions are official animation questions (`mediaFormatCode: video/mp4`); the app currently shows only the video's first frame, which makes e.g. #105489 ("jedoucí podél zaparkovaných vozidel" over an empty street) nonsensical.

- Extend the media fetch script to download the mp4s into `public/media` (keyed like images).
- Add media type to the question domain type (`image | video`).
- `QuestionCard` renders `<video controls playsinline poster={still}>` for video questions; official UX note ("Spusťte animaci…") shown as today.
- Fallback: video missing/unplayable → poster still + "Animace nedostupná" note; never a blank card.
- Dataset test extends to check video refs exist, like images today.
- Expected +30–60 MB bundle; acceptable (leader 23 MB, worst competitor 791 MB).

### 2. Capacitor 8 shell

- `@capacitor/core` + `@capacitor/ios` + `@capacitor/android`, `webDir: dist`; `ios/` and `android/` committed.
- Skip service-worker registration when `Capacitor.isNativePlatform()` (assets are local; SW fights `capacitor://`).
- Safe-area CSS (`env(safe-area-inset-*)`), `@capacitor/status-bar`, `@capacitor/splash-screen`.
- `@capacitor/haptics` on answer feedback (native touch for guideline 4.2).
- Icon + splash via `@capacitor/assets` from one 1024 px source.
- `ITSAppUsesNonExemptEncryption = NO` in Info.plist.
- Automatic signing (solo dev; no manual certs).
- Web deploy pipeline unchanged — one codebase, three channels.

### 3. Auth

- iOS: Sign in with Apple via native plugin → `supabase.auth.signInWithIdToken({ provider: 'apple' … })`. Satisfies guideline 4.8.
- Android: native Google sign-in → `signInWithIdToken({ provider: 'google' … })`.
- Web: unchanged (Google OAuth redirect + email OTP).
- Platform-conditional buttons; login remains fully optional everywhere.
- Supabase: enable Apple provider (needs Services ID + key from the developer account — human step).

### 4. Exam history + readiness (no-regret from leader)

- Persist exam results locally (existing storage layer pattern): date, score, passed, per-okruh breakdown.
- Results/Stats surface recent attempts + readiness signal (e.g. "uspěl jsi ve 3 z posledních 5 ostrých testů").
- Feeds the pedagogy story: "exam when ready".

### 5. Freshness label (no-regret, ~zero cost)

- Surface the dataset sync date in-app ("Otázky aktualizovány k 2. 7. 2026") — data pipeline already refreshes; just show the date from META.
- Counters the #1 competitor complaint (stale questions).

### 6. Store assets + metadata

- CZ-primary metadata; description per Positioning above (mention: všechny oficiální otázky vč. videí, lekce, chytré opakování, ostrý test 25 ot./50 b./30 min, offline, jízdy deník, zdarma bez reklam).
- Screenshots via Playwright at exact viewports: iPhone 6.9″ 1320×2868, iPad 13″ 2064×2752 (PNG, sRGB, no alpha, ≤10 each).
- iPad layout eyeball pass (Tailwind responsive; expect minor fixes).
- Privacy policy static page at `autoskola.dravec.org/privacy` (usage analytics disclosure + local storage + optional account sync).
- Age rating 4+.

### 7. App Store Connect (human-gated checklist)

Scripted as a checklist in the flywheel standard; human steps: Xcode dir switch (`sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`), Xcode 26 present, App Store Connect app record, DSA non-trader declaration, privacy label answers, Apple provider secrets for Supabase, final Archive → Distribute. **Submission only after Pavol's sign-off.**

### 8. Flywheel `ios-app` standard

`flywheel/docs/standards/ios-app.md`: enrollment facts ($99/yr, individual vs org, timelines), Capacitor 8 recipe, guideline 4.2 defense list, 4.8 auth rule, privacy-label decision table, DSA trader/non-trader, screenshot specs, export compliance, TestFlight (optional; internal = no beta review), top first-submission rejection causes, yearly rename ritual, Android portability note. Update `flywheel/data/products/autoskola-kviz.json` with the ios channel.

## Testing

- Existing gates: typecheck · vitest · build (CI unchanged).
- Dataset test covers video media presence.
- Unit tests for exam-history persistence + readiness computation (TDD per AGENTS.md).
- iOS Simulator smoke: both primary journeys (Theory incl. a video question; Jízdy) + **Airplane-mode run** (the guideline-4.2 reviewer move).
- Playwright e2e unchanged; screenshot generation reuses it.

## Out of scope (explicit)

- Per-question explanations — v2 candidate (AI-generated explanations are a differentiator but wrong explanations before a real exam are harmful; needs its own quality gate).
- Law full-text browser; profesní způsobilost banks.
- Google Play submission (portability only).
- OTA live updates (Capgo etc.).

## Risks

- **Guideline 4.2** — mitigated: assets bundled, fully offline, haptics, native splash/status bar; quiz logic is inherently app-like. First-app rejection base rate is ~40–60%; plan for one bounce.
- **Ministry media licensing** — question text is úřední dílo (§ 3 aut. zák.); media assets carry residual risk the whole market ignores. Accepted.
- **Video bundle size** — verify actual mp4 sizes before committing to bundling all 24; if >100 MB total, largest files become on-demand downloads with bundled fallback stills.
- **Supabase Apple provider setup** — needs Apple Services ID/key; blocked on human step, auth workstream is independent of the rest.
