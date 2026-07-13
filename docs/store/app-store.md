# App Store metadata + submission checklist — Autoškola

Paste-ready values for App Store Connect. Owner: Pavol Dravecky (individual account).
Bundle ID `org.dravec.autoskola` · SKU `autoskola-kviz` · free, no ads, no IAP · age 4+ · category Vzdělávání (Education) · availability: Czechia + Slovakia first.

## Name / subtitle

| Field | Value | Limit |
|---|---|---|
| Name | `Autoškola 2026: testy zdarma` | 27/30 |
| Subtitle | `Skutečně se nauč. Bez reklam.` | 29/30 |

Yearly ritual each September: regenerate dataset, bump 2026→2027 here and in keywords.

## Promotional text (170)

`Všech 1136 oficiálních otázek pro skupinu B — včetně videí. Lekce, chytré opakování chyb a ostrý test nanečisto. Kompletně zdarma, bez reklam.`

## Description

```
Většina aplikací tě nechá donekonečna klikat testy. Autoškola tě látku nejdřív
naučí: krátké lekce pokryjí všech sedm okruhů, chytré opakování ti vrací otázky,
ve kterých chybuješ, a ostrý test si dáš, až když jsi připraven(a).

Pro řidičský průkaz skupiny B.

• Všech 1136 oficiálních otázek Ministerstva dopravy, včetně obrázků a video animací
• Lekce krok za krokem — studijní průvodce všemi okruhy zkoušky
• Chytré opakování chyb: aplikace ví, kde chybuješ, a vrací ti to
• Ostrý test přesně podle zkoušky: 25 otázek, 50 bodů, 30 minut, hranice 43 bodů
• Historie ostrých testů a signál připravenosti
• Deník jízd — přehled o povinných hodinách za volantem
• Funguje kompletně offline
• Zdarma. Bez reklam. Bez skrytých plateb. Všechny otázky odemčené od začátku.

Datum poslední aktualizace otázek vidíš přímo v aplikaci. Přihlášení je čistě
volitelné — slouží jen k synchronizaci postupu mezi zařízeními.
```

## Keywords (100)

`autoškola,testy,řidičák,etesty,zkouška,skupina B,značky,křižovatky,otázky,2026`

## URLs

- Support + marketing: `https://autoskola.dravec.org`
- Privacy policy: `https://autoskola.dravec.org/privacy/`

## Screenshots

`docs/store/shots/` — `iphone-69-*` (1320×2868) and `ipad-13-*` (2064×2752), upload in numeric order (home, question+feedback, exam, stats, guide, jízdy). Regenerate: `npm run build && npx vite preview --port 4173 & node scripts/store-shots.mjs`.

## App Review notes

```
Sign-in is optional and used only to sync progress across devices; the app is
fully usable without an account — no demo credentials needed. Works fully
offline (all questions, images and videos are bundled). Question bank is the
official Czech Ministry of Transport exam bank (public official work, § 3
zákona č. 121/2000 Sb.).
```

## Privacy nutrition label (questionnaire answers)

| Data | Collected? | Linked to identity | Tracking | Purpose |
|---|---|---|---|---|
| Usage Data → Product Interaction | Yes | No | No | Analytics |
| Contact Info → Email | Only if user signs in | Yes | No | App Functionality (sync) |
| Identifiers → User ID | Only if user signs in | Yes | No | App Functionality (sync) |
| Everything else | No | — | — | — |

No ads, no tracking across apps → "Data Not Used to Track You".

## Human checklist (ordered)

1. [ ] App Store Connect → New App: name, bundle `org.dravec.autoskola`, SKU `autoskola-kviz`, primary language Czech.
2. [ ] Business → DSA compliance: declare **non-trader** (free app, no monetization).
3. [ ] Supabase dashboard (shared flywheel project): enable **Apple** provider — needs Services ID + key from developer portal. Google Android client ID → set `VITE_GOOGLE_WEB_CLIENT_ID` in `.env.local`. (`signInWithIdToken` needs no redirect URLs — fleet auth allowlist untouched; changes go via `flywheel/docs/standards/auth-identity.md`.)
4. [ ] Apple Developer portal: App ID capability **Sign in with Apple** (entitlement already in the project).
5. [ ] Paste metadata above; upload screenshots from `docs/store/shots/`.
6. [ ] App Privacy questionnaire per the table above; age rating questionnaire (all "None" → 4+).
7. [ ] Build: ensure `.env.local` present (analytics + auth env) → `npm run build && npx cap sync ios`.
8. [ ] Xcode: open `ios/App/App.xcodeproj` → Signing & Capabilities → select your team, automatic signing.
9. [ ] Product → Archive → Distribute App → App Store Connect. (Export compliance already answered via `ITSAppUsesNonExemptEncryption=NO`.)
10. [ ] TestFlight internal test on your iPhone (no beta review needed) — **specifically verify Sign in with Apple end-to-end**: if Supabase rejects with a nonce mismatch, the social-login plugin auto-generates a nonce and we must pass it through to `signInWithIdToken` (flagged in final review; config-dependent, only testable on a real device).
11. [ ] **Submit for review — only after final sign-off.** Expect 24–72 h; first apps bounce once in ~half of cases (usual causes: offline blank screen — ours works offline; privacy label mismatch — see table).
12. [ ] Post-approval: set availability CZ+SK, then flywheel portfolio record gets the store link.
