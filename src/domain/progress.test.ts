import { describe, it, expect } from 'vitest'
import type { Question } from './types'
import {
  emptyProgress,
  recordAnswer,
  isMastered,
  statFor,
  masteredCount,
  answeredCount,
  accuracy,
  toggleBookmark,
  isBookmarked,
  needsReviewIds,
  dueForReview,
  summary,
  mergeProgress,
  recordLessonComplete,
  MASTERY_STREAK,
} from './progress'

function q(id: number, cat: Question['cat'] = 'Pravidla provozu'): Question {
  return { id, cat, q: `q${id}`, a: 'a', b: 'b', c: 'c', correct: 'a', image: null }
}

describe('recordAnswer & mastery', () => {
  it('tracks seen/correct/streak', () => {
    let p = emptyProgress()
    p = recordAnswer(p, 1, true, 1000)
    const s = statFor(p, 1)
    expect(s).toMatchObject({ seen: 1, correct: 1, streak: 1, lastSeen: 1000 })
  })

  it('resets the streak on a wrong answer', () => {
    let p = emptyProgress()
    p = recordAnswer(p, 1, true, 1)
    p = recordAnswer(p, 1, true, 2)
    p = recordAnswer(p, 1, false, 3)
    expect(statFor(p, 1).streak).toBe(0)
    expect(statFor(p, 1).correct).toBe(2)
    expect(statFor(p, 1).seen).toBe(3)
  })

  it('marks a question mastered after a streak of MASTERY_STREAK', () => {
    let p = emptyProgress()
    for (let i = 0; i < MASTERY_STREAK; i++) p = recordAnswer(p, 1, true, i)
    expect(isMastered(statFor(p, 1))).toBe(true)
    expect(masteredCount(p)).toBe(1)
  })

  it('a single correct answer is not yet mastery', () => {
    let p = emptyProgress()
    p = recordAnswer(p, 1, true, 1)
    expect(isMastered(statFor(p, 1))).toBe(MASTERY_STREAK <= 1)
  })

  it('computes answered count and accuracy', () => {
    let p = emptyProgress()
    p = recordAnswer(p, 1, true, 1)
    p = recordAnswer(p, 2, false, 2)
    p = recordAnswer(p, 1, true, 3)
    expect(answeredCount(p)).toBe(2) // distinct questions
    expect(accuracy(p)).toBeCloseTo(2 / 3) // 2 correct of 3 attempts
  })
})

describe('bookmarks', () => {
  it('toggles a bookmark on and off', () => {
    let p = emptyProgress()
    p = toggleBookmark(p, 5)
    expect(isBookmarked(p, 5)).toBe(true)
    p = toggleBookmark(p, 5)
    expect(isBookmarked(p, 5)).toBe(false)
  })
})

describe('review selection (spaced repetition)', () => {
  it('lists answered-but-not-mastered questions', () => {
    let p = emptyProgress()
    p = recordAnswer(p, 1, false, 1) // wrong → needs review
    p = recordAnswer(p, 2, true, 2) // 1 correct, not mastered yet (streak 2)
    for (let i = 0; i < MASTERY_STREAK; i++) p = recordAnswer(p, 3, true, 10 + i) // mastered
    const ids = needsReviewIds(p)
    expect(ids).toContain(1)
    expect(ids).toContain(2)
    expect(ids).not.toContain(3)
  })

  it('prioritises wrong answers, then least-recently-seen', () => {
    let p = emptyProgress()
    p = recordAnswer(p, 1, true, 100) // correct, recent
    p = recordAnswer(p, 2, false, 50) // wrong, older
    p = recordAnswer(p, 3, false, 90) // wrong, newer
    const ids = dueForReview(p, 200)
    // both wrong come before the merely-unmastered correct one;
    // among wrong, the older (id 2) comes first
    expect(ids.slice(0, 2)).toEqual([2, 3])
  })
})

describe('summary', () => {
  it('aggregates per category against the full catalogue', () => {
    const all = [q(1), q(2), q(3, 'Dopravní značky')]
    let p = emptyProgress()
    for (let i = 0; i < MASTERY_STREAK; i++) p = recordAnswer(p, 1, true, i)
    p = recordAnswer(p, 3, false, 99)
    const sum = summary(p, all)
    expect(sum.total).toBe(3)
    expect(sum.mastered).toBe(1)
    expect(sum.byCategory['Pravidla provozu']).toMatchObject({
      total: 2,
      mastered: 1,
    })
    expect(sum.byCategory['Dopravní značky']).toMatchObject({
      total: 1,
      seen: 1,
      mastered: 0,
    })
  })
})

describe('daily streak', () => {
  it('starts a streak on the first completed lesson', () => {
    const p = recordLessonComplete(emptyProgress(), '2026-06-06')
    expect(p.streak).toMatchObject({ current: 1, best: 1, lastDate: '2026-06-06' })
  })

  it('increments on a consecutive day', () => {
    let p = recordLessonComplete(emptyProgress(), '2026-06-06')
    p = recordLessonComplete(p, '2026-06-07')
    expect(p.streak.current).toBe(2)
    expect(p.streak.best).toBe(2)
  })

  it('does not double-count a second lesson on the same day', () => {
    let p = recordLessonComplete(emptyProgress(), '2026-06-06')
    p = recordLessonComplete(p, '2026-06-06')
    expect(p.streak.current).toBe(1)
  })

  it('resets after a missed day but keeps the best', () => {
    let p = recordLessonComplete(emptyProgress(), '2026-06-06')
    p = recordLessonComplete(p, '2026-06-07') // best 2
    p = recordLessonComplete(p, '2026-06-10') // gap → reset
    expect(p.streak.current).toBe(1)
    expect(p.streak.best).toBe(2)
  })

  it('handles month boundaries', () => {
    let p = recordLessonComplete(emptyProgress(), '2026-06-30')
    p = recordLessonComplete(p, '2026-07-01')
    expect(p.streak.current).toBe(2)
  })
})

describe('mergeProgress (offline ↔ cloud sync)', () => {
  it('keeps the most-recently-touched stat per question and unions bookmarks', () => {
    let local = emptyProgress()
    local = recordAnswer(local, 1, true, 100)
    local = toggleBookmark(local, 7)

    let remote = emptyProgress()
    remote = recordAnswer(remote, 1, false, 200) // newer for q1
    remote = recordAnswer(remote, 2, true, 150)
    remote = toggleBookmark(remote, 9)

    const merged = mergeProgress(local, remote)
    expect(statFor(merged, 1).lastSeen).toBe(200) // remote wins (newer)
    expect(statFor(merged, 2).seen).toBe(1)
    expect(merged.bookmarks.sort()).toEqual([7, 9])
  })

  it('is idempotent when merging with itself', () => {
    let p = emptyProgress()
    p = recordAnswer(p, 1, true, 100)
    expect(mergeProgress(p, p)).toEqual(p)
  })
})
