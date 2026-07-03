import { useState, useMemo } from 'react'
import { useApp } from '@/app/AppContext'
import { skillCoverage, isReady } from '@/domain/jizdy'
import type { LessonRecord } from '@/domain/jizdy'
import rawSkillsData from '@data/jizdy-skills.json'

// ponytail: provisional wrapper per referee ruling — import .skills only
const SKILLS = rawSkillsData.skills

function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function JizdyScreen() {
  const { state, dispatch } = useApp()

  const coverage = useMemo(
    () => skillCoverage(state.jizdyState, SKILLS),
    [state.jizdyState],
  )
  const readyCount = useMemo(
    () => SKILLS.filter((s) => (coverage[s.id] ?? 0) >= s.requiredReps).length,
    [coverage],
  )
  const ready = useMemo(() => isReady(state.jizdyState, SKILLS), [state.jizdyState])

  // skills practiced in a lesson today (for "fresh-today" highlight)
  const freshToday = useMemo(() => {
    const today = todayDate()
    const ids = new Set<string>()
    for (const lesson of state.jizdyState.lessons) {
      if (lesson.date === today) lesson.skills.forEach((id) => ids.add(id))
    }
    return ids
  }, [state.jizdyState])

  const [formOpen, setFormOpen] = useState(true)
  const [date, setDate] = useState(todayDate)
  const [duration, setDuration] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmed, setConfirmed] = useState(false)

  function toggleSkill(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const dur = parseInt(duration, 10)
    if (!dur || selected.size === 0) return
    const record: LessonRecord = {
      id: `${date}-${Date.now()}`,
      date,
      durationMin: dur,
      skills: Array.from(selected),
    }
    dispatch({ type: 'logLesson', record })
    setDate(todayDate())
    setDuration('')
    setSelected(new Set())
    setConfirmed(true)
    setFormOpen(false)
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-2">
      <header className="mb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight text-sand-50">
          Jízdy
        </h1>
        <p className="mt-1 font-mono text-sm text-sand-400">
          Připraveno:{' '}
          <span className="text-terra-400">
            {readyCount} / {SKILLS.length}
          </span>{' '}
          dovedností
          {ready && (
            <span className="ml-2 text-moss-400">— připraveno na zkoušku</span>
          )}
        </p>
      </header>

      {/* Log form */}
      {formOpen ? (
        <section
          aria-label="Zaznamenat jízdu"
          className="mb-4 rounded-card border border-sand-700 bg-sand-800/40 p-4"
        >
          <h2 className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.2em] text-sand-400">
            Zaznamenat jízdu
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="font-mono text-xs text-sand-500">Datum</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="rounded border border-sand-700 bg-sand-900 px-2 py-1.5 text-sm text-sand-100 focus:border-terra-500 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-xs text-sand-500">Délka (min)</span>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min={1}
                  max={300}
                  placeholder="60"
                  required
                  className="rounded border border-sand-700 bg-sand-900 px-2 py-1.5 text-sm text-sand-100 focus:border-terra-500 focus:outline-none"
                />
              </label>
            </div>

            <div className="mb-3">
              <div className="mb-2 font-mono text-xs text-sand-500">
                Procvičené dovednosti
              </div>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((skill) => {
                  const checked = selected.has(skill.id)
                  return (
                    <label
                      key={skill.id}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                        checked
                          ? 'border-terra-400 text-terra-400 ring-1 ring-terra-400/60'
                          : 'border-sand-700 text-sand-400 hover:border-sand-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleSkill(skill.id)}
                      />
                      {skill.label}
                    </label>
                  )
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={selected.size === 0 || !duration}
              className="inline-flex items-center gap-2 rounded-card bg-terra-500 px-4 py-2 font-display text-sm font-semibold text-sand-950 transition-opacity disabled:opacity-40"
            >
              Uložit jízdu
            </button>
          </form>
        </section>
      ) : (
        <div className="mb-4">
          {confirmed && (
            <div
              role="status"
              className="mb-3 rounded-card border border-moss-400/40 bg-moss-400/10 px-4 py-3 text-sm text-moss-400"
            >
              Jízda zaznamenána
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setFormOpen(true)
              setConfirmed(false)
            }}
            className="rounded-card border border-terra-500/50 bg-terra-500/10 px-4 py-2 font-display text-sm font-semibold text-terra-400 transition-colors hover:bg-terra-500/20"
          >
            + Zaznamenat další jízdu
          </button>
        </div>
      )}

      {/* Skills checklist */}
      <section aria-label="Přehled dovedností">
        <h2 className="mb-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-sand-400">
          Dovednosti
        </h2>
        <ul className="space-y-1.5">
          {SKILLS.map((skill) => {
            const reps = coverage[skill.id] ?? 0
            const adequate = reps >= skill.requiredReps
            const fresh = freshToday.has(skill.id)
            return (
              <li
                key={skill.id}
                className={`flex items-center justify-between rounded-card border px-3 py-2 text-sm ${
                  adequate
                    ? 'border-moss-400/50 bg-moss-400/10 text-moss-400'
                    : fresh
                      ? 'border-terra-400/50 bg-terra-500/10 text-sand-300'
                      : 'border-sand-700 bg-sand-800/40 text-sand-300'
                }`}
              >
                <span>{skill.label}</span>
                <span className="font-mono text-xs tabular-nums text-sand-500">
                  {reps} / {skill.requiredReps}
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
