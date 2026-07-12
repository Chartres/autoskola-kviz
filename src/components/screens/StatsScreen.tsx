import { useMemo } from 'react'
import { useApp } from '@/app/AppContext'
import { ALL_QUESTIONS, META } from '@/domain/questions'
import { summary } from '@/domain/progress'
import { readiness } from '@/domain/examHistory'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { InfoDot } from '@/components/ui/InfoDot'

export function StatsScreen() {
  const { state } = useApp()
  const sum = useMemo(() => summary(state.progress, ALL_QUESTIONS), [state.progress])

  const stats = [
    {
      testId: 'stat-mastered',
      label: 'Zvládnuto',
      value: sum.mastered,
      info: 'Otázky zodpovězené správně 2× po sobě — pak je považujeme za naučené.',
    },
    {
      testId: 'stat-answered',
      label: 'Procvičeno',
      value: sum.answered,
      info: 'Kolik různých otázek jste už alespoň jednou viděli.',
    },
    {
      testId: 'stat-accuracy',
      label: 'Úspěšnost',
      value: `${Math.round(sum.accuracy * 100)}%`,
      info: 'Podíl správných odpovědí ze všech vašich pokusů.',
    },
  ]

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-2">
      <h1 className="mb-5 font-display text-2xl font-bold tracking-tight text-sand-50">
        Postup
      </h1>

      <div className="mb-8 grid grid-cols-3 gap-4 rounded-card border border-sand-700 bg-sand-800/40 p-5 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <div
              data-testid={s.testId}
              className="font-mono text-2xl font-semibold text-terra-300 tabular-nums"
            >
              {s.value}
            </div>
            {/* 0.65rem + 0.1em keeps label + dot on one line at 390px */}
            <div className="mt-0.5 whitespace-nowrap font-mono text-[0.65rem] uppercase tracking-[0.1em] text-sand-500">
              {s.label}
              <InfoDot text={s.info} />
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.2em] text-sand-400">
        Pokrok podle okruhů
      </h2>
      <div className="space-y-5">
        {META.categories.map((c) => {
          const b = sum.byCategory[c.name]
          const seen = b ? b.seen : 0
          const mastered = b ? b.mastered : 0
          return (
            <div key={c.id}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                <span className="text-sand-200">{c.name}</span>
                <span className="font-mono text-xs text-sand-500 tabular-nums">
                  {mastered} zvládnuto · {seen} procvičeno / {c.count}
                </span>
              </div>
              {/* procvičeno (seen) as the bar; mastered shown numerically above */}
              <ProgressBar value={seen} max={c.count} tone="terra" />
            </div>
          )
        })}
      </div>

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
            {state.examHistory.exams
              .slice(-10)
              .reverse()
              .map((e) => (
                <li
                  key={e.at}
                  className="flex items-center justify-between rounded-card border border-sand-700 bg-sand-900/50 px-4 py-2 text-sm"
                >
                  <span className="text-sand-400">
                    {new Date(e.at).toLocaleDateString('cs-CZ')}
                  </span>
                  <span className="font-mono tabular-nums text-sand-200">
                    <span>{e.score}</span>
                    <span className="text-sand-500"> / </span>
                    <span>{e.total}</span>
                  </span>
                  <span className={e.passed ? 'text-moss-400' : 'text-rust-400'}>
                    {e.passed ? 'Prospěl(a)' : 'Neprospěl(a)'}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  )
}
