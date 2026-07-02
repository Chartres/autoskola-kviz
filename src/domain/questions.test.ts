import { describe, it, expect } from 'vitest'
import {
  ALL_QUESTIONS,
  META,
  byCategory,
  getQuestion,
  questionsForGroup,
} from './questions'

describe('question dataset (official bank)', () => {
  it('loads the full official bank', () => {
    expect(ALL_QUESTIONS.length).toBe(META.totalQuestions)
    expect(META.totalQuestions).toBeGreaterThanOrEqual(1100)
    expect(META.categories).toHaveLength(7)
  })

  it('every question has a valid shape and a correct answer', () => {
    for (const q of ALL_QUESTIONS) {
      expect(typeof q.id).toBe('number')
      expect(q.q.length).toBeGreaterThan(0)
      expect(q.a.length > 0 || Boolean(q.aImg)).toBe(true)
      expect(q.b.length > 0 || Boolean(q.bImg)).toBe(true)
      expect(q.c === null || q.c.length > 0 || Boolean(q.cImg)).toBe(true)
      expect(['a', 'b', 'c']).toContain(q.correct)
      expect(q.image === null || typeof q.image === 'string').toBe(true)
      expect([1, 2, 4]).toContain(q.points)
    }
  })

  it('maps every okruh to its own exam group', () => {
    for (const c of META.categories) {
      const group = questionsForGroup(c.group)
      expect(group.length).toBe(c.count)
      expect(group.every((q) => q.cat === c.name)).toBe(true)
    }
  })

  it('filters by category', () => {
    const znacky = byCategory('Dopravní značky')
    expect(znacky.length).toBeGreaterThan(200)
    expect(getQuestion(znacky[0].id)).toBe(znacky[0])
  })

  it('exam config reflects the official point-weighted format', () => {
    expect(META.exam.totalQuestions).toBe(25)
    expect(META.exam.timeLimitMinutes).toBe(30)
    expect(META.exam.maxPoints).toBe(50)
    expect(META.exam.passThreshold).toBe(43)
    const drawn = META.exam.composition.reduce((n, p) => n + p.count, 0)
    expect(drawn).toBe(META.exam.totalQuestions)
    const points = META.exam.composition.reduce(
      (n, p) => n + p.count * p.pointsPerQuestion,
      0,
    )
    expect(points).toBe(META.exam.maxPoints)
  })
})
