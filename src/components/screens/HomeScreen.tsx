import { useMemo } from 'react'
import { useApp } from '@/app/AppContext'
import { ALL_QUESTIONS, META } from '@/domain/questions'
import { summary, missedIds } from '@/domain/progress'
import { LESSON_SIZE } from '@/domain/lesson'
import { timeSeed, makeRng } from '@/domain/rng'
import { formatDateCs } from '@/lib/date'
import { track } from '@/analytics'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { CategoryName } from '@/domain/types'

export function HomeScreen() {
  const { state, dispatch } = useApp()
  const sum = useMemo(() => summary(state.progress, ALL_QUESTIONS), [state.progress])
  const reviewCount = useMemo(
    () => missedIds(state.progress).length,
    [state.progress],
  )
  const streak = state.progress.streak.current
  const rng = () => makeRng(timeSeed())
  const showJizdyCta = sum.total > 0 && sum.mastered / sum.total >= 0.7

  // Free topic choice from day 1 — no locked path (Montessori).
  function startTopic(name: CategoryName) {
    track('start_topic', { topic: name })
    dispatch({ type: 'setCategories', categories: new Set([name]) })
    dispatch({ type: 'startPractice', rng: rng() })
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-2">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight text-sand-50">
          Autoškola kvíz
        </h1>
        <div className="flex items-center gap-2 rounded-card border border-sand-700 px-3 py-1.5">
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
      </header>

      <p className="-mt-2 mb-4 text-sm text-sand-400">
        Příprava na teoretickou zkoušku — řidičský průkaz skupiny B
      </p>

      {/* Primary job: today's short set */}
      <button
        type="button"
        onClick={() => {
          track('start_lesson')
          dispatch({ type: 'startLesson', rng: rng() })
        }}
        className="glow-terra mb-3 block w-full rounded-card border border-terra-500/50 bg-terra-500/10 p-5 text-left transition-colors hover:bg-terra-500/20"
      >
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-terra-400">
          Denní dávka
        </div>
        <div className="mt-1 font-display text-2xl font-bold tracking-tight text-sand-50">
          Procvičit {LESSON_SIZE} otázek
        </div>
        <div className="mt-1 text-sm text-sand-300">
          Krátká dávka na míru — opakování slabých míst i nové otázky.
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-card bg-terra-500 px-4 py-2 font-display text-sm font-semibold text-sand-950">
          Začít →
        </div>
      </button>

      {/* Quick review of weak spots */}
      {reviewCount > 0 && (
        <button
          type="button"
          onClick={() => {
            track('start_review')
            dispatch({ type: 'startReview', rng: rng() })
          }}
          className="mb-3 flex w-full items-center justify-between rounded-card border border-sand-700 bg-sand-800/40 px-5 py-3.5 text-left transition-colors hover:border-sand-500"
        >
          <span className="font-medium text-sand-100">Moje chyby</span>
          <span className="font-mono text-sm text-rust-400 tabular-nums">
            {reviewCount} otázek →
          </span>
        </button>
      )}

      {/* Free topic choice — every okruh open from day 1 */}
      <section className="mb-3">
        <h2 className="mb-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-sand-400">
          Okruhy
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {META.categories.map((c) => {
            const b = sum.byCategory[c.name]
            const mastered = b ? b.mastered : 0
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => startTopic(c.name)}
                className="rounded-card border border-sand-700 bg-sand-800/40 p-3 text-left transition-colors hover:border-terra-400"
              >
                <div className="text-sm font-semibold leading-snug text-sand-100">
                  {c.name}
                </div>
                <div className="mt-1 font-mono text-xs text-sand-500 tabular-nums">
                  {mastered} / {c.count} zvládnuto
                </div>
                <div className="mt-2">
                  <ProgressBar value={mastered} max={c.count} tone="moss" />
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <p className="mt-8 text-center font-mono text-xs text-sand-600">
        Otázky aktualizovány k {formatDateCs(META.generatedAt)}
      </p>

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
