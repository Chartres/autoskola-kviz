# Autoškola → Apple App Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship autoskola-kviz to the Apple App Store as a Capacitor 8 app (Android-portable), with video questions, exam history, freshness label, native auth, and the whole path documented as the flywheel `ios-app` standard.

**Architecture:** The existing Vite + React web app becomes the app: Capacitor 8 bundles `dist/` locally (offline by construction — the guideline-4.2 defense). Domain logic stays in `src/domain` (pure, tested); native touches (haptics, status bar, Sign in with Apple) are additive and no-op on web. Data pipeline (`data/extract.py`) gains video publishing.

**Tech Stack:** Vite 8, React 19, TS, Tailwind 4, vite-plugin-pwa, Vitest + RTL, Playwright, Capacitor 8 (`@capacitor/ios`, `@capacitor/android`, haptics/status-bar/splash-screen), `@capgo/capacitor-social-login`, Supabase (`signInWithIdToken`), Python 3 + ffmpeg (data pipeline).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-12-app-store-ios-design.md`. Read it first.
- Bundle ID `org.dravec.autoskola` · display name `Autoškola 2026: testy zdarma` · subtitle `Skutečně se nauč. Bez reklam.` · seller: Pavol Dravecky (individual) · DSA non-trader · age 4+ · free, no ads, no IAP.
- Capacitor 8: Xcode 26 toolchain (uploads require it since 2026-04-28), iOS deployment target 15.0, SPM (no CocoaPods), Node 22+.
- Gate on every task: `npm run typecheck && npm test && npm run build` green before commit (repo CI runs exactly these).
- TDD: failing test first for all domain/UI logic. Match existing code style (2-space, no semicolons where absent, Czech UI copy with diacritics).
- Login is always optional. Never block any feature behind auth.
- App must work fully offline (Airplane-mode test is the review scenario).
- Outward-facing steps (App Store Connect record, upload, submission) happen ONLY after Pavol's explicit sign-off — the plan ends at a ready-to-archive project + checklist.
- The `flywheel` repo lives at `~/my-git/flywheel` (separate git repo — commit there separately).

---

### Task 1: Publish videos through the data pipeline

202 of 1136 questions are official animations. The mp4s are already cached in `data/cache/media/` (1.3 GB raw). Re-encode with ffmpeg (~short, silent clips → target ≤ ~150 MB total), publish to `public/media/`, and emit a local `video` filename per question plus a dataset `generatedAt` date.

**Files:**
- Modify: `data/extract.py` (media publishing + question output + meta output)
- Regenerates: `data/questions.json`, `data/meta.json`, `public/media/*.mp4`

**Interfaces:**
- Produces: question JSON objects gain optional `"video": "<name>.mp4"` (file exists under `public/media/`); `data/meta.json` gains `"generatedAt": "YYYY-MM-DD"`. Existing `videoUrl` (remote) stays for traceability.

- [ ] **Step 1: Check ffmpeg**

Run: `which ffmpeg || brew install ffmpeg`
Expected: a path. (If brew install is needed, it's a one-time dev-machine dependency, same tier as `cwebp`.)

- [ ] **Step 2: Add `publish_video` to `data/extract.py`** (next to `publish_media`, reusing its cache-skip idiom)

```python
def publish_video(name: str) -> str | None:
    """Re-encode a cached mp4 into public/media (H.264, ≤720px wide, silent).

    Official animations are short silent clips; CRF 30 keeps them legible at
    the ~450px the app renders. ponytail: without ffmpeg, videos are skipped
    (app falls back to the still image).
    """
    if not shutil.which("ffmpeg"):
        return None
    src = CACHE_M / name
    dst = PUBLIC_MEDIA / name
    if not dst.exists():
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-i", str(src), "-an",
             "-vf", "scale='min(720,iw)':-2", "-c:v", "libx264", "-crf", "30",
             "-preset", "slow", "-movflags", "+faststart", str(dst)],
            check=True, capture_output=True,
        )
    return dst.name
```

- [ ] **Step 3: Wire it into `transform()`** — in the existing `video_mp4` branch (search `stats["video"] += 1`), after `video_url = ...` add:

```python
                video = publish_video(main.name)
```

and initialize `video: str | None = None` next to `video_url: str | None = None`. Then find where the output question dict is built (the `out.append(...)` at the end of the per-question loop) and emit the field the same way `videoUrl` is emitted, e.g. add to the dict construction:

```python
            **({"video": video} if video else {}),
```

(Match the exact dict-building style already used for optional fields like `videoUrl`/`groups` — read the surrounding code first.)

- [ ] **Step 4: Emit `generatedAt` in meta** — find where `data/meta.json` is written and add to the meta dict:

```python
        "generatedAt": datetime.date.today().isoformat(),
```

(`import datetime` at the top if absent.)

- [ ] **Step 5: Regenerate the dataset**

Run: `cd data && python3 extract.py` (re-runnable; everything is cached, no re-downloads).
Expected: completes; prints its stats line including `video: 202`.

- [ ] **Step 6: Measure and gate**

Run: `ls public/media/*.mp4 | wc -l && du -ch public/media/*.mp4 | tail -1`
Expected: 202 files. **If total > 150 MB: STOP, report the number — the spec's fallback (on-demand streaming for native) needs a plan amendment.** Below 150 MB: proceed.

- [ ] **Step 7: Sanity-check the diff**

Run: `git diff --stat data/questions.json data/meta.json | tail -3` and `python3 -c "import json; qs=json.load(open('data/questions.json')); print(sum(1 for q in qs if q.get('video')))"`
Expected: 202 questions carry `video`; diff touches only added fields + `generatedAt`.

- [ ] **Step 8: Commit**

```bash
git add data/extract.py data/questions.json data/meta.json public/media
git commit -m "feat(data): publish re-encoded animation videos + dataset generatedAt"
```

---

### Task 2: `video` in the domain type + dataset test

**Files:**
- Modify: `src/domain/types.ts:41-43` (Question), `src/domain/types.ts:72-79` (Meta)
- Test: `src/domain/dataset.test.ts`

**Interfaces:**
- Produces: `Question.video?: string` (local mp4 filename under `public/media`), `Meta.generatedAt: string` (ISO date). Consumed by Tasks 3 and 6.

- [ ] **Step 1: Write the failing tests** — add to `src/domain/dataset.test.ts` (it already builds a `FILES` set from `import.meta.glob('/public/media/*')`; follow the existing "image references exist" test's style):

```ts
it('video references exist under public/media', () => {
  const withVideo = ALL_QUESTIONS.filter((q) => q.video)
  expect(withVideo.length).toBeGreaterThanOrEqual(200)
  for (const q of withVideo) expect(FILES, `q ${q.id}`).toContain(q.video!)
})

it('meta carries the dataset generation date', () => {
  expect(META.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- dataset`
Expected: FAIL — `video`/`generatedAt` missing on the types (TS error) — which is the point.

- [ ] **Step 3: Update types** — in `Question`, replace the `videoUrl` comment block with:

```ts
  /** Source video URL for animated questions (traceability). */
  videoUrl?: string
  /** Local re-encoded mp4 (filename under public/media), when published. */
  video?: string
```

and in `Meta` add:

```ts
  /** ISO date the dataset was last regenerated from the official bank. */
  generatedAt: string
```

- [ ] **Step 4: Run tests**

Run: `npm run typecheck && npm test -- dataset`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/types.ts src/domain/dataset.test.ts
git commit -m "feat(domain): video + generatedAt in dataset types, verified by dataset test"
```

---

### Task 3: QuestionCard plays animations

**Files:**
- Modify: `src/components/QuestionCard.tsx:114-124` (media box)
- Test: `src/components/QuestionCard.test.tsx`

**Interfaces:**
- Consumes: `Question.video` (Task 2), `imageUrl()` from `@/lib/assets` (works for any `public/media` filename).

- [ ] **Step 1: Write the failing tests** — add to `QuestionCard.test.tsx` (reuse its existing question fixture/helpers; add `video: 'anim.mp4'` variants):

```tsx
it('renders a video with the still as poster for animated questions', () => {
  renderCard({ ...baseQuestion, video: 'anim.mp4', image: 'still.webp' })
  const video = screen.getByTestId('question-video')
  expect(video).toHaveAttribute('poster', '/media/still.webp')
  expect(video.querySelector('source')).toHaveAttribute('src', '/media/anim.mp4')
  expect(screen.getByText(/Spusťte animaci/)).toBeInTheDocument()
})

it('falls back to the still when the video fails to load', () => {
  renderCard({ ...baseQuestion, video: 'anim.mp4', image: 'still.webp' })
  fireEvent.error(screen.getByTestId('question-video'))
  expect(screen.queryByTestId('question-video')).not.toBeInTheDocument()
  expect(screen.getByRole('img', { name: /Obrázek k otázce/ })).toBeInTheDocument()
  expect(screen.getByText(/Animace nedostupná/)).toBeInTheDocument()
})

it('renders a plain image for non-video questions (unchanged)', () => {
  renderCard({ ...baseQuestion, image: 'still.webp' })
  expect(screen.queryByTestId('question-video')).not.toBeInTheDocument()
  expect(screen.getByRole('img', { name: /Obrázek k otázce/ })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- QuestionCard`
Expected: FAIL (no `question-video` test id).

- [ ] **Step 3: Implement** — in `QuestionCard`, add state (reset per question) and replace the media box:

```tsx
const [videoFailed, setVideoFailed] = useState(false)
useEffect(() => setVideoFailed(false), [question.id])
const showVideo = Boolean(question.video) && !videoFailed
```

```tsx
{(question.image || question.video) && (
  <div className="mb-5 flex min-h-64 items-center justify-center rounded-card border border-sand-700 bg-white p-4">
    {showVideo ? (
      <video
        data-testid="question-video"
        controls
        playsInline
        preload="metadata"
        poster={question.image ? imageUrl(question.image) : undefined}
        onError={() => setVideoFailed(true)}
        className="max-h-56 w-auto"
      >
        <source src={imageUrl(question.video!)} type="video/mp4" />
      </video>
    ) : question.image ? (
      <img
        src={imageUrl(question.image)}
        alt={`Obrázek k otázce ${question.id}`}
        className="max-h-56 w-auto object-contain"
      />
    ) : null}
  </div>
)}
{question.video && (
  <p className="-mt-3 mb-4 font-mono text-xs text-sand-500">
    {videoFailed
      ? 'Animace nedostupná — zobrazen náhled situace.'
      : 'Spusťte animaci a pozorně sledujte situaci.'}
  </p>
)}
```

(`useState` is a new import alongside `useEffect`.)

- [ ] **Step 4: Run tests**

Run: `npm run typecheck && npm test -- QuestionCard`
Expected: PASS (all cases, old ones included).

- [ ] **Step 5: Eyeball it**

Run: `npm run dev`, open a situace question with an animation (search source id 105489 → the app question whose text starts "Řidič vozidla jedoucí jednosměrnou pozemní komunikací podél zaparkovaných…"). Video plays; parked cars appear in motion.

- [ ] **Step 6: Commit**

```bash
git add src/components/QuestionCard.tsx src/components/QuestionCard.test.tsx
git commit -m "feat(quiz): play official animations with still-image fallback"
```

---

### Task 4: Exam history — domain, storage, store

**Files:**
- Create: `src/domain/examHistory.ts`, `src/domain/examHistory.test.ts`
- Modify: `src/domain/storage.ts`, `src/app/store.ts`, `src/app/AppContext.tsx`
- Test: `src/domain/storage.test.ts`, `src/app/store.test.ts`

**Interfaces:**
- Consumes: `ExamResult` from `@/domain/exam` (`{ score, total, passed, passThreshold, byCategory }`).
- Produces: `ExamRecord { at: number; score: number; total: number; passed: boolean }`, `ExamHistory { version: 1; exams: ExamRecord[] }`, `emptyExamHistory()`, `recordExam(h, result, at)`, `readiness(h, window=5): { passed: number; total: number }`; storage `loadExamHistory()/saveExamHistory()`; `AppState.examHistory`; actions `{ type: 'hydrateExamHistory'; history: ExamHistory }`, `finishExam` gains `now: number`, `next` gains `now?: number`. Consumed by Task 5.

- [ ] **Step 1: Write failing domain tests** — `src/domain/examHistory.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { emptyExamHistory, recordExam, readiness, EXAM_HISTORY_LIMIT } from './examHistory'

const result = { score: 45, total: 50, passed: true, passThreshold: 43, byCategory: {} }

describe('examHistory', () => {
  it('appends records with a timestamp', () => {
    const h = recordExam(emptyExamHistory(), result, 1000)
    expect(h.exams).toEqual([{ at: 1000, score: 45, total: 50, passed: true }])
  })

  it('caps stored exams at the limit', () => {
    let h = emptyExamHistory()
    for (let i = 0; i < EXAM_HISTORY_LIMIT + 5; i++) h = recordExam(h, result, i)
    expect(h.exams).toHaveLength(EXAM_HISTORY_LIMIT)
    expect(h.exams[0].at).toBe(5)
  })

  it('readiness counts passes in the last five exams', () => {
    let h = emptyExamHistory()
    const fail = { ...result, score: 30, passed: false }
    for (const r of [fail, result, result, fail, result, result]) h = recordExam(h, r, 1)
    expect(readiness(h)).toEqual({ passed: 4, total: 5 }) // oldest fail fell out of the window
  })

  it('readiness of empty history is 0/0', () => {
    expect(readiness(emptyExamHistory())).toEqual({ passed: 0, total: 0 })
  })
})
```

- [ ] **Step 2: Run to verify failure** — `npm test -- examHistory` → FAIL (module not found).

- [ ] **Step 3: Implement `src/domain/examHistory.ts`**

```ts
import type { ExamResult } from './exam'

export interface ExamRecord {
  /** Epoch ms when the exam finished. */
  at: number
  score: number
  total: number
  passed: boolean
}

export interface ExamHistory {
  version: 1
  exams: ExamRecord[]
}

/** Keep a bounded log — enough for trends, immune to unbounded growth. */
export const EXAM_HISTORY_LIMIT = 50

export function emptyExamHistory(): ExamHistory {
  return { version: 1, exams: [] }
}

export function recordExam(h: ExamHistory, r: ExamResult, at: number): ExamHistory {
  const rec: ExamRecord = { at, score: r.score, total: r.total, passed: r.passed }
  return { version: 1, exams: [...h.exams, rec].slice(-EXAM_HISTORY_LIMIT) }
}

/** Readiness signal: passes within the last `window` mock exams. */
export function readiness(h: ExamHistory, window = 5): { passed: number; total: number } {
  const recent = h.exams.slice(-window)
  return { passed: recent.filter((e) => e.passed).length, total: recent.length }
}
```

- [ ] **Step 4: Run** — `npm test -- examHistory` → PASS.

- [ ] **Step 5: Failing storage test** — add to `src/domain/storage.test.ts` (mirror the existing progress round-trip tests):

```ts
it('round-trips exam history', () => {
  const h = recordExam(emptyExamHistory(), { score: 45, total: 50, passed: true, passThreshold: 43, byCategory: {} }, 7)
  saveExamHistory(h)
  expect(loadExamHistory()).toEqual(h)
})

it('returns empty exam history on bad payloads', () => {
  localStorage.setItem('exam-history-v1', '{"version":99}')
  expect(loadExamHistory()).toEqual(emptyExamHistory())
})
```

- [ ] **Step 6: Implement in `src/domain/storage.ts`** (same pattern as `loadJizdy`/`saveJizdy`):

```ts
const EXAM_HISTORY_KEY = 'exam-history-v1'

export function loadExamHistory(): ExamHistory {
  const s = storage()
  if (!s) return emptyExamHistory()
  try {
    const raw = s.getItem(EXAM_HISTORY_KEY)
    if (!raw) return emptyExamHistory()
    const parsed = JSON.parse(raw) as Partial<ExamHistory>
    if (parsed.version !== 1) return emptyExamHistory()
    return { version: 1, exams: parsed.exams ?? [] }
  } catch {
    return emptyExamHistory()
  }
}

export function saveExamHistory(h: ExamHistory): void {
  const s = storage()
  if (!s) return
  try {
    s.setItem(EXAM_HISTORY_KEY, JSON.stringify(h))
  } catch {
    // private mode / quota exceeded — degrade gracefully to in-memory only
  }
}
```

(import `emptyExamHistory, type ExamHistory` from `./examHistory`.)

- [ ] **Step 7: Run** — `npm test -- storage` → PASS.

- [ ] **Step 8: Failing store test** — add to `src/app/store.test.ts` (use its existing exam-flow helpers):

```ts
it('records finished exams into examHistory', () => {
  let s = reducer(initialState(), { type: 'startExam', rng: makeRng(1), now: 0 })
  while (!isFinished(s.session!)) {
    const q = currentQuestion(s.session!)!
    s = reducer(s, { type: 'answer', choice: q.correct, now: 1 })
    s = reducer(s, { type: 'next', now: 2 })
  }
  expect(s.view).toBe('results')
  expect(s.examHistory.exams).toHaveLength(1)
  expect(s.examHistory.exams[0]).toMatchObject({ passed: true, total: 50, at: 2 })
})

it('finishExam (timer expiry) also records history', () => {
  let s = reducer(initialState(), { type: 'startExam', rng: makeRng(1), now: 0 })
  s = reducer(s, { type: 'finishExam', now: 9 })
  expect(s.examHistory.exams).toHaveLength(1)
  expect(s.examHistory.exams[0].at).toBe(9)
})
```

- [ ] **Step 9: Implement store changes** in `src/app/store.ts`:
  - `AppState` gains `examHistory: ExamHistory`; `initialState()` gains `examHistory: emptyExamHistory()`.
  - Actions: add `| { type: 'hydrateExamHistory'; history: ExamHistory }`; change `next` to `{ type: 'next'; today?: string; now?: number }` and `finishExam` to `{ type: 'finishExam'; now: number }`.
  - In `next`'s finish branch and in `finishExam`, when the mode is exam, compute `const result = evaluateExam(session)` once and set both `examResult: result` and `examHistory: recordExam(state.examHistory, result, action.now ?? Date.now())` (in `next`, only when `state.mode === 'exam'`). Add the `hydrateExamHistory` case mirroring `hydrateJizdy`.
  - Update dispatch call sites: `grep -rn "finishExam\|type: 'next'" src/` — add `now: Date.now()` where components dispatch them.

- [ ] **Step 10: Wire persistence** in `src/app/AppContext.tsx`: hydrate on mount (`dispatch({ type: 'hydrateExamHistory', history: loadExamHistory() })` next to the jizdy hydrate) and persist on change:

```ts
useEffect(() => {
  saveExamHistory(state.examHistory)
}, [state.examHistory])
```

- [ ] **Step 11: Full gate** — `npm run typecheck && npm test && npm run build` → PASS.

- [ ] **Step 12: Commit**

```bash
git add src/domain/examHistory.ts src/domain/examHistory.test.ts src/domain/storage.ts src/domain/storage.test.ts src/app/store.ts src/app/store.test.ts src/app/AppContext.tsx src/components
git commit -m "feat(exam): persistent exam history with readiness signal"
```

---

### Task 5: Readiness in Results + exam log in Stats

**Files:**
- Modify: `src/components/screens/ResultsScreen.tsx` (after the pass/fail block, ~line 66), `src/components/screens/StatsScreen.tsx` (new section after the category bars)
- Test: `src/components/screens/StatsScreen.test.tsx` (create if absent; follow sibling screen tests' render helpers)

**Interfaces:**
- Consumes: `readiness`, `ExamHistory` (Task 4); `state.examHistory` from `useApp()`; `formatDate` helpers in `src/lib/date.ts` (check what exists; otherwise `new Date(at).toLocaleDateString('cs-CZ')`).

- [ ] **Step 1: Failing test** — StatsScreen with seeded history shows the exam log and readiness:

```tsx
it('lists recent mock exams with a readiness line', () => {
  localStorage.setItem('exam-history-v1', JSON.stringify({
    version: 1,
    exams: [
      { at: 1750000000000, score: 45, total: 50, passed: true },
      { at: 1750100000000, score: 38, total: 50, passed: false },
    ],
  }))
  renderApp() // per sibling tests: AppProvider + screen
  expect(screen.getByText(/Ostré testy/)).toBeInTheDocument()
  expect(screen.getByText(/1 z posledních 2/)).toBeInTheDocument()
  expect(screen.getByText('45')).toBeInTheDocument()
  expect(screen.getByText('38')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify failure** — `npm test -- StatsScreen` → FAIL.

- [ ] **Step 3: StatsScreen implementation** — append after the category `<div className="space-y-5">…</div>`:

```tsx
{state.examHistory.exams.length > 0 && (
  <section className="mt-10">
    <h2 className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.2em] text-sand-400">
      Ostré testy
    </h2>
    <p className="mb-3 text-sm text-sand-300">
      Uspěl(a) jsi v {readiness(state.examHistory).passed} z posledních{' '}
      {readiness(state.examHistory).total} ostrých testů.
    </p>
    <ul className="space-y-2">
      {state.examHistory.exams.slice(-10).reverse().map((e) => (
        <li
          key={e.at}
          className="flex items-center justify-between rounded-card border border-sand-700 bg-sand-900/50 px-4 py-2 text-sm"
        >
          <span className="text-sand-400">
            {new Date(e.at).toLocaleDateString('cs-CZ')}
          </span>
          <span className="font-mono tabular-nums text-sand-200">
            {e.score} / {e.total}
          </span>
          <span className={e.passed ? 'text-moss-400' : 'text-rust-400'}>
            {e.passed ? 'Prospěl(a)' : 'Neprospěl(a)'}
          </span>
        </li>
      ))}
    </ul>
  </section>
)}
```

- [ ] **Step 4: ResultsScreen readiness line** — inside the `isExam && examResult` header block, after the `Pro úspěch…` paragraph:

```tsx
{state.examHistory.exams.length > 1 && (
  <p className="mt-1 text-sm text-sand-500">
    Uspěl(a) jsi v {readiness(state.examHistory).passed} z posledních{' '}
    {readiness(state.examHistory).total} ostrých testů.
  </p>
)}
```

- [ ] **Step 5: Run + gate** — `npm run typecheck && npm test` → PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/screens/StatsScreen.tsx src/components/screens/StatsScreen.test.tsx src/components/screens/ResultsScreen.tsx
git commit -m "feat(stats): mock-exam log + readiness signal"
```

---

### Task 6: Freshness label

**Files:**
- Modify: `src/components/screens/StudyScreen.tsx` (source line, ~line 12), `src/components/screens/HomeScreen.tsx` (footer-ish placement — read the file, put it where the okruh tiles end)

**Interfaces:**
- Consumes: `META.generatedAt` (Task 2).

- [ ] **Step 1: Failing test** — in the StudyScreen test (or create one following siblings):

```tsx
it('shows the dataset freshness date', () => {
  renderApp()
  expect(screen.getByText(/Otázky aktualizovány k/)).toBeInTheDocument()
})
```

- [ ] **Step 2: Implement** — StudyScreen: extend the existing "Oficiální otázky: …" paragraph:

```tsx
{' '}· Otázky aktualizovány k{' '}
{new Date(META.generatedAt).toLocaleDateString('cs-CZ')}
```

HomeScreen: add the same sentence as a small footer line (`<p className="mt-8 text-center font-mono text-xs text-sand-600">`).

- [ ] **Step 3: Run + gate** — `npm run typecheck && npm test` → PASS. **Step 4: Commit** — `git commit -m "feat: surface dataset freshness date"`.

---

### Task 7: Capacitor 8 shell (iOS + Android)

**Files:**
- Create: `capacitor.config.ts`, `src/lib/native.ts`, `src/lib/haptics.ts`, `resources/icon.png` + `resources/splash.png` (+ dark), `ios/` + `android/` (generated, committed)
- Modify: `package.json`, `vite.config.ts` (injectRegister), `src/main.tsx` (conditional SW), `src/analytics.ts` (platform prop), `src/vite-env.d.ts` (pwa client types), `src/components/QuestionCard.tsx` (haptic), `src/App.tsx` (status bar), `scripts/gen-icons.mjs` (1024/2732 outputs), `.gitignore`

**Interfaces:**
- Produces: `isNative: boolean` and `platform: 'ios' | 'android' | 'web'` from `@/lib/native`; `answerHaptic(correct: boolean)` from `@/lib/haptics`. Consumed by Task 8.

- [ ] **Step 1: Preflight (human dependency)**

Run: `xcodebuild -version`
Expected: `Xcode 26.x`. If it errors with "requires Xcode": Pavol must run `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` — ask and wait. If Xcode < 26: it must be updated via the App Store (uploads require the iOS 26 SDK since 2026-04-28).

- [ ] **Step 2: Install Capacitor**

```bash
npm i @capacitor/core @capacitor/haptics @capacitor/splash-screen @capacitor/status-bar
npm i -D @capacitor/cli @capacitor/ios @capacitor/android @capacitor/assets
```

- [ ] **Step 3: `capacitor.config.ts`**

```ts
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'org.dravec.autoskola',
  appName: 'Autoškola',
  webDir: 'dist',
  ios: { contentInset: 'automatic' },
}

export default config
```

- [ ] **Step 4: `src/lib/native.ts`**

```ts
import { Capacitor } from '@capacitor/core'

/** True inside the iOS/Android shell; false on the web (incl. PWA). */
export const isNative = Capacitor.isNativePlatform()
export const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web'
```

- [ ] **Step 5: Service worker only on web** — `vite.config.ts`: add `injectRegister: false` to the `VitePWA({...})` options. `src/main.tsx`: append

```ts
import { isNative } from './lib/native'

if (!isNative && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }))
}
```

and add `/// <reference types="vite-plugin-pwa/client" />` to `src/vite-env.d.ts`.

- [ ] **Step 6: Analytics platform dimension** — `src/analytics.ts`:

```ts
import { platform } from './lib/native'

export function track(event: string, props?: Record<string, unknown>): void {
  fw.track(event, { platform, ...props })
}
```

- [ ] **Step 7: Haptics** — `src/lib/haptics.ts`:

```ts
import { Haptics, NotificationType } from '@capacitor/haptics'
import { isNative } from './native'

/** Answer feedback tap; silent no-op on web and on any native failure. */
export function answerHaptic(correct: boolean): void {
  if (!isNative) return
  Haptics.notification({
    type: correct ? NotificationType.Success : NotificationType.Error,
  }).catch(() => {})
}
```

In `QuestionCard.tsx`, call it where an answer is chosen (both the click and keyboard paths route through `onAnswer`; wrap locally):

```tsx
const choose = (opt: Choice) => {
  answerHaptic(opt === question.correct)
  onAnswer(opt)
}
```

(and use `choose` in the button `onClick` + the keydown handler).

- [ ] **Step 8: Status bar** — in `src/App.tsx` top-level effect:

```tsx
useEffect(() => {
  if (!isNative) return
  import('@capacitor/status-bar').then(({ StatusBar, Style }) =>
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {}),
  )
}, [])
```

- [ ] **Step 9: Icon + splash sources** — extend `scripts/gen-icons.mjs` to also write `resources/icon.png` (1024×1024, mark on `#faf6ee`… match existing icon bg), `resources/splash.png` and `resources/splash-dark.png` (2732×2732, centred mark). Run it, then `npx capacitor-assets generate`.

- [ ] **Step 10: Add platforms**

```bash
npm run build
npx cap add ios
npx cap add android
npx cap sync
```

Then set in `ios/App/App/Info.plist`: `ITSAppUsesNonExemptEncryption` = `NO` (Boolean). Check Capacitor's generated `.gitignore` entries; commit both platform dirs.

- [ ] **Step 11: Gate + native build check**

```bash
npm run typecheck && npm test && npm run build && npx cap sync
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -destination 'generic/platform=iOS Simulator' build | tail -5
cd android && ./gradlew assembleDebug --quiet && cd ..
```

Expected: all green. (Vitest runs jsdom → `Capacitor.getPlatform()` returns `'web'`, nothing breaks; verify `npm test` explicitly.)

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(native): Capacitor 8 shell — iOS + Android, haptics, status bar, web-only SW"
```

---

### Task 8: Native sign-in (Apple on iOS, Google on Android)

**Files:**
- Modify: `src/auth/AuthContext.tsx`, `src/components/AuthPanel.tsx`, `ios/App/App/App.entitlements` (Sign in with Apple capability), `android/` per plugin docs
- Test: extend `src/components/AuthPanel.test.tsx` if present; otherwise a small RTL test that the Apple button renders only when `platform === 'ios'` (mock `@/lib/native`)

**Interfaces:**
- Consumes: `platform` (Task 7), `supabase` client.
- Produces: `signInWithApple(): Promise<void>` and native-aware `signInWithGoogle()` on `AuthContextValue`.

- [ ] **Step 1: Read the plugin docs first** — `npm i @capgo/capacitor-social-login`, then read its README (use context7 for current API) — verify the exact `login()`/`initialize()` signatures and the iOS/Android setup (entitlement, plist keys, Android client IDs) before writing code. The code below is the expected shape; reconcile with the docs.

- [ ] **Step 2: Failing test** — AuthPanel shows "Pokračovat přes Apple" when platform is ios (vi.mock `@/lib/native` with `platform: 'ios', isNative: true`), shows no Apple button on web.

- [ ] **Step 3: AuthContext** — add to the value object:

```ts
async signInWithApple() {
  if (!supabase) return
  const { SocialLogin } = await import('@capgo/capacitor-social-login')
  const res = await SocialLogin.login({ provider: 'apple', options: {} })
  const token = (res.result as { idToken?: string })?.idToken
  if (token) await supabase.auth.signInWithIdToken({ provider: 'apple', token })
},
```

and make `signInWithGoogle` platform-aware:

```ts
async signInWithGoogle() {
  if (!supabase) return
  if (isNative) {
    const { SocialLogin } = await import('@capgo/capacitor-social-login')
    await SocialLogin.initialize({ google: { webClientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID } })
    const res = await SocialLogin.login({ provider: 'google', options: {} })
    const token = (res.result as { idToken?: string })?.idToken
    if (token) await supabase.auth.signInWithIdToken({ provider: 'google', token })
    return
  }
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href },
  })
},
```

(`signInWithApple` added to `AuthContextValue`; import `isNative` from `@/lib/native`.)

- [ ] **Step 4: AuthPanel buttons** — above the email form, platform-conditional:

```tsx
{platform === 'ios' && (
  <button type="button" onClick={() => signInWithApple()}
    className="mb-2 w-full rounded-card border border-sand-500 bg-sand-100 px-4 py-2 text-sm font-semibold text-sand-950 hover:bg-white">
     Pokračovat přes Apple
  </button>
)}
{platform === 'android' && (
  <button type="button" onClick={() => signInWithGoogle()}
    className="mb-2 w-full rounded-card border border-sand-500 bg-sand-100 px-4 py-2 text-sm font-semibold text-sand-950 hover:bg-white">
    Pokračovat přes Google
  </button>
)}
```

- [ ] **Step 5: Platform config** — iOS: add Sign in with Apple entitlement per plugin docs; sync. Android: note the Google client-ID requirement in the human checklist (Task 10) — code no-ops gracefully until configured. Supabase dashboard Apple/Google provider setup is a human step (checklist).

- [ ] **Step 6: Gate** — `npm run typecheck && npm test && npm run build && npx cap sync` → green; iOS sim build still compiles.

- [ ] **Step 7: Commit** — `git commit -m "feat(auth): Sign in with Apple (iOS) + native Google (Android), always optional"`.

---

### Task 9: Store assets — screenshots + privacy page

**Files:**
- Create: `scripts/store-shots.mjs`, `public/privacy/index.html`
- Output: `docs/store/shots/` (committed)

- [ ] **Step 1: Privacy page** — `public/privacy/index.html`, plain static CZ page (copied into `dist/` by Vite automatically). Content must state: progress stored locally on device; optional sign-in (Apple/Google/e-mail) syncs progress via Supabase (EU region); first-party anonymous usage analytics (events, no advertising ID, not linked to identity, no sale of data); no ads, no third-party trackers; contact `pavol@dravecky.sk`; effective date. Keep it short, real sentences, no boilerplate wall. Verify `npm run build && ls dist/privacy/index.html`.

- [ ] **Step 2: Screenshot script** — `scripts/store-shots.mjs` (Playwright, follows `scripts/visual.mjs` conventions): for each device `{ name: 'iphone-69', width: 440, height: 956, scale: 3 }` and `{ name: 'ipad-13', width: 1032, height: 1376, scale: 2 }`, launch `vite preview`, capture: home, practice question with image, exam in progress, stats (seed exam history via `localStorage` init script), study guide, jízdy. Output PNGs to `docs/store/shots/<device>-<screen>.png` → exact pixel sizes 1320×2868 / 2064×2752.

- [ ] **Step 3: Run it** — `npm run build && node scripts/store-shots.mjs`; verify dimensions with `sips -g pixelWidth -g pixelHeight docs/store/shots/*.png`. Eyeball the iPad shots — this is the iPad layout pass; fix any broken layout found (expected: minor or none, Tailwind is responsive).

- [ ] **Step 4: Commit** — `git add scripts/store-shots.mjs public/privacy docs/store/shots && git commit -m "feat(store): privacy page + App Store screenshot generator"`.

---

### Task 10: Store metadata + submission checklist

**Files:**
- Create: `docs/store/app-store.md`

- [ ] **Step 1: Write the metadata document** — full paste-ready content:
  - **Name:** `Autoškola 2026: testy zdarma` · **Subtitle:** `Skutečně se nauč. Bez reklam.` · **Category:** Vzdělávání · **Age:** 4+ · **Price:** free.
  - **Description (CZ), leading with pedagogy** — draft (polish with /deslop before pasting):

    > Většina aplikací tě nechá donekonečna klikat testy. Autoškola tě látku nejdřív naučí: krátké lekce pokryjí všech sedm okruhů, chytré opakování ti vrací otázky, ve kterých chybuješ, a ostrý test si dáš, až když jsi připraven(a).
    >
    > • Všech 1136 oficiálních otázek Ministerstva dopravy, včetně obrázků a video animací
    > • Lekce krok za krokem — Studijní průvodce všemi okruhy
    > • Chytré opakování chyb (spaced repetition)
    > • Ostrý test přesně podle zkoušky: 25 otázek, 50 bodů, 30 minut, hranice 43 bodů
    > • Historie ostrých testů a signál připravenosti
    > • Deník jízd — hlídej si povinných 28 hodin za volantem
    > • Funguje offline, bez reklam, bez plateb — všechno zdarma
    >
    > Otázky průběžně aktualizujeme podle oficiální sady (datum aktualizace vidíš přímo v aplikaci).
  - **Keywords (100 chars):** `autoškola,testy,řidičák,etesty,zkouška,řidičský průkaz,značky,křižovatky,2026`
  - **URLs:** support + marketing `https://autoskola.dravec.org`, privacy `https://autoskola.dravec.org/privacy/`.
  - **Review notes:** "Sign-in is optional (progress sync only); the app is fully usable without an account — no demo credentials needed. Works fully offline."
  - **Privacy label mapping:** Usage Data → Product Interaction, *not linked to identity, not used for tracking*; if signed in: Contact Info → Email, linked, for app functionality (sync). No ads, no tracking across apps.
  - **Human checklist (ordered):** ① App Store Connect: create app record (bundle `org.dravec.autoskola`, SKU `autoskola-kviz`) ② DSA: declare **non-trader** ③ Supabase: enable Apple provider (Services ID + key), add Google Android client ID (`VITE_GOOGLE_WEB_CLIENT_ID`) ④ paste metadata + upload `docs/store/shots/` ⑤ privacy questionnaire per mapping above ⑥ age-rating questionnaire (all "none" → 4+) ⑦ Xcode: Signing & Capabilities → team, automatic signing, Sign in with Apple capability ⑧ Product → Archive → Distribute → App Store Connect ⑨ (optional) TestFlight internal on Pavol's iPhone ⑩ Submit for review — **only after Pavol's sign-off** ⑪ post-approval: availability CZ+SK first.

- [ ] **Step 2: Deslop pass** on the description (grade with the deslop skill, target SLOP ≤1). **Step 3: Commit** — `git commit -m "docs(store): App Store metadata + submission checklist"`.

---

### Task 11: Flywheel `ios-app` standard + portfolio + AGENTS.md

**Files:**
- Create: `~/my-git/flywheel/docs/standards/ios-app.md` (separate repo!)
- Modify: `~/my-git/flywheel/data/products/autoskola-kviz.json` (add ios channel/links), `AGENTS.md` (Release section: iOS channel)

- [ ] **Step 1: Write the standard** — actionable, command-level, product-agnostic. Sections: **Prereqs** (Apple Developer Program $99/yr — individual: legal name shown as seller, 24–48 h approval; org needs D-U-N-S; Xcode 26+ toolchain mandatory for uploads since 2026-04-28; `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`); **Recipe** (Capacitor 8 steps exactly as executed in Tasks 7–8, copy-pasteable); **Guideline 4.2 defense** (bundle assets locally, full offline function, haptics/status-bar/splash, never load a remote URL full-page; Airplane-mode is the reviewer test); **Guideline 4.8** (third-party login ⇒ must offer Sign in with Apple; email OTP alone is exempt); **Privacy label decision table** (nothing collected → "Data Not Collected"; flywheel analytics → Usage Data not linked; account sync → Email linked); **EU DSA** (trader vs non-trader; free no-monetization → non-trader; monetization later ⇒ switch + published address/phone); **Export compliance** (`ITSAppUsesNonExemptEncryption=NO`); **Screenshots** (6.9″ 1320×2868 required; 13″ iPad 2064×2752 if iPad enabled; generate via Playwright at viewport×scale); **TestFlight** (optional; internal needs no beta review); **Review reality** (~24–72 h; 40–60 % of first apps bounce once; top causes: offline blank screen, privacy-label mismatch, placeholder metadata, missing demo login); **Yearly ritual** (September: rebuild dataset, bump "2026"→"2027" in store name + metadata, new screenshots if UI changed); **Android portability** (`cap add android` at shell time ≈ free; Play submission is its own standard later). Cite the autoskola-kviz commits as the reference implementation.

- [ ] **Step 2: Portfolio record** — read `~/my-git/flywheel/data/products/autoskola-kviz.json`, add the iOS channel (store link placeholder until approved), keep schema as-is.

- [ ] **Step 3: AGENTS.md** — extend the Release section: iOS = `npm run build && npx cap sync && open ios/App/App.xcworkspace` → Archive → Distribute (human), plus "yearly rename ritual" pointer to the standard.

- [ ] **Step 4: Commit both repos** — flywheel repo: `git -C ~/my-git/flywheel add -A && git -C ~/my-git/flywheel commit -m "docs(standards): ios-app standard from autoskola-kviz reference run"`; this repo: commit AGENTS.md.

---

### Task 12: End-to-end verification (stop before submission)

- [ ] **Step 1: Full gate** — `npm run typecheck && npm test && npm run build && npx playwright test` → all green (playwright locally per AGENTS.md).
- [ ] **Step 2: iOS Simulator smoke** — `npx cap run ios` (pick an iPhone 17 sim). Verify: Theory journey incl. an animation question playing; Jízdy journey; exam → results → readiness line; stats → exam log; splash + status bar look right; safe areas respected (no content under the notch/home bar).
- [ ] **Step 3: Offline test (the 4.2 rehearsal)** — turn the Mac's network off, relaunch the app in the sim, run a full practice session + one animation question (bundled → must play). Expected: everything works; the only degradation allowed is silent analytics failure.
- [ ] **Step 4: iPad Simulator pass** — `npx cap run ios --target <iPad Pro 13>` → eyeball both journeys.
- [ ] **Step 5: Android smoke (side quest proof)** — `npx cap run android` on any emulator: app boots, quiz works. Nothing more.
- [ ] **Step 6: Report to Pavol** — summary + screenshots + the Task 10 human checklist. **STOP: Archive/upload/submission are Pavol's calls.**

---

## Self-review notes

- Spec coverage: videos (T1–3), shell (T7), auth (T8), exam history (T4–5), freshness (T1/T6), assets+metadata (T9–10), flywheel standard (T11), verification incl. Airplane (T12). Question 105489 resolved by T1–3.
- The one deliberate unknown: encoded video total size (T1 gate at 150 MB) and the social-login plugin's exact API (T8 step 1 verifies against current docs before coding). Both are explicit stop/verify points, not silent assumptions.
- Type/name consistency: `ExamHistory`/`recordExam`/`readiness` used identically in T4/T5; `isNative`/`platform` defined T7, consumed T8.
