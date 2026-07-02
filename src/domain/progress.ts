import type { CategoryName, Question } from './types'

/** Consecutive correct answers required to consider a question "mastered". */
export const MASTERY_STREAK = 2

export interface QuestionStat {
  seen: number
  correct: number
  streak: number
  lastSeen: number
  lastCorrect: boolean
  /** When the question was last answered wrong (0 / absent = never). */
  lastWrong?: number
}

export interface Streak {
  current: number
  best: number
  /** ISO date (YYYY-MM-DD) of the last completed lesson. */
  lastDate: string
}

export interface ProgressData {
  version: number
  stats: Record<number, QuestionStat>
  bookmarks: number[]
  streak: Streak
  updatedAt: number
}

export const PROGRESS_VERSION = 1

export function emptyStreak(): Streak {
  return { current: 0, best: 0, lastDate: '' }
}

export function emptyProgress(): ProgressData {
  return {
    version: PROGRESS_VERSION,
    stats: {},
    bookmarks: [],
    streak: emptyStreak(),
    updatedAt: 0,
  }
}

/** True if `today` (YYYY-MM-DD) is exactly the day after `prev`. */
function isNextDay(prev: string, today: string): boolean {
  if (!prev) return false
  const [py, pm, pd] = prev.split('-').map(Number)
  const [ty, tm, td] = today.split('-').map(Number)
  const a = Date.UTC(py, pm - 1, pd)
  const b = Date.UTC(ty, tm - 1, td)
  return b - a === 86_400_000
}

/** Record that the learner completed a lesson on `today` (YYYY-MM-DD). */
export function recordLessonComplete(
  p: ProgressData,
  today: string,
): ProgressData {
  const s = p.streak ?? emptyStreak()
  if (s.lastDate === today) return p // already counted today
  const current = isNextDay(s.lastDate, today) ? s.current + 1 : 1
  return {
    ...p,
    streak: { current, best: Math.max(s.best, current), lastDate: today },
  }
}

export function statFor(p: ProgressData, id: number): QuestionStat {
  return (
    p.stats[id] ?? {
      seen: 0,
      correct: 0,
      streak: 0,
      lastSeen: 0,
      lastCorrect: false,
    }
  )
}

export function recordAnswer(
  p: ProgressData,
  id: number,
  correct: boolean,
  now: number,
): ProgressData {
  const prev = statFor(p, id)
  const next: QuestionStat = {
    seen: prev.seen + 1,
    correct: prev.correct + (correct ? 1 : 0),
    streak: correct ? prev.streak + 1 : 0,
    lastSeen: now,
    lastCorrect: correct,
    lastWrong: correct ? prev.lastWrong : now,
  }
  return {
    ...p,
    stats: { ...p.stats, [id]: next },
    updatedAt: Math.max(p.updatedAt, now),
  }
}

export function isMastered(s: QuestionStat): boolean {
  return s.streak >= MASTERY_STREAK
}

export function masteredCount(p: ProgressData): number {
  return Object.values(p.stats).filter(isMastered).length
}

export function answeredCount(p: ProgressData): number {
  return Object.values(p.stats).filter((s) => s.seen > 0).length
}

export function accuracy(p: ProgressData): number {
  let seen = 0
  let correct = 0
  for (const s of Object.values(p.stats)) {
    seen += s.seen
    correct += s.correct
  }
  return seen === 0 ? 0 : correct / seen
}

export function toggleBookmark(p: ProgressData, id: number): ProgressData {
  const set = new Set(p.bookmarks)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  return { ...p, bookmarks: [...set] }
}

export function isBookmarked(p: ProgressData, id: number): boolean {
  return p.bookmarks.includes(id)
}

/** Questions seen at least once but not yet mastered. */
export function needsReviewIds(p: ProgressData): number[] {
  return Object.entries(p.stats)
    .filter(([, s]) => s.seen > 0 && !isMastered(s))
    .map(([id]) => Number(id))
}

/**
 * Review queue ordered by urgency: most-recently-wrong first, then
 * least-recently-seen. This is the lightweight spaced-repetition signal —
 * drill the weak spots (Montessori "isolation of difficulty").
 */
export function dueForReview(p: ProgressData, _now: number): number[] {
  return needsReviewIds(p).sort((a, b) => {
    const sa = statFor(p, a)
    const sb = statFor(p, b)
    // wrong (lastCorrect false) sorts before correct-but-unmastered
    if (sa.lastCorrect !== sb.lastCorrect) return sa.lastCorrect ? 1 : -1
    // older (smaller lastSeen) first
    return sa.lastSeen - sb.lastSeen
  })
}

/**
 * "Moje chyby": questions the learner has ever answered wrong and has not
 * (re-)mastered since. Mastery (two consecutive correct) clears the error —
 * a learning moment, not a permanent mark.
 */
export function missedIds(p: ProgressData): number[] {
  return Object.entries(p.stats)
    .filter(([, s]) => s.correct < s.seen && !isMastered(s))
    .map(([id]) => Number(id))
}

export interface CategorySummary {
  total: number
  seen: number
  mastered: number
}

export interface ProgressSummary {
  total: number
  answered: number
  mastered: number
  accuracy: number
  byCategory: Partial<Record<CategoryName, CategorySummary>>
}

export function summary(
  p: ProgressData,
  allQuestions: Question[],
): ProgressSummary {
  const byCategory: Partial<Record<CategoryName, CategorySummary>> = {}
  for (const q of allQuestions) {
    const c = (byCategory[q.cat] ??= { total: 0, seen: 0, mastered: 0 })
    c.total++
    const s = p.stats[q.id]
    if (s && s.seen > 0) {
      c.seen++
      if (isMastered(s)) c.mastered++
    }
  }
  return {
    total: allQuestions.length,
    answered: answeredCount(p),
    mastered: masteredCount(p),
    accuracy: accuracy(p),
    byCategory,
  }
}

/** Merge two progress snapshots: last-write-wins per question, union bookmarks. */
export function mergeProgress(
  a: ProgressData,
  b: ProgressData,
): ProgressData {
  const stats: Record<number, QuestionStat> = { ...a.stats }
  for (const [idStr, s] of Object.entries(b.stats)) {
    const id = Number(idStr)
    const existing = stats[id]
    if (!existing || s.lastSeen >= existing.lastSeen) stats[id] = s
  }
  const sa = a.streak ?? emptyStreak()
  const sb = b.streak ?? emptyStreak()
  const latest = sb.lastDate >= sa.lastDate ? sb : sa
  return {
    version: PROGRESS_VERSION,
    stats,
    bookmarks: [...new Set([...a.bookmarks, ...b.bookmarks])],
    streak: { ...latest, best: Math.max(sa.best, sb.best) },
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
  }
}
