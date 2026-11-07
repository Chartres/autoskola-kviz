import type { Readiness } from './readiness'

/**
 * The learner's exam date, kept on this device only (never synced), and whether the
 * one-time question "Jak dopadla zkouška?" was answered for that date. Test A of
 * "After the App" (Pavol, 2026-11-07): does Připravenost predict the real result?
 */
export const EXAM_PLAN_KEY = 'autoskola-kviz:exam-plan:v1'

export interface ExamPlan {
  /** YYYY-MM-DD, or null when no date is set. */
  date: string | null
  /** The date the result was reported for: one answer per date. */
  reportedFor: string | null
}

export type ExamResultAnswer = 'passed' | 'failed' | 'not_yet'
export type ReadinessBucket = 'none' | 'lt35' | '35_39' | '40_42' | '43_45' | '46_50'

const ISO = /^\d{4}-\d{2}-\d{2}$/
const empty = (): ExamPlan => ({ date: null, reportedFor: null })

export function loadExamPlan(): ExamPlan {
  try {
    const raw = localStorage.getItem(EXAM_PLAN_KEY)
    const p = raw ? JSON.parse(raw) : null
    if (!p || typeof p !== 'object') return empty()
    return {
      date: typeof p.date === 'string' && ISO.test(p.date) ? p.date : null,
      reportedFor: typeof p.reportedFor === 'string' && ISO.test(p.reportedFor) ? p.reportedFor : null,
    }
  } catch {
    return empty()
  }
}

export function saveExamPlan(plan: ExamPlan): void {
  try {
    localStorage.setItem(EXAM_PLAN_KEY, JSON.stringify(plan))
  } catch {
    // private mode / storage full: the date lives only for this visit
  }
}

/** Set or clear (empty string) the exam date; anything not YYYY-MM-DD clears it. */
export function setExamDate(plan: ExamPlan, date: string): ExamPlan {
  return { ...plan, date: ISO.test(date) ? date : null }
}

/** Ask on any visit after the exam day until it is answered for that date. */
export function shouldAskResult(plan: ExamPlan, today: string): boolean {
  return !!plan.date && today > plan.date && plan.reportedFor !== plan.date
}

/** Record the answer for the date the question was asked about (the date may have changed since). */
export function markReported(plan: ExamPlan, askedFor: string | null = plan.date): ExamPlan {
  return { ...plan, reportedFor: askedFor }
}

/** The expected exam total (Připravenost) in coarse buckets around the 43 needed. */
export function readinessBucket(r: Pick<Readiness, 'expected'>): ReadinessBucket {
  const x = r.expected
  if (x === null) return 'none'
  if (x < 35) return 'lt35'
  if (x < 40) return '35_39'
  if (x < 43) return '40_42'
  if (x < 46) return '43_45'
  return '46_50'
}
