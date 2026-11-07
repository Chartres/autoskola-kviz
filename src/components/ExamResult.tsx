import { useEffect, useRef, useState } from 'react'
import { track } from '@/analytics'
import {
  markReported,
  readinessBucket,
  saveExamPlan,
  setExamDate,
  type ExamPlan,
  type ExamResultAnswer,
} from '@/domain/examPlan'
import type { Readiness } from '@/domain/readiness'

/** The exam date, kept on this device. Under the readiness line on Home. */
export function ExamDateField({ plan, onChange }: { plan: ExamPlan; onChange: (p: ExamPlan) => void }) {
  return (
    <div className="mb-2 flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-sand-300">
      <label htmlFor="exam-date">Termín zkoušky</label>
      <input
        id="exam-date"
        aria-describedby="exam-date-hint"
        type="date"
        value={plan.date ?? ''}
        onChange={(e) => {
          const next = setExamDate(plan, e.target.value)
          saveExamPlan(next)
          onChange(next)
        }}
        className="min-h-11 rounded-card border border-sand-700 bg-sand-900/60 px-3 py-1.5 font-mono text-sm text-sand-100 focus:border-terra-500 focus:outline-none"
      />
      <span id="exam-date-hint" className="w-full text-xs text-sand-500">Zůstane jen v tomto zařízení.</span>
    </div>
  )
}

const ANSWERS: { result: ExamResultAnswer; label: string }[] = [
  { result: 'passed', label: 'Složil(a)' },
  { result: 'failed', label: 'Nesložil(a)' },
  { result: 'not_yet', label: 'Ještě ne' },
]

/**
 * After the exam day, once: how did it go? One event with the answer and the readiness bucket
 * at the time of answering; no free text, no dates, nothing personal.
 */
export function ExamResultCard({
  plan,
  ready,
  onChange,
}: {
  plan: ExamPlan
  ready: Readiness
  onChange: (p: ExamPlan) => void
}) {
  const [done, setDone] = useState<ExamResultAnswer | null>(null)
  // The date this question is about, fixed when it is shown: the learner may enter a new date
  // (a retake) before answering, and the answer belongs to the old one.
  const [askedFor] = useState(plan.date)
  const thanks = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (done) thanks.current?.focus()
  }, [done])
  if (done) {
    return (
      <p
        ref={thanks}
        tabIndex={-1}
        role="status"
        className="mb-3 rounded-card border border-sand-700 bg-sand-800/40 px-5 py-3.5 text-sm text-sand-200"
      >
        {done === 'not_yet' ? 'Díky. Nový termín můžete zadat u okruhů.' : 'Díky za odpověď.'}
      </p>
    )
  }
  return (
    <section aria-labelledby="exam-result-title" className="mb-3 rounded-card border border-sand-600 bg-sand-800/60 p-5">
      <h2 id="exam-result-title" className="font-display text-xl font-bold tracking-tight text-sand-50">
        Jak dopadla zkouška?
      </h2>
      <p className="mt-1 text-sm text-sand-300">Pomůže nám to zjistit, jestli odhad bodů sedí.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {ANSWERS.map(({ result, label }) => (
          <button
            key={result}
            type="button"
            onClick={() => {
              // Allow-list v4 (live 2026-11-07). Answers before that went out as
              // key_action {action:'exam_result_reported', …}; the reading counts both.
              track('exam_result_reported', { result, readiness_bucket: readinessBucket(ready) })
              const next = markReported(plan, askedFor)
              saveExamPlan(next)
              onChange(next)
              setDone(result)
            }}
            className="min-h-11 rounded-card border border-sand-600 px-4 py-2 text-sm font-semibold text-sand-100 hover:border-terra-400"
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  )
}
