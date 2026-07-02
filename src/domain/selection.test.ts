import { describe, it, expect } from 'vitest'
import { makeRng } from './rng'
import {
  filterQuestions,
  buildPractice,
  missedQuestions,
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

describe('missedQuestions (Moje chyby)', () => {
  it('orders by points desc, then most recently missed first', () => {
    // id 1–2: Pravidla provozu (2 pts), id 700: Dopravní situace (4 pts),
    // id 460: Dopravní značky (1 pt) — real bank point values.
    let p = emptyProgress()
    p = recordAnswer(p, 460, false, 300) // 1 pt, newest miss
    p = recordAnswer(p, 1, false, 100) // 2 pts, older miss
    p = recordAnswer(p, 2, false, 200) // 2 pts, newer miss
    p = recordAnswer(p, 700, false, 50) // 4 pts, oldest miss
    const qs = missedQuestions(p)
    expect(qs.map((q) => q.id)).toEqual([700, 2, 1, 460])
    expect(qs[0].points).toBe(4)
  })

  it('excludes questions answered correctly but never missed', () => {
    let p = emptyProgress()
    p = recordAnswer(p, 1, true, 10)
    p = recordAnswer(p, 2, false, 20)
    expect(missedQuestions(p).map((q) => q.id)).toEqual([2])
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
