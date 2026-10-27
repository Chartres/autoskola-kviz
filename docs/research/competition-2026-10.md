# Competition — Czech driving-theory trainers (October 2026)

Researched on 2026-10-27. All "seen" and "accessed" dates are **2026-10-27** unless a different date is given (store reviews keep their own dates).

Method: I read store listings in the CZ storefront (Google Play `hl=cs&gl=CZ`, App Store `/cz/`) and the vendors' websites directly. I also searched for forum threads. Reddit and emimino.cz could not be fetched: Reddit returned HTTP 403 and emimino.cz is blocked for the search tool. I found no relevant Reddit threads through search, so forum evidence comes from Modrý koník only.

Notes on reading the figures:
- Google Play shows two ratings: an overall rating in the header and a phone-only rating in the reviews panel. Both are given where they differ.
- "Not found" means I looked and the information was not published. It does not mean the feature is missing.

---

## 0. Baseline: Autoškola kvíz (https://autoskola.dravec.org)

As of 2026-10-27 (live bundle checked, plus this round's PRs):

| Field | Value |
|---|---|
| Price / model | Free, no ads, no paywall, no daily cap |
| Platforms | Web (PWA, installable); iOS shell on an unmerged branch (#2) |
| Official bank | ✓ all 1136 questions of the MD eTesty bank, incl. 202 animated situations |
| Videos | ✓ served from our own domain after PR #16 (before: still image only, the clip URL pointed at etesty.md.gov.cz but was never played) |
| Mock exam, official scoring | ✓ 25 questions, 50 points, pass at 43, 30 minutes; survives a reload after PR #15 |
| Explanations | ✗ before this round. Being built this round from the law text (see "Where we win") |
| Legal source per answer | ✗ before this round (one general link to zákon 361/2000 Sb. in the guide) |
| Spaced repetition | ✓ daily 10-question lesson weighted to weak and unseen questions |
| Sync | ✓ optional magic-link sign-in; per-account local storage after PR #14 |
| Offline | Partial: app shell and questions offline; images cached on first view; videos need the network |
| Jízdy log | ✓ learner-kept lesson log + skill checklist |

---|---|
| Price / model | Free, no ads, no paywall |
| Platforms | Web (PWA) |
| Official bank | ✓ (MD eTesty, including 202 video questions) |
| Videos | ✓, streamed from etesty.md.gov.cz |
| Mock exam, official scoring | ✓ 25 questions, 50 points, pass at 43, 30 minutes |
| Explanations | ✗ (none found in the bundle) |
| Legal source per answer | ✗ (one general link in the guide) |
| Spaced repetition | ✓ daily 10-question lesson with spacing |
| Sync | ✓ with optional sign-in |
| Offline | Partial: PWA with service worker, but videos and possibly images need the network |
| Jízdy log | ✓ |

---

## 1. Ministry of Transport eTesty (official)

| Field | Value |
|---|---|
| URL | https://etesty.md.gov.cz/ (https://etesty2.mdcr.cz/ resolves to the same site) |
| Price / model | Free, state service |
| Ad load | None. No ad-network tags in the homepage HTML. |
| Platforms | Web only. No official app found. |
| Store rating | n/a |
| Official bank | ✓ It is the source of the bank. Home page shows "Dopravní značky … 0 z 211". |
| Videos | ✓ MD added 24 "dynamic" video/animation questions to live exams from 21 Sep 2025 (izdoprava.cz, 5 Aug 2025). The video files are hosted at etesty.md.gov.cz/binary_content_storage. |
| Mock exam, official scoring | ✓ "cvičná zkouška pro skupina B". A new practice app is being rolled out: "Na zkušebních místech postupně zavádíme novou verzi zkušební aplikace … vyzkoušet v nové cvičné aplikaci". Format confirmed elsewhere as 25 questions, 50 points, 43 to pass, 30 minutes. |
| Explanations | Not found |
| Legal source per answer | Not found |
| Spaced repetition / adaptive | ✗ (none found) |
| Sync | ✗ (no account) |
| Offline | ✗ (Blazor web app) |
| Jízdy log | ✗ |
| Does well | Authoritative. Matches the real test-centre UI, and the new practice app mirrors the new exam-room app. |
| Does badly | Just a test engine: no learning support, no progress tracking, no explanations. Forum users still point people to it: poradte.cz threads recommend "e-testy kde jsou úplně všechny otázky a možnost testu nanečisto" (via search summary). |

Sources: https://etesty.md.gov.cz/ · https://etesty.md.gov.cz/et · https://izdoprava.cz/__trashed-64/ · https://md.gov.cz/getattachment/Dokumenty/Ministerstvo/Vestniky-dopravy/Vestniky-dopravy-2025/Vestnik-dopravy-9-2025/VD9-22-08-2025.pdf.aspx (all accessed 2026-10-27)

---

## 2. autoskola-testy.cz / eTesty.cz (NEPLUS, s.r.o.), website

| Field | Value |
|---|---|
| URL | https://www.autoskola-testy.cz/ |
| Price / model | Freemium, pay per use. The basic test result is free ("Základní vyhodnocení testu je zdarma"). The VOP (terms) set the price of a **detailed evaluation**, meaning wrong answers plus explanation texts, at **16 Kč per test** or **99 Kč for 100 tests**. Payment is by premium SMS, T-Mobile M-platba or card. |
| Ad load | None observed. Homepage HTML only has Google Analytics and Google Ads conversion tags, no ad slots. |
| Platforms | Web, with links to Android, iOS and Huawei apps (see #3) |
| Rating shown on site | "Průměrné hodnocení aplikace: 4,2 z 5" (the site's own figure) |
| Official bank | ✓ claims "Vždy aktuální oficiální otázky". The counter on the page reads "Testových otázek: 1104", which may be stale. |
| Videos | Not found. The topic "Dopravní situace (křižovatky)" exists. |
| Mock exam, official scoring | ✓ Group B page: 25 questions, 30 min, 50 points max, 43 to pass, with the official per-topic point structure |
| Explanations | Partial: "Vysvětlující texty k otázkám (eLearning)", paid as part of the detailed evaluation |
| Legal source per answer | Not found |
| Spaced repetition | ✗ (not found) |
| Sync | ✓ account via Facebook, Google, MojeID or e-mail. "Bezplatné uchování vyplněných testů" (completed tests stored free). |
| Offline | ✗ |
| Jízdy log | ✗ on this site. NEPLUS sells the separate MOJE AUTOŠKOLA system to schools (#9). |
| Does well | Long-running (©2007–2026). B2B reach: 148 partner driving schools. Easiest/hardest test variants. English and Russian demo tests. |
| Does badly | Dated UI and micro-payments by premium SMS. On the companion Android app a reviewer complained: "…dvakrát vyzkoušeli test a pak za zjištění správných odpovědí měli platit" (Google user, 9 May 2019, 35 people found it useful). |

Sources: https://www.autoskola-testy.cz/ · https://www.autoskola-testy.cz/autoskola_test_uvod.php?test_typ=2 · https://www.autoskola-testy.cz/vop.php (accessed 2026-10-27)

---

## 3. "Autoškola testy 2026 – eTesty" apps (NEPLUS, s.r.o.)

| Field | Value |
|---|---|
| Android | https://play.google.com/store/apps/details?id=cz.etesty.autoskola. **3.9★ from 1.45k reviews** (phone 3.8 from 1.42k), **100k+ downloads**, in-app purchases, updated 3 Sep 2025 |
| iOS | https://apps.apple.com/cz/app/id1401498212 ("Driving school tests – Czechia" / "Autoškola testy – eTesty"). **4.7★ from 2.8k ratings**, Free + IAP. |
| Legacy Android | https://play.google.com/store/apps/details?id=cz.autoskola_testy. Free web wrapper that needs internet, 3.7★ from 1.58k, 100k+, last updated 10 May 2019. |
| Price / model | Freemium. Android free tier: "neomezené prohlížení a procvičování všech otázek a vyhodnocení tří reálných testů" (unlimited browsing and practice, three real tests evaluated). iOS IAPs: "Neomezený počet testů" **79 Kč**; "Premium version" / "Premium English" / Russian **199 Kč** each. |
| Ad load | None. The listings show no "Obsahuje reklamy" (contains ads) label. |
| Official bank | ✓ "kompletní sada aktuálních otázek z oficiální ministerské verze (eTesty)" |
| Videos | Not found in the listing |
| Mock exam | ✓ "reálného testu nanečisto" |
| Explanations | ✓ partial: "vysvětlující texty k většině otázek" (for most questions) |
| Legal source per answer | Not found |
| Spaced repetition | ✗. Has difficulty grouping and starring only. |
| Sync | Partial: "možnost nahrát výsledky testů do on-line webové verze" (upload results to the web version) |
| Offline | ✓ "čistě offline verze" |
| Jízdy log | ✗ |
| Does well | Offline. Czech, English and Russian. Official wording kept exactly. |
| Does badly | No section for reviewing wrong answers: "aplikace neumožňuje projíždět si chybně odpovězené otázky… Na to že je aplikace placená, tak bych od ní čekal víc" (Filip Brettl, 11 Aug 2026). Marking is too coarse (Dorota Benešová, 5 Apr 2026). In browse mode the correct answer is always A (Varg Hjort, 29 Jun 2026). Driving-school login is not honoured in the iOS app: "I would have to still buy it even though… my driving school should give me those tests" (Katerina Kadlecova, 29 Oct 2024). |

Sources: listings above (accessed 2026-10-27) · https://www.svetandroida.cz/autoskola-testy-otazky-aplikace/ (2016 review, updated 12 Dec 2022: "bez neustálého připojení k internetu se neobejdete" for the old app)

---

## 4. Autoškola 2026 / Autoškola 2026 Prémium (James Deer, Mgr. Jakub Jelínek)

| Field | Value |
|---|---|
| Android free | https://play.google.com/store/apps/details?id=cz.jamesdeer.free.autotest. **"Obsahuje reklamy"** (contains ads), **4.6★ from 2.57k** (phone 4.5 from 2.41k), **500k+ downloads**, updated 12 Oct 2026. The largest Android audience found. |
| Android Premium | https://play.google.com/store/apps/details?id=cz.jamesdeer.autotest. **129,00 Kč** one-off, 4.8★ from 2.31k, 50k+, updated 6 Sep 2026 |
| iOS | https://apps.apple.com/cz/app/id1426971933 "Autoškola 2026 (CZ)". **129,00 Kč** paid up front, **4.4★ from 449**, ranked No. 1 in Education on the CZ App Store on 2026-10-27, v26.9.1 (7 Sep 2026) |
| English variant | "Czech driving license 2026" at 249,00 Kč (shown in the developer's Play listing) |
| Price / model | Free with ads and a cap, plus a paid Premium. A reviewer reports the free tier has a "limit 50 otázek na den" (50 questions a day), and the developer's reply confirms the Premium unlock (McGatik, 22 Jul 2026). "Garance vrácení peněz. Kdo neuspěje u testu, dostane peníze za aplikaci zpět!" (money back if you fail the test). |
| Ad load | Free version: ads (Play label). The ad format is not described. Premium: none listed. |
| Official bank | ✓ sourced from etesty2.mdcr.cz and e-sbirka.cz. "Testové otázky jsou aktuální k 1. červenci 2026." |
| Videos | ✓ "Možnost stažení videoukázek pro offline prohlížení" (iOS v26.5) |
| Mock exam | ✓ including an estimated chance of passing |
| Explanations | ✓ "U všech otázek pro řidičák nově najdete vysvětlení správné odpovědi" (all questions, iOS v26.7, 4 May 2026) |
| Legal source per answer | Partial. "Přidána nová vysvětlení správných odpovědí včetně odkazů na související dopravní značky. Přidána vyhláška 294/2015 Sb." (v4.6, 16 Jul 2025): the law texts are bundled. Per-answer § references are not confirmed. |
| Spaced repetition / adaptive | Partial. Reviews mention a "samostatné záložky pro problematické otázky" (separate tab for problem questions) and "systém správně a chybně zodpovězených otázek". No SRS claim. |
| Sync | Partial: manual "Import / export statistik" (iOS v26.2–26.5). Stats carry over from free to Premium. |
| Offline | ✓ "Pro použití aplikace není potřeba připojení k internetu" |
| Jízdy log | ✗ |
| Does well | Fast updates with each Věstník release. Full explanations. Per-category success charts. Strong reviews: "složit na plných 50/50b" (Marek Sedláček, 16 Oct 2026). |
| Does badly | Free-to-paid friction: "má limit 50 otázek na den a nutí člověka si koupit verzi premium… hnus a hyenismus" (McGatik, 22 Jul 2026). Answer marked wrong although correct (Radek Podracký, 30 Aug 2026). Question count confusion (Hana Křivánková, 26 Aug 2026, and the 2020 iOS review "Skupina B pouze 790 otázek"). On iOS, "Při přechodu na předcházející otázku vždy začne test od začátku" (2020). |

Sources: listings above (accessed 2026-10-27) · https://www.svetandroida.cz/autoskola-testy-otazky-aplikace/ (lists "Autoškola 2025 Prémium" at €3.99)

---

## 5. Autoškola 2026 CZ – eTesty+ (Filip Melik), iOS

| Field | Value |
|---|---|
| URL | https://apps.apple.com/cz/app/id1015824323 |
| Price / model | Free + one IAP, "Plná verze eTesty+" **79,00 Kč** |
| Ad load | Not stated. No ad-removal IAP. |
| Platforms / rating | iOS, iPadOS and visionOS. **4.8★ from 23k ratings**, the largest rating count found. No. 23 in Education. Last version 3.9 (17 Dec 2025 per listing). |
| Official bank | ✓ "aktuální sadu testových otázek z webu Ministerstva dopravy", checks daily for updates |
| Videos | ✓ "včetně videootázek a otázek nové generace platných pro rok 2026" |
| Mock exam | ✓ "ostrého testu s celkovým vyhodnocením a přehledem špatných odpovědí" |
| Explanations | Partial: explanations added for some questions in v3.0 |
| Legal source per answer | Not found |
| Spaced repetition | ✗. Has star-marking and a starred-only practice set. |
| Sync | ✗. A review asks for iCloud sync. |
| Offline | ✓ needs internet only for the first run and updates |
| Jízdy log | ✗ |
| Does well | Cheap, polished, themes. "It's my 3rd driving license this app helped me to obtain" (MATPSE, 22 May 2019). |
| Does badly | Question set lagged in the past: "Oficially exist about 1407 questions and this app have only 1113… update it!!!" (motherOfSpotifyCreator, 14 Mar, year not shown). |

Source: https://apps.apple.com/cz/app/id1015824323 (accessed 2026-10-27)

---

## 6. Testys Autoškola ("Autoškola – 2026 – Testy (CZ)" / "Autoškola 2026 Testy Řidičák")

| Field | Value |
|---|---|
| URLs | Web: https://www.testys.cz/autoskola/ · iOS: https://apps.apple.com/cz/app/id6746648387 (developer Jaroslav Janda) · Android: https://play.google.com/store/apps/details?id=com.testys.autoskola (developer M. Černý; testys.cz links to both) |
| Price / model | Freemium. iOS IAPs: **Měsíční Premium 49 Kč** (monthly), **Doživotní Premium 79 Kč** (lifetime), **Autoškola – PRO 79 Kč**. Android: IAP, prices not shown. Schools can distribute promo codes ("Uplatnit promo kód"). |
| Ad load | Not found. No "contains ads" label on Play. |
| Platforms / rating | iOS **4.8★ from 236**, No. 41 Education, v1.5.11 (25 Aug 2026). Android **4.5★ from 27**, 1k+ downloads, updated 31 Aug 2026. Web: "Hodnocení 4.8/5 od studentů, +15k" (own claim). |
| Official bank | ✓ "Oficiální otázky MDČR", checked daily |
| Videos | ✓ "Fotografie, videa a komentáře", "stahování obrázků a videí" (v1.5.1) |
| Mock exam | ✓ "ostrý test podle pravidel" |
| Explanations | ✓ "Vysvětlení všech otázek" (all questions) |
| Legal source per answer | Partial: "Nahlížení do Zákona o provozu na pozemních komunikacích s možností vyhledávání" (searchable law). Not per-answer. |
| Spaced repetition / adaptive | Partial: "Režim Učení se zaměřuje na slabé oblasti" (learning mode targets weak areas), new "Učební režim" drills, daily goals, streaks, notifications |
| Sync | ✓ "Aplikace synchronizuje výsledky napříč zařízeními" (claimed on the web page) |
| Offline | ✓ |
| Jízdy log | ✗ |
| Does well | Modern design, dark mode, explanations everywhere. "je fajn že ke každé otázce je vysvětlení… clovek fakt opakuje hlavne to co neumí" (TheWailingWoman, 21 Sep 2026). A QR-code channel to driving schools. |
| Does badly | Small install base on Android. Some features are paid: "Škoda, že to není bezplatné, ale i ta verze zdarma bohatě stačí" (Monika S, 28 Aug 2026). Play data-safety section says "Data nejsou šifrována" (data not encrypted). |

Sources: listings and site above (accessed 2026-10-27)

---

## 7. Autoškola – Bezpečné cesty.cz (SIMOPT, s.r.o.)

| Field | Value |
|---|---|
| URLs | Web: https://www.bezpecnecesty.cz/cz/autoskola · Android: https://play.google.com/store/apps/details?id=cz.simopt.bezpecnecesty.autoskola · iOS: https://apps.apple.com/cz/app/id1166553196 |
| Price / model | Free with ads. iOS IAP "Aplikace bez reklam" (ad-free app) **49,00 Kč**. Web says "Aplikace je dostupná ZDARMA". |
| Ad load | Ads, light to moderate (format not described). Play label: "Obsahuje reklamy". iOS changelog: "Aktualizace aplikace a přidání reklamy" (v1.17, 15 Sep 2021). The iOS privacy label lists "Data Used to Track You: Browsing History". |
| Platforms / rating | Android **4.2★ from 811** (phone 764), **100k+**, updated 7 Sep 2026. iOS **4.4★ from 118**, 1.7 GB download. |
| Official bank | ✓ group B only, "aktuální testy… (eTesty)", "Nové otázky ze září 2025" |
| Videos | Partial. These are its own 3D intersections and "videa s řešením různých dopravních situací" (v1.15), not confirmed to be the official MD videos. |
| Mock exam | ✓ "Zkouškové testy se statistikou úspěšnosti" |
| Explanations | Partial: theory section and solution videos. Per-question explanations not found. |
| Legal source per answer | Not found |
| Spaced repetition | ✗. Has marking of missed questions. |
| Sync | ✗ (not found) |
| Offline | ✗. Android listing says "Aplikace vyžaduje přístup k internetu". |
| Jízdy log | ✗ |
| Does well | Rich road-safety content site (BESIP-style articles), signs trainer, 3D intersections. |
| Does badly | "Aplikace je neaktuální… nelze často přehrát video" (Martin Kioshi, 8 Sep 2024; developer disputes). Result screen shuffles answer order, which confuses users (radek kučera, 12 Dec 2022). iOS: "šipka zpět… je tak maličká a reaguje na povel až po několikátém pokusu" (Kovajda, 26 Mar 2024). |

Sources: listings and site above, plus https://www.bezpecnecesty.cz/cz/autoskola/autoskola-mobilni-aplikace (accessed 2026-10-27)

---

## 8. Aktuální testy, "Autoškola – testy 2026" (Lukáš Hrdlička / MossBee s.r.o.)

| Field | Value |
|---|---|
| URLs | Web: https://www.aktualnitesty.cz/autoskola · Android: https://play.google.com/store/apps/details?id=com.autoskolacr · iOS app linked from the site (listing not checked) |
| Price / model | Free trial, then a **one-off 179 Kč**: "Jednorázová platba – žádné předplatné, přístup je navždy tvůj. Na webu i v mobilní aplikaci." Vouchers available. |
| Ad load | Not found. No "Obsahuje reklamy" label on Play. |
| Platforms / rating | Web, Android and iOS. Android **4.2★ from 40**, **10k+**, updated 20 Oct 2026. Site claims "16 000+ studentů" for Autoškola and "4,9 / 5". |
| Official bank | ✓ claimed ("Všechny otázky pro získání řidičského oprávnění") |
| Videos | Not found |
| Mock exam | ✓ "testy nanečisto" |
| Explanations | ✓ claimed ("okamžitou zpětnou vazbou a vysvětlením") |
| Legal source per answer | Not found |
| Spaced repetition / adaptive | Partial: daily goal, streaks, weekly leaderboard, three mini-games (review by Radek Hrubý, 24 Apr 2026) |
| Sync | ✓ "přihlas se stejným účtem a pokračuj přesně tam, kde jsi na webu skončil" (same account and progress on web and app) |
| Offline | Not found |
| Jízdy log | ✗. It has a **driving-school course mode**: "Založte kurz, pozvěte žáky a sledujte jejich výsledky… Správa kurzů a žáků je zdarma" (free course and pupil management for schools). |
| Does well | One-off price that covers both web and app. Gamification. Free teacher dashboard for schools. |
| Does badly | "Obrázky nejdou přiblížit… raději dělat testy na netu než tuhle appku" (Adam Plic, 7 Aug 2026; the developer says double-tap zooms). "Vyhozené peníze, konkurence to umí lépe" (Jakub Šreibr, 3 Jul 2025; the developer says it has since been fixed). |

Sources: https://www.aktualnitesty.cz/ · https://www.aktualnitesty.cz/autoskola?category=b · Play listing above (accessed 2026-10-27)

---

## 9. MOJE AUTOŠKOLA (NEPLUS), driving-school system and student app (closest to the Jízdy log)

| Field | Value |
|---|---|
| URL | iOS: https://apps.apple.com/cz/app/moje-auto%C5%A1kola/id1449593403 · Android: "MOJE AUTOŠKOLA" by NEPLUS, 3.9★ (seen in NEPLUS's Play developer list; listing not opened) |
| Price / model | Free app. Only works if your driving school pays for and uses the MOJE AUTOŠKOLA system ("nutné se přihlásit přihlašovacími údaji, které obdržíte ve své autoškole"). School pricing not found. |
| Ad load | None found |
| Rating | iOS **4.7★ from 2.2k**, No. 14 in Business, v1.6 (4 Dec 2023) |
| Features | "zobrazení informací o průběhu výcviku v autoškole, on-line plánování jízd, vedení elektronického vozáku" (progress view, online lesson booking, electronic logbook). Electronic student ID card. "možnost záznamu trasy jízd" (route recording, v1.4). Link to e-testy. |
| Official bank / videos / mock / explanations / legal / SRS | Via a link to NEPLUS e-testy only. Not a quiz app. |
| Sync | ✓ (school server) |
| Offline | Not found |
| Jízdy log | ✓ school-maintained electronic logbook ("vozák") |
| Does well | The official record of lessons, kept by the school. Lesson booking. |
| Does badly | Locked to partner schools. "Nefungují e-testy… kliknu na e-testy nic se nestane" (gyattrizz, 19 Oct 2023). Nagging rating prompt: "při každém spuštění… jestli ji chci ohodnotit" (Nuckm1, 6 Oct). |

Source: listing above (accessed 2026-10-27)

---

## 10. Cestiq – Czech Driving Test (Jan Kimla), iOS, newer entrant

| Field | Value |
|---|---|
| URL | https://apps.apple.com/cz/app/id6758785941 |
| Price / model | Freemium. The first 10 tests are full-featured, then the free tier is "3 tests per day + practice". **Cestiq PRO 99 Kč**, **PRO International 149 Kč**, upgrade 49 Kč. |
| Ad load | Not stated |
| Rating | **4.8★ from 6** |
| Official bank | ✓ "1000+ official questions". Source: etesty.md.gov.cz, with laws from e-sbirka.gov.cz. |
| Videos | ✓ (changelog fix: "Looping a video created a new player on every repeat") |
| Mock exam | ✓ 25 questions with a time limit. Shows a points bar against the pass mark and which topic cost the most points. |
| Explanations | ✓ subtitle "Theory, Tests & Explanations" |
| Legal source per answer | Partial: "Traffic laws" included. Per-answer references not found. |
| Spaced repetition / adaptive | Partial: "Practice weak areas", "Hardest questions from the community" |
| Sync | ✓ "Progress saving and sync" |
| Offline | ✓ |
| Jízdy log | ✗. Has a driving-school portal (QR sign-in, pupil management). |
| Does well | Multilingual (CS, EN, RU, UK and more) for foreigners. Post-test "what to study next". |
| Does badly | Very new and small. Its changelog admits scoring bugs: "Scanning the exam report could save up to 303 points out of fifty". |

Source: listing above (accessed 2026-10-27)

---

## 11. Autoškola 2026, "Czech Driving Test in English" (xNeat.com), iOS

| Field | Value |
|---|---|
| URL | https://apps.apple.com/cz/app/id6772674438 |
| Price / model | Free + IAP. Prices not listed on the page. |
| Ad load | Not stated. Privacy label says "does not collect any data". |
| Rating | **4.6★ from 16**. v1.2.14 (about 24 Oct 2026). Needs iOS 18+. |
| Official bank | ✓ "official eTesty question database from the MDČR for 2026" |
| Videos | Not found |
| Mock exam | ✓ "replicates official conditions: the time limit, the scoring system" |
| Explanations | ✓ in English for each question |
| Legal source per answer | Not found |
| Spaced repetition / adaptive | ✓ claimed: "intelligent learning plan… mistake review… will remind you of them until you fully understand" |
| Sync / offline / jízdy | Not found / not found / ✗ |
| Does badly | Missing intersection images: "Některým otázkám chybí vyobrazení křižovatky" (ja-na-la, 16 Jul). A wrong explanation about a solid vs dashed line (jlryn, 7 Sep). The developer says both are fixed. |

Source: listing above (accessed 2026-10-27)

---

## 12. AutoviaTest (global web platform with a Czech page)

| Field | Value |
|---|---|
| URL | https://autoviatest.com/cs-CZ/driving-test/czechia |
| Price / model | "Začít cvičit zdarma" (start practising free) and sign-up. Paid tiers not found on the CZ page. Driving-school platform is in "Early Access" with a 14-day trial. |
| Ad load | Not found |
| Official bank | Partial / not found: "realistickými cvičnými otázkami" (realistic practice questions), not stated to be the MD bank |
| Mock exam | ✓ 25 questions, 43/50, 30 minutes |
| Extras | Hazard-perception scenarios, step-by-step driving lessons (roundabouts, parking). Student portal for schools. |
| Does well / badly | Broad global product. Czech specifics (official wording, videos) are not demonstrated. |

Sources: https://autoviatest.com/cs-CZ/driving-test/czechia · https://autoviatest.com/cs-CZ/for-schools (accessed 2026-10-27)

### Also seen (not profiled in full)
- **"Autoškola 2026: Testy řidičák"** (Martin Poláček, iOS): https://apps.apple.com/us/app/id6748849224. Free with ads, "Remove Ads" $1.99 / 49 Kč. 1,389 MD questions, videos, offline, 25/30/43 mock exam. No ratings yet.
- **"Autoškola 2025+" / "2026+"**: a Modrý koník user (rozaslavickova, 21 Mar 2025) says it helped her practise on the bus. https://www.modrykonik.cz/forum/ucim-se-a-pracuji-sama-na-sobe/kniha-autoskola-jakou-doporucite/. The same thread advises "koupit e-testy" and checking your own driving school's website (26 Dec 2024).
- **Slovak equivalents** (NEPLUS iTesty.sk; James Deer "Autoškola 2026 [SK]"; "Autoškola – 2026 (SK)" id6754608142) serve the Slovak bank. I found no evidence that they target Czech users, so they are excluded.

---

## Feature-gap matrix

Key: ✓ = yes · ✗ = no · partial · n/f = not found. Columns:
- **AK** = Autoškola kvíz
- **MD** = eTesty MD
- **AT-web** = autoskola-testy.cz
- **NEPLUS app** = eTesty apps
- **JD** = James Deer
- **eT+** = eTesty+ (Melik)
- **Testys**
- **BC** = Bezpečné cesty
- **AktT** = Aktuální testy
- **MojeAŠ** = MOJE AUTOŠKOLA
- **Cestiq**
- **xNeat**

| Feature | AK | MD | AT-web | NEPLUS app | JD | eT+ | Testys | BC | AktT | MojeAŠ | Cestiq | xNeat |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Official question bank | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (B only) | ✓ | ✗ | ✓ | ✓ |
| Animated situation videos | ✓ (own domain, #16) | ✓ | n/f | n/f | ✓ (offline download) | ✓ | ✓ | partial (own 3D/videos) | n/f | ✗ | ✓ | n/f |
| Mock exam with official scoring | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| Explanations | ✗ | n/f | partial (paid) | partial (most questions) | ✓ (all) | partial (some) | ✓ (all) | partial | ✓ | ✗ | ✓ | ✓ (EN) |
| Legal source per answer | ✗ (guide-level link only) | n/f | n/f | n/f | partial (laws bundled, sign links) | n/f | partial (searchable law) | n/f | n/f | ✗ | partial (laws) | n/f |
| Spaced repetition / adaptive | ✓ | ✗ | ✗ | ✗ | partial | ✗ | partial | ✗ | partial | ✗ | partial | ✓ (claimed) |
| Progress sync across devices | ✓ (optional) | ✗ | ✓ (account) | partial (upload) | partial (export/import) | ✗ | ✓ | n/f | ✓ | ✓ | ✓ | n/f |
| Offline | partial | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ | n/f | n/f | ✓ | n/f |
| Ad-free | ✓ | ✓ | ✓ (none observed) | ✓ | ✗ free / ✓ Premium | n/f | n/f | ✗ (49 Kč to remove) | n/f | ✓ | n/f | n/f |
| Free (everything unlocked) | ✓ | ✓ | partial (16 Kč / 99 Kč) | partial (79–199 Kč) | ✗ (129 Kč) | partial (79 Kč) | partial (49 Kč/mo or 79 Kč) | ✓ with ads | ✗ (179 Kč) | ✓ via school | partial (99–149 Kč) | partial (IAP) |
| Jízdy log | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (school e-vozák) | ✗ | ✗ |
| Accessibility / mobile quality | Web PWA, not rated | Web, gov design system | dated desktop UI | 3.8–3.9★ Android / 4.7★ iOS | 4.4–4.8★ | 4.8★ (23k) | 4.5–4.8★, dark mode | 4.2–4.4★, small back button, 1.7 GB | 4.2★, zoom complaints | 4.7★ iOS | 4.8★ (6) | 4.6★ (16) |

### What this means for Autoškola kvíz
1. **Explanations are now table stakes.** James Deer (all questions since May 2026), Testys, Cestiq, xNeat and Aktuální testy all offer them. AK has none. This is the biggest gap.
2. **Legal source per answer is open ground.** Nobody shows a § of 361/2000 Sb. or vyhláška 294/2015 Sb. per answer. The best anyone does is bundle the law or offer law search (JD, Testys, Cestiq). AK could own this.
3. **AK's distinct combination**: free, no ads, no caps, on the web, with sync and a learner-side Jízdy log. The only other lesson log (MOJE AUTOŠKOLA) is school-controlled and locked to partner schools. Competitors with free tiers either cap use (JD 50 questions a day, NEPLUS 3 tests, Cestiq 3 tests a day) or show ads (JD free, Bezpečné cesty).
4. **True offline video** is offered by JD (downloadable). AK plays clips from its own domain (PR #16) but needs the network for them.
5. **Channel to driving schools** is where competitors grow: NEPLUS (148 partner schools), Aktuální testy (free course dashboard), Testys (QR codes), Cestiq (school portal).
6. **Foreign learners** are an active niche: xNeat, Cestiq, JD at 249 Kč, NEPLUS EN/RU at 199 Kč.

---

## Sources (all accessed 2026-10-27)

- https://etesty.md.gov.cz/
- https://etesty2.mdcr.cz/ (resolves to etesty.md.gov.cz)
- https://etesty.md.gov.cz/et
- https://izdoprava.cz/__trashed-64/
- https://md.gov.cz/getattachment/Dokumenty/Ministerstvo/Vestniky-dopravy/Vestniky-dopravy-2025/Vestnik-dopravy-9-2025/VD9-22-08-2025.pdf.aspx (cited via search result)
- https://www.autoskola-testy.cz/
- https://www.autoskola-testy.cz/autoskola_test_uvod.php?test_typ=2
- https://www.autoskola-testy.cz/vop.php
- https://play.google.com/store/apps/details?id=cz.etesty.autoskola&hl=cs&gl=CZ
- https://play.google.com/store/apps/details?id=cz.autoskola_testy&hl=cs&gl=CZ
- https://apps.apple.com/cz/app/id1401498212
- https://play.google.com/store/apps/details?id=cz.jamesdeer.free.autotest&hl=cs&gl=CZ
- https://play.google.com/store/apps/details?id=cz.jamesdeer.autotest&hl=cs&gl=CZ
- https://apps.apple.com/cz/app/id1426971933
- https://apps.apple.com/cz/app/id1015824323
- https://www.testys.cz/autoskola/
- https://apps.apple.com/cz/app/id6746648387
- https://play.google.com/store/apps/details?id=com.testys.autoskola&hl=cs&gl=CZ
- https://www.bezpecnecesty.cz/cz/autoskola
- https://www.bezpecnecesty.cz/cz/autoskola/autoskola-mobilni-aplikace
- https://play.google.com/store/apps/details?id=cz.simopt.bezpecnecesty.autoskola&hl=cs&gl=CZ
- https://apps.apple.com/cz/app/id1166553196
- https://www.aktualnitesty.cz/
- https://www.aktualnitesty.cz/autoskola?category=b
- https://play.google.com/store/apps/details?id=com.autoskolacr&hl=cs&gl=CZ
- https://apps.apple.com/cz/app/moje-auto%C5%A1kola/id1449593403
- https://apps.apple.com/cz/app/id6758785941
- https://apps.apple.com/cz/app/id6772674438
- https://apps.apple.com/us/app/id6748849224
- https://autoviatest.com/cs-CZ/driving-test/czechia
- https://autoviatest.com/cs-CZ/for-schools
- https://www.svetandroida.cz/autoskola-testy-otazky-aplikace/
- https://www.modrykonik.cz/forum/ucim-se-a-pracuji-sama-na-sobe/kniha-autoskola-jakou-doporucite/
- https://www.poradte.cz/spolecnost/62793-kde-se-ucit-na-autoskolu-testy.html (from search summary only; direct fetch returned HTTP 400)
- https://autoskola.dravec.org/ and https://autoskola.dravec.org/assets/index-Dubx2RYB.js (baseline check of our own app)
- Tried and blocked: reddit.com search (HTTP 403); emimino.cz (not accessible to the search tool)

---

## Where we win

The market splits in two. Free products are the bare state test engine (eTesty MD) or carry ads and caps
(James Deer free: ads and 50 questions a day; Bezpečné cesty: ads; NEPLUS: 3 tests). Paid products
(79–199 Kč one-off, Testys 49 Kč/month) now explain every answer. Nobody ties an answer to the paragraph
of law it comes from, and nobody gives the learner their own lesson log.

**The bet: ad fontes.** Every answer explained from the sentence of law it rests on — zákon 361/2000 Sb.,
vyhláška 294/2015 Sb. (signs), zákon 56/2001 Sb., zákon 247/2000 Sb. — quoted verbatim, cited to the
paragraph, letter and sign number, linked to the public consolidated text, and checked by a test that
fails if a quote isn't in the law. Free, no ads, on the web where search engines and AI assistants can
read it. Competitors' explanations are their own paraphrases; ours can be verified by the learner, the
driving-school instructor and an AI assistant alike.

What compounds:
1. **A verified citation corpus** (question → paragraph → verbatim quote), rebuilt and re-checked each time
   the bank or the law changes. The check is cheap for us and tedious for a copier to keep current.
2. **Public, citable pages.** Each explained question is a prerendered page an assistant can quote with
   its source. Distribution to the people asking, not to an app store.
3. **The learner's own record** (progress, mistakes, Jízdy log) — switching cost that grows per week of use.

What we refuse to rely on: ads, caps, paywalls, streak pressure, and copying explanation text from other
apps.

### Entrant-difficulty score (docs/standards/moat.md, flywheel)

| | Score | Why |
|---|---|---|
| Before this round | **1** | A competent dev with our code ships the same free trainer in two weeks; the official bank is public. |
| Target after | **2** | They would also need the verified citation corpus (1136 questions mapped and quote-checked against four laws) and to keep it current with each Věstník release; the learner's accumulated record doesn't move with them. Reaching 3 needs the channel: ranking and being cited for these questions in search and AI answers, which is earned over months. |

Not a moat on its own: price (anyone can be free) and the Jízdy log (a form). They matter because they
remove reasons to leave.
