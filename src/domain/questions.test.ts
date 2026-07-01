import { describe, it, expect } from 'vitest'
import {
  ALL_QUESTIONS,
  META,
  byCategory,
  getQuestion,
  questionsForGroup,
} from './questions'

describe('question dataset (placeholder)', () => {
  it('loads the placeholder set (7 questions, one per okruh)', () => {
    expect(ALL_QUESTIONS).toHaveLength(7)
    expect(META.totalQuestions).toBe(7)
    expect(META.categories).toHaveLength(7)
  })

  it('every question has a valid shape and a correct answer', () => {
    for (const q of ALL_QUESTIONS) {
      expect(typeof q.id).toBe('number')
      expect(q.q.length).toBeGreaterThan(0)
      expect(q.a.length).toBeGreaterThan(0)
      expect(q.b.length).toBeGreaterThan(0)
      expect(q.c.length).toBeGreaterThan(0)
      expect(['a', 'b', 'c']).toContain(q.correct)
      expect(q.image === null || typeof q.image === 'string').toBe(true)
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
    expect(znacky.length).toBe(1)
    expect(znacky[0].image).toBe('znacka-stuj.svg')
    expect(getQuestion(znacky[0].id)).toBe(znacky[0])
  })

  it('exam config reflects the official test format', () => {
    expect(META.exam.totalQuestions).toBe(25)
    expect(META.exam.timeLimitMinutes).toBe(30)
    // ponytail: count-based placeholder threshold; real exam is 43/50 points
    expect(META.exam.passThreshold).toBe(21)
    const drawn = META.exam.composition.reduce((n, p) => n + p.count, 0)
    expect(drawn).toBe(META.exam.totalQuestions)
  })
})
