import type { ExamGroup, Question } from './types'
import { questionsForGroup, getQuestion } from './questions'
import { EXAM } from './exam'
import { sample, shuffle, type Rng } from './rng'
import { dueForReview, isMastered, statFor, type ProgressData } from './progress'

/** A daily set is short and always finishable — Duolingo-style. */
export const LESSON_SIZE = 10
/** At most this fraction of a lesson is review of weak spots. */
const REVIEW_FRACTION = 0.4

/**
 * Assemble a bite-sized, personalised lesson:
 *  - up to ~40 % review of due weak spots (spaced repetition), then
 *  - fresh, unseen questions weighted to the real exam composition
 *    (legal-heavy), falling back to seen-but-unmastered if a group runs out.
 * Always returns exactly LESSON_SIZE distinct questions (shuffled).
 */
export function buildLesson(
  progress: ProgressData,
  rng: Rng,
  size = LESSON_SIZE,
): Question[] {
  const used = new Set<number>()
  const take = (q: Question | undefined) => {
    if (q && !used.has(q.id)) {
      used.add(q.id)
      return true
    }
    return false
  }

  // 1) Review: due weak-spots, capped.
  const reviewCap = Math.floor(size * REVIEW_FRACTION)
  const review: Question[] = []
  for (const id of dueForReview(progress, 0)) {
    if (review.length >= reviewCap) break
    const q = getQuestion(id)
    if (q && take(q)) review.push(q)
  }

  // 2) New material, distributed by exam composition.
  const newCount = size - review.length
  const fresh: Question[] = []
  const unmasteredFresh = (q: Question) => {
    const s = statFor(progress, q.id)
    return s.seen === 0 // strictly unseen
  }

  for (const part of EXAM.composition) {
    const want = Math.round((newCount * part.count) / EXAM.totalQuestions)
    const pool = questionsForGroup(part.group as ExamGroup).filter(
      (q) => !used.has(q.id) && unmasteredFresh(q),
    )
    for (const q of sample(pool, want, rng)) {
      if (fresh.length >= newCount) break
      if (take(q)) fresh.push(q)
    }
  }

  // 3) Top up to size: any remaining unseen, then seen-but-unmastered.
  if (review.length + fresh.length < size) {
    const all = EXAM.composition.flatMap((p) =>
      questionsForGroup(p.group as ExamGroup),
    )
    const unseen = all.filter((q) => !used.has(q.id) && statFor(progress, q.id).seen === 0)
    const unmastered = all.filter(
      (q) => !used.has(q.id) && !isMastered(statFor(progress, q.id)),
    )
    for (const q of [...shuffle(unseen, rng), ...shuffle(unmastered, rng)]) {
      if (review.length + fresh.length >= size) break
      if (take(q)) fresh.push(q)
    }
  }

  return shuffle([...review, ...fresh], rng).slice(0, size)
}
