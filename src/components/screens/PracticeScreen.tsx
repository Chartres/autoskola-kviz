import { useMemo } from 'react'
import { useApp } from '@/app/AppContext'
import { META } from '@/domain/questions'
import { missedIds } from '@/domain/progress'
import { filterQuestions } from '@/domain/selection'
import { timeSeed, makeRng } from '@/domain/rng'
import { track } from '@/analytics'
import type { CategoryName } from '@/domain/types'

export function PracticeScreen() {
  const { state, dispatch } = useApp()
  const bookmarkCount = state.progress.bookmarks.length
  const missedCount = useMemo(
    () => missedIds(state.progress).length,
    [state.progress],
  )
  const selectedCount = state.selectedCategories.size

  // Live count of what "Spustit procvičování" will serve (categories ∩ search).
  const practiceCount = useMemo(
    () =>
      filterQuestions({
        categories: state.selectedCategories,
        search: state.search,
      }).length,
    [state.selectedCategories, state.search],
  )

  function toggleCat(name: CategoryName) {
    const next = new Set(state.selectedCategories)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    dispatch({ type: 'setCategories', categories: next })
  }

  const rng = () => makeRng(timeSeed())

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-2">
      <h1 className="mb-4 font-display text-2xl font-bold uppercase tracking-tight text-sand-50">
        Procvičovat
      </h1>

      {/* MODE 1 — exam simulation */}
      <button
        type="button"
        onClick={() => {
          track('start_exam')
          dispatch({ type: 'startExam', rng: rng(), now: Date.now() })
        }}
        className="mb-5 flex w-full items-center justify-between gap-3 rounded-card border border-sand-700 bg-sand-800/40 p-4 text-left transition-colors hover:border-sand-500"
      >
        <span>
          <span className="block font-display text-lg font-semibold uppercase tracking-wide text-sand-50">
            Zkušební test
          </span>
          <span className="mt-0.5 block text-sm text-sand-400">
            {META.exam.totalQuestions} otázek, {META.exam.timeLimitMinutes} minut — jako u zkoušky.
          </span>
        </span>
        <span aria-hidden className="font-display text-terra-400">
          →
        </span>
      </button>

      {/* MODE 2 — practice by topic */}
      <section className="rounded-card border border-sand-700 bg-sand-800/40 p-4">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-sand-50">
          Procvičit okruhy
        </h2>
        <p className="mt-0.5 mb-3 text-sm text-sand-400">
          Vyberte okruhy (nic nevybráno = všechny).
        </p>
        <div className="flex flex-wrap gap-2">
          {META.categories.map((c) => {
            const active = state.selectedCategories.has(c.name)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCat(c.name)}
                aria-pressed={active}
                className={`border px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? 'border-terra-500 bg-terra-500/15 text-terra-300'
                    : 'border-sand-700 text-sand-300 hover:border-sand-500'
                }`}
              >
                {c.name}
                <span className="ml-2 font-mono text-xs text-sand-500 tabular-nums">
                  {c.count}
                </span>
              </button>
            )
          })}
        </div>

        <label className="mt-3 block">
          <span className="sr-only">Zúžit hledáním</span>
          <input
            type="search"
            value={state.search}
            onChange={(e) => dispatch({ type: 'setSearch', search: e.target.value })}
            placeholder="Zúžit hledáním ve znění otázek (volitelné)…"
            className="w-full rounded-card border border-sand-700 bg-sand-900/60 px-4 py-2.5 text-sm text-sand-100 placeholder:text-sand-500 focus:border-terra-500 focus:outline-none"
          />
        </label>

        <p className="mt-3 text-xs text-sand-500">
          {selectedCount === 0 ? 'Všechny okruhy' : `Vybráno okruhů: ${selectedCount}`}
          {state.search.trim() && ' · filtr hledání'} ·{' '}
          <span className="text-sand-300 tabular-nums">{practiceCount}</span> otázek
        </p>

        <button
          type="button"
          disabled={practiceCount === 0}
          onClick={() => {
            track('start_practice')
            dispatch({ type: 'startPractice', rng: rng() })
          }}
          className="glow-terra mt-3 w-full rounded-card bg-terra-500 px-5 py-3 font-display font-semibold uppercase tracking-wide text-sand-950 transition-colors hover:bg-terra-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Spustit procvičování
        </button>
      </section>

      {/* Missed questions — the error-drilling queue (points-weighted) */}
      <button
        type="button"
        disabled={missedCount === 0}
        onClick={() => {
          track('start_review')
          dispatch({ type: 'startReview', rng: rng() })
        }}
        className="mt-4 flex w-full items-center justify-between rounded-card border border-sand-700 bg-sand-800/40 px-5 py-3.5 text-left transition-colors hover:border-sand-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="font-medium text-sand-100">Moje chyby</span>
        <span className="font-mono text-sm text-rust-400 tabular-nums">
          {missedCount > 0 ? `${missedCount} otázek →` : 'žádné'}
        </span>
      </button>

      {/* Bookmarks */}
      <button
        type="button"
        disabled={bookmarkCount === 0}
        onClick={() => {
          track('start_bookmarks')
          dispatch({ type: 'startBookmarks', rng: rng() })
        }}
        className="mt-4 flex w-full items-center justify-between rounded-card border border-sand-700 bg-sand-800/40 px-5 py-3.5 text-left transition-colors hover:border-sand-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="font-medium text-sand-100">★ Záložky</span>
        <span className="font-mono text-sm text-sand-400 tabular-nums">
          {bookmarkCount > 0 ? `${bookmarkCount} otázek →` : 'žádné'}
        </span>
      </button>
    </div>
  )
}
