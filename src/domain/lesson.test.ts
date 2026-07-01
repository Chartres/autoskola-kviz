import { describe, it, expect } from 'vitest'
import { makeRng } from './rng'
import { buildLesson, LESSON_SIZE } from './lesson'
import { ALL_QUESTIONS } from './questions'
import { emptyProgress, recordAnswer, MASTERY_STREAK } from './progress'

// With the placeholder bank (7 questions) a full lesson is everything unmastered.
const AVAILABLE = Math.min(LESSON_SIZE, ALL_QUESTIONS.length)

describe('buildLesson', () => {
  it('is always finishable (never larger than the bank)', () => {
    expect(buildLesson(emptyProgress(), makeRng(1))).toHaveLength(AVAILABLE)
  })

  it('has no duplicate questions', () => {
    const lesson = buildLesson(emptyProgress(), makeRng(2))
    expect(new Set(lesson.map((q) => q.id)).size).toBe(lesson.length)
  })

  it('for a new learner, draws unseen questions across okruhy', () => {
    const lesson = buildLesson(emptyProgress(), makeRng(3))
    expect(new Set(lesson.map((q) => q.cat)).size).toBeGreaterThanOrEqual(5)
  })

  it('prioritises due reviews (weak spots) when the learner has wrong answers', () => {
    let p = emptyProgress()
    const wrongIds = [1, 2, 3]
    wrongIds.forEach((id, i) => (p = recordAnswer(p, id, false, 100 + i)))
    const lesson = buildLesson(p, makeRng(4))
    const included = lesson.filter((q) => wrongIds.includes(q.id)).length
    expect(included).toBeGreaterThan(0)
    // but the lesson is still mostly fresh material, not ALL review
    expect(included).toBeLessThan(lesson.length)
  })

  it('does not re-serve mastered questions as new material', () => {
    let p = emptyProgress()
    for (let i = 0; i < MASTERY_STREAK; i++) p = recordAnswer(p, 1, true, i)
    const lesson = buildLesson(p, makeRng(5))
    expect(lesson.some((q) => q.id === 1)).toBe(false)
    expect(lesson).toHaveLength(AVAILABLE - 1)
  })
})
