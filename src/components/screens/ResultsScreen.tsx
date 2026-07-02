import { useEffect } from 'react'
import { useApp } from '@/app/AppContext'
import { track } from '@/analytics'
import { score, wrongAnswers } from '@/domain/session'
import { getQuestion } from '@/domain/questions'
import { makeRng, timeSeed } from '@/domain/rng'
import { ProgressBar } from '@/components/ui/ProgressBar'

export function ResultsScreen() {
  const { state, dispatch } = useApp()
  const { session, examResult, mode } = state
  if (!session) return null

  const isExam = mode === 'exam'
  const isLesson = mode === 'lesson'
  // Exams score in points (official model, 50 max); practice counts questions.
  const total = isExam && examResult ? examResult.total : session.questions.length
  const correct = isExam && examResult ? examResult.score : score(session)
  const wrong = wrongAnswers(session)

  useEffect(() => {
    const name = isExam ? 'exam_finish' : isLesson ? 'lesson_complete' : 'session_finish'
    track(name, { mode, score: correct, total, passed: examResult?.passed })
    // fire once per results view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="rounded-card border border-sand-700 bg-sand-800/40 p-6 text-center">
        {isLesson && (
          <div className="mb-4">
            <div className="font-display text-2xl font-bold uppercase tracking-tight text-moss-400">
              Lekce dokončena
            </div>
            <div className="mt-2 inline-flex items-center gap-2 rounded-card border border-terra-500/60 bg-terra-500/10 px-4 py-1.5">
              <span className="font-mono text-lg font-semibold tabular-nums text-terra-300">
                {state.progress.streak.current}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-sand-400">
                {state.progress.streak.current === 1 ? 'den' : 'dní'} v řadě
              </span>
            </div>
          </div>
        )}
        {isExam && examResult && (
          <div
            className={`mb-3 inline-block border px-4 py-1 font-mono text-sm font-semibold uppercase tracking-[0.15em] ${
              examResult.passed
                ? 'border-moss-500 text-moss-400'
                : 'border-rust-500 text-rust-400'
            }`}
          >
            {examResult.passed ? 'Prospěl(a)' : 'Neprospěl(a)'}
          </div>
        )}
        <div className="font-mono text-6xl font-semibold text-terra-300 tabular-nums">
          {correct}
          <span className="text-2xl text-sand-500"> / {total}</span>
        </div>
        {isExam && examResult && (
          <p className="mt-2 text-sm text-sand-400">
            Pro úspěch {examResult.passThreshold} z {total} bodů.
          </p>
        )}
      </div>

      {isExam && examResult && (
        <section className="mt-6 space-y-3">
          {Object.entries(examResult.byCategory).map(([cat, b]) => (
            <ProgressBar
              key={cat}
              label={cat}
              value={b!.correct}
              max={b!.total}
              tone="moss"
            />
          ))}
        </section>
      )}

      {wrong.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-rust-400">
            Chybné odpovědi ({wrong.length})
          </h2>
          <ul className="space-y-3">
            {wrong.map((r) => {
              const q = getQuestion(r.id)
              if (!q) return null
              return (
                <li
                  key={r.id}
                  className="rounded-card border border-sand-700 bg-sand-900/50 p-4"
                >
                  <p className="mb-2 text-sm text-sand-200">{q.q}</p>
                  <p className="text-sm text-moss-400">
                    <span className="font-semibold uppercase">{q.correct})</span>{' '}
                    {q[q.correct]}
                  </p>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {isLesson && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'startLesson', rng: makeRng(timeSeed()) })}
            className="glow-terra rounded-card bg-terra-500 px-5 py-2.5 font-display font-semibold uppercase tracking-wide text-sand-950 hover:bg-terra-400"
          >
            Další lekce
          </button>
        )}
        {wrong.length > 0 && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'startReview', rng: makeRng(timeSeed()) })}
            className="rounded-card border border-sand-600 px-5 py-2.5 font-semibold text-sand-200 hover:border-sand-400"
          >
            Opakovat chyby
          </button>
        )}
        <button
          type="button"
          onClick={() => dispatch({ type: 'goMenu' })}
          className="rounded-card border border-sand-600 px-5 py-2.5 font-semibold text-sand-200 hover:border-sand-400"
        >
          Zpět na rozcestník
        </button>
      </div>
    </div>
  )
}
