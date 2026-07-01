import { describe, it, expect } from 'vitest'
import { ALL_QUESTIONS, META, byCategory } from './questions'

// Dataset invariants — the placeholder set must stay internally consistent,
// and the same checks will guard the real bank once extracted.
describe('dataset invariants', () => {
  it('has unique ids and contiguous numbering 1..N', () => {
    const ids = ALL_QUESTIONS.map((q) => q.id).sort((a, b) => a - b)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids[0]).toBe(1)
    expect(ids.at(-1)).toBe(META.totalQuestions)
    expect(ALL_QUESTIONS).toHaveLength(META.totalQuestions)
  })

  it('category counts in meta match the actual questions', () => {
    for (const c of META.categories) {
      expect(byCategory(c.name).length, c.name).toBe(c.count)
    }
  })

  it('image references look like question assets', () => {
    for (const q of ALL_QUESTIONS) {
      if (q.image !== null) {
        expect(q.image).toMatch(/\.(png|jpe?g|svg)$/)
      }
    }
  })
})
