import { useMemo, useState } from 'react'
import { useApp } from '@/app/AppContext'
import { ALL_QUESTIONS, META } from '@/domain/questions'
import { summary, missedIds, isStreakActive } from '@/domain/progress'
import { LESSON_SIZE } from '@/domain/lesson'
import { freshRng } from '@/domain/rng'
import { track } from '@/analytics'
import { AuthPanel } from '@/components/AuthPanel'
import { todayStr } from '@/lib/date'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { CategoryName } from '@/domain/types'
import { roundSummary } from '@/app/round'
import { PassengerPicker, PassengerPortrait } from '@/components/Passenger'
import heroArt from '@/components/passengers/hero.svg?raw'
import { readiness, formatPoints, MIN_ANSWERS } from '@/domain/readiness'
import { loadExamPlan, shouldAskResult } from '@/domain/examPlan'
import { ExamDateField, ExamResultCard } from '@/components/ExamResult'

export function HomeScreen() {
  const { state, dispatch } = useApp()
  const sum = useMemo(() => summary(state.progress, ALL_QUESTIONS), [state.progress])
  const reviewCount = useMemo(
    () => missedIds(state.progress).length,
    [state.progress],
  )
  // M7: only show the stored current value when the streak is still alive.
  // If lastDate is 2+ days ago the streak is broken but still shows as current
  // in storage — display 0 until the user completes a lesson to reset it.
  const streak = isStreakActive(state.progress.streak, todayStr())
    ? state.progress.streak.current
    : 0
  const ready = useMemo(() => readiness(state.progress), [state.progress])
  // Exam date on this device; after it, ask once how the exam went (decided per visit, so the
  // card can thank the learner after an answer instead of vanishing).
  const [examPlan, setExamPlan] = useState(loadExamPlan)
  const [askResult] = useState(() => shouldAskResult(examPlan, todayStr()))
  const showJizdyCta = sum.total > 0 && sum.mastered / sum.total >= 0.7

  // Free topic choice from day 1 — no locked path (Montessori).
  function startTopic(name: CategoryName) {
    track('start_practice', { topic: name, from: 'home' })
    dispatch({ type: 'setCategories', categories: new Set([name]) })
    dispatch({ type: 'setSearch', search: '' })
    dispatch({ type: 'startPractice', rng: freshRng() })
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-2">
      {/* The poster: the number that matters on the horizon, 43 of 50 points. Two passengers
          live in it; the drawing is our own SVG and takes its inks from the theme. */}
      <header className="relative -mx-4 mb-5 overflow-hidden sm:mx-0 sm:rounded-card">
        <div aria-hidden="true" className="hero-art" dangerouslySetInnerHTML={{ __html: heroArt }} />
        <div aria-hidden="true" className="pointer-events-none absolute right-5 top-0">
          <PassengerPortrait id="stromecek" size={64} />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute bottom-1 left-3">
          <PassengerPortrait id="kuzel" size={58} />
        </div>
        <div className="absolute inset-x-0 top-0 px-4 pt-4">
          <h1 className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-sand-400">
            Autoškola kvíz
          </h1>
          <p className="mt-1 max-w-[12rem] font-display text-[1.65rem] text-sand-50">
            43 bodů z 50.
          </p>
          <p className="mt-1 max-w-[11rem] text-sm leading-snug text-sand-300">
            Víc nepotřebujete. Míň nestačí.
          </p>
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-card bg-sand-950/90 px-3 py-1.5 backdrop-blur">
            <span aria-hidden className="text-terra-400">
              ▲
            </span>
            <span className="font-mono text-lg font-semibold tabular-nums text-terra-300">
              {streak}
            </span>
            <span className="font-mono text-[0.65rem] uppercase tracking-wide text-sand-500">
              {streak === 1 ? 'den' : 'dní'} v řadě
            </span>
          </div>
          <AuthPanel />
        </div>
      </header>

      {askResult && <ExamResultCard plan={examPlan} ready={ready} onChange={setExamPlan} />}

      {/* A set left partway waits here: same questions, from the first unanswered one. */}
      {state.pendingRound && <ResumeCard />}

      {/* Primary job: today's short set */}
      <button
        type="button"
        onClick={() => {
          track('start_lesson')
          dispatch({ type: 'startLesson', rng: freshRng() })
        }}
        className="glow-terra mb-4 block w-full rounded-card bg-sign-yellow p-5 text-left transition-transform hover:-translate-y-0.5"
      >
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-sand-50">
          Denní dávka
        </div>
        <div className="mt-1 font-display text-2xl font-bold tracking-tight text-sand-50">
          Procvičit {LESSON_SIZE} otázek
        </div>
        <div className="mt-1 text-sm text-sand-300">
          Krátká dávka na míru — opakování slabých míst i nové otázky.
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-card bg-terra-500 px-4 py-2 font-display text-sm font-semibold text-sand-950">
          Užít dnešní dávku →
        </div>
      </button>

      {/* Quick review of weak spots */}
      {reviewCount > 0 && (
        <button
          type="button"
          onClick={() => {
            track('start_review')
            dispatch({ type: 'startReview' })
          }}
          className="mb-3 flex w-full items-center justify-between rounded-card border border-sand-700 bg-sand-800/40 px-5 py-3.5 text-left transition-colors hover:border-sand-500"
        >
          <span className="font-medium text-sand-100">Moje chyby</span>
          <span className="font-mono text-sm text-rust-400 tabular-nums">
            {reviewCount} otázek →
          </span>
        </button>
      )}

      {/* Free topic choice — every okruh open from day 1. Each tile shows the points the okruh
          is expected to bring in the exam (Připravenost, Bloom), against what it carries. */}
      <section className="mb-3" aria-labelledby="okruhy-title">
        <h2 id="okruhy-title" className="mb-1 font-mono text-xs font-medium uppercase tracking-[0.2em] text-sand-400">
          Okruhy · body u zkoušky
        </h2>
        <p data-testid="readiness-total" className="mb-2 text-sm text-sand-300">
          {ready.expected !== null ? (
            <>
              Odhad u zkoušky:{' '}
              <span className="font-mono font-semibold tabular-nums text-terra-300">{formatPoints(ready.expected)}</span>{' '}
              z {ready.max} bodů · potřeba {ready.needed}
            </>
          ) : (
            <>
              {ready.okruhy.some((o) => o.expected !== null)
                ? 'Celkový odhad se ukáže, až bude odhad u všech okruhů.'
                : `Odhad bodů se u okruhu ukáže po ${MIN_ANSWERS} zodpovězených otázkách.`}{' '}
              K úspěchu je potřeba {ready.needed} z {ready.max}.
            </>
          )}
        </p>
        <ExamDateField plan={examPlan} onChange={setExamPlan} />
        <div className="grid grid-cols-2 gap-2">
          {META.categories.map((c, i) => {
            const r = ready.okruhy.find((o) => o.cat === c.name)
            const weakest = ready.weakest === c.name
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => startTopic(c.name)}
                className={`sheet rounded-card border p-3 text-left transition-colors hover:border-sand-400 ${
                  weakest ? 'border-terra-500' : 'border-sand-700'
                }`}
              >
                <div className="flex items-start gap-2 text-sm font-semibold leading-snug text-sand-100">
                  {/* The seven okruhy as numbered stops on the way to the exam. */}
                  <span aria-hidden="true" className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-sand-50 font-mono text-xs text-sand-950">
                    {i + 1}
                  </span>
                  <span>{c.name}</span>
                </div>
                {weakest && (
                  <div className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-terra-300">
                    Nejvíc ztrát
                  </div>
                )}
                {r && r.expected !== null ? (
                  <>
                    <div className="mt-1 font-mono text-xs text-sand-500 tabular-nums">
                      {formatPoints(r.expected)} z {r.max} {r.max === 1 ? 'bodu' : 'bodů'}
                    </div>
                    <div className="mt-2">
                      <ProgressBar
                        value={r.expected}
                        max={r.max}
                        tone="moss"
                        ariaLabel={`${c.name}: odhad bodů`}
                        valueText={`${formatPoints(r.expected)} z ${r.max} ${r.max === 1 ? 'bodu' : 'bodů'}`}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mt-1 font-mono text-xs text-sand-500 tabular-nums">
                      max. {r ? points(r.max) : ''}
                      <span className="block">zatím {r?.answered ?? 0}/{MIN_ANSWERS} otázek</span>
                    </div>
                    {/* No bar yet: an empty one would read as zero points. */}
                    <div aria-hidden className="mt-2 h-1.5 border-t border-dashed border-sand-700" />
                  </>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <div className="lane my-5" aria-hidden="true" />
      <PassengerPicker />

      {/* Cross-promo: nudge strong theory learners to start practical lessons */}
      {showJizdyCta && (
        <button
          type="button"
          data-testid="jizdy-cta"
          onClick={() => dispatch({ type: 'navigate', view: 'jizdy' })}
          className="mb-3 block w-full rounded-card border border-terra-500/50 bg-terra-500/10 p-5 text-left transition-colors hover:bg-terra-500/20"
        >
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-terra-400">
            Praktická jízda
          </div>
          <div className="mt-1 font-display text-lg font-bold text-sand-50">
            Teorie zvládnutá? Přejdi na jízdy →
          </div>
        </button>
      )}

      {/* Compact progress — details live under Postup */}
      <button
        type="button"
        onClick={() => dispatch({ type: 'navigate', view: 'stats' })}
        className="block w-full rounded-card border border-sand-700 bg-sand-800/40 p-5 text-left transition-colors hover:border-sand-500"
      >
        <div className="mb-3 flex items-baseline justify-between">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-sand-400">
            Můj postup
          </span>
          <span className="text-xs text-terra-400">Podrobnosti →</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Mini testId="stat-mastered" value={sum.mastered} label="Zvládnuto" />
          <Mini testId="stat-answered" value={sum.answered} label="Procvičeno" />
          <Mini
            testId="stat-accuracy"
            value={`${Math.round(sum.accuracy * 100)}%`}
            label="Úspěšnost"
          />
        </div>
        <div className="mt-4">
          <ProgressBar value={sum.mastered} max={sum.total} tone="moss" />
        </div>
      </button>
    </div>
  )
}

function Mini({
  value,
  label,
  testId,
}: {
  value: number | string
  label: string
  testId?: string
}) {
  return (
    <div>
      <div
        data-testid={testId}
        className="font-mono text-xl font-semibold text-terra-300 tabular-nums"
      >
        {value}
      </div>
      <div className="mt-0.5 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-sand-500">
        {label}
      </div>
    </div>
  )
}

function ResumeCard() {
  const { state, dispatch } = useApp()
  const r = roundSummary(state.pendingRound!)
  return (
    <section
      aria-labelledby="resume-title"
      className="mb-3 rounded-card border border-sand-600 bg-sand-800/60 p-5"
    >
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-sand-400">
        Rozpracovaná sada
      </div>
      <h2 id="resume-title" className="mt-1 font-display text-xl font-bold tracking-tight text-sand-50">
        {r.title}
      </h2>
      <p className="mt-1 text-sm text-sand-300 tabular-nums">
        {r.correcting
          ? `Oprava chyb · zodpovězeno ${r.answered} z ${r.total}`
          : `Zodpovězeno ${r.answered} z ${r.total}`}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            track('key_action', { action: 'round_resumed', mode: state.pendingRound!.mode, answered: r.answered, total: r.total })
            dispatch({ type: 'resumeRound' })
          }}
          className="min-h-11 rounded-card bg-terra-500 px-4 py-2 font-display text-sm font-semibold text-sand-950 hover:bg-terra-400"
        >
          Pokračovat →
        </button>
        <button
          type="button"
          onClick={() => {
            const saved = state.pendingRound!
            if (saved.mode === 'lesson') track('start_lesson', { from: 'resume-prompt' })
            else track('start_practice', { topic: saved.practiceSet?.label, from: 'resume-prompt' })
            dispatch({ type: 'newRound', rng: freshRng() })
          }}
          className="min-h-11 rounded-card border border-sand-600 px-4 py-2 text-sm font-semibold text-sand-200 hover:border-sand-400"
        >
          Nový trénink
        </button>
      </div>
    </section>
  )
}

/** "1 bod", "2 body", "8 bodů". */
function points(n: number): string {
  return `${n} ${n === 1 ? 'bod' : n < 5 ? 'body' : 'bodů'}`
}
