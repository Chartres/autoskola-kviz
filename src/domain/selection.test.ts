import { describe, it, expect } from 'vitest'
import { makeRng } from './rng'
import {
  filterQuestions,
  buildPractice,
  reviewQuestions,
  bookmarkedQuestions,
  normalizeForSearch,
} from './selection'
import { ALL_QUESTIONS, byCategory } from './questions'
import { emptyProgress, recordAnswer, toggleBookmark } from './progress'

describe('normalizeForSearch', () => {
  it('lowercases and strips Czech diacritics', () => {
    expect(normalizeForSearch('Řidič PŘÍČNÁ tíseň')).toBe('ridic pricna tisen')
  })
})

describe('filterQuestions', () => {
  it('returns everything with no filters', () => {
    expect(filterQuestions({})).toHaveLength(ALL_QUESTIONS.length)
  })

  it('filters by a set of categories', () => {
    const res = filterQuestions({
      categories: new Set(['Dopravní značky']),
    })
    expect(res.length).toBe(byCategory('Dopravní značky').length)
    expect(res.every((q) => q.cat === 'Dopravní značky')).toBe(true)
  })

  it('searches diacritic-insensitively across stem and options', () => {
    const withDiacritics = filterQuestions({ search: 'řidič' })
    const without = filterQuestions({ search: 'ridic' })
    expect(without.length).toBe(withDiacritics.length)
    expect(without.length).toBeGreaterThan(0)
  })

  it('combines category and search', () => {
    const res = filterQuestions({
      categories: new Set(['Zdravotnická příprava']),
      search: 'dech',
    })
    expect(res.every((q) => q.cat === 'Zdravotnická příprava')).toBe(true)
  })
})

describe('buildPractice', () => {
  it('shuffles deterministically by seed', () => {
    const a = buildPractice({ categories: new Set(['Související předpisy']) }, makeRng(1))
    const b = buildPractice({ categories: new Set(['Související předpisy']) }, makeRng(1))
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id))
  })

  it('contains exactly the filtered questions', () => {
    const res = buildPractice(
      { categories: new Set(['Související předpisy']) },
      makeRng(2),
    )
    expect(new Set(res.map((q) => q.id))).toEqual(
      new Set(byCategory('Související předpisy').map((q) => q.id)),
    )
  })
})

describe('reviewQuestions', () => {
  it('returns the spaced-repetition queue as full questions', () => {
    let p = emptyProgress()
    p = recordAnswer(p, 2, false, 50)
    p = recordAnswer(p, 3, false, 90)
    const ids = reviewQuestions(p).map((q) => q.id)
    expect(ids).toEqual([2, 3])
  })
})

describe('bookmarkedQuestions', () => {
  it('returns the bookmarked questions', () => {
    let p = emptyProgress()
    p = toggleBookmark(p, 1)
    p = toggleBookmark(p, 5)
    expect(bookmarkedQuestions(p).map((q) => q.id).sort((a, b) => a - b)).toEqual(
      [1, 5],
    )
  })
})
