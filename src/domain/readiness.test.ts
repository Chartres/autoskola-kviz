import { describe, it, expect } from 'vitest'
import { readiness, downToTenth, formatPoints, MIN_ANSWERS } from './readiness'
import { emptyProgress, recordAnswer, type ProgressData } from './progress'
import { byCategory } from './questions'
import { EXAM } from './exam'
import type { CategoryName } from './types'

/** Answer the first n questions of an okruh, `right` of them right. */
function answer(p: ProgressData, cat: CategoryName, n: number, right: number): ProgressData {
  byCategory(cat).slice(0, n).forEach((q, i) => {
    p = recordAnswer(p, q.id, i < right, 1000 + i)
  })
  return p
}

const ALL = EXAM.composition.map((c) => c.categories[0])

describe('readiness: expected exam points per okruh against the 43 needed', () => {
  it('weights each okruh by the points it carries in the official test (50 in all)', () => {
    const r = readiness(emptyProgress())
    const max = Object.fromEntries(r.okruhy.map((o) => [o.cat, o.max]))
    expect(max).toEqual({
      'Pravidla provozu': 20,
      'Dopravní značky': 3,
      'Dopravní situace': 12,
      'Zásady bezpečné jízdy': 8,
      'Podmínky provozu vozidel': 2,
      'Související předpisy': 4,
      'Zdravotnická příprava': 1,
    })
    expect(r.max).toBe(50)
    expect(r.needed).toBe(43)
  })

  it('shows no estimate, and no total, before an okruh has enough answers', () => {
    let p = answer(emptyProgress(), 'Dopravní situace', MIN_ANSWERS - 1, MIN_ANSWERS - 1)
    const r = readiness(p)
    const situace = r.okruhy.find((o) => o.cat === 'Dopravní situace')!
    expect(situace.expected).toBeNull()
    expect(situace.answered).toBe(MIN_ANSWERS - 1)
    expect(r.expected).toBeNull()
    expect(r.weakest).toBeNull()
    p = answer(p, 'Dopravní situace', MIN_ANSWERS, MIN_ANSWERS)
    expect(readiness(p).okruhy.find((o) => o.cat === 'Dopravní situace')!.expected).toBe(12)
  })

  it('expected points = share of right answers × the okruh points', () => {
    const p = answer(emptyProgress(), 'Pravidla provozu', 20, 15) // 75 %
    const o = readiness(p).okruhy.find((x) => x.cat === 'Pravidla provozu')!
    expect(o.expected).toBeCloseTo(15)
    expect(o.lost).toBeCloseTo(5)
  })

  it('counts every recorded answer of a question, not only its latest', () => {
    let p = answer(emptyProgress(), 'Pravidla provozu', MIN_ANSWERS, MIN_ANSWERS) // 10 right
    const q = byCategory('Pravidla provozu')[0]
    p = recordAnswer(p, q.id, false, 5000) // 11th answer, wrong
    const o = readiness(p).okruhy.find((x) => x.cat === 'Pravidla provozu')!
    expect(o.expected).toBe(18.1) // 20 × 10/11 = 18.18…, shown rounded down
  })

  it('totals the okruhy once all have an estimate, and names the one costing most points', () => {
    // Situace 60 % right: 12 × 0.6 = 7.2, losing 4.8 points; pravidla 90 %: losing 2.
    const right: Partial<Record<CategoryName, number>> = { 'Dopravní situace': 6, 'Pravidla provozu': 9 }
    let p = emptyProgress()
    for (const cat of ALL) p = answer(p, cat, MIN_ANSWERS, right[cat] ?? MIN_ANSWERS)
    const r = readiness(p)
    expect(r.expected).toBeCloseTo(50 - 4.8 - 2)
    expect(r.weakest).toBe('Dopravní situace')
  })

  it('names no weakest okruh when nothing is lost', () => {
    let p = emptyProgress()
    for (const cat of ALL) p = answer(p, cat, MIN_ANSWERS, MIN_ANSWERS)
    expect(readiness(p).weakest).toBeNull()
    expect(readiness(p).expected).toBe(50)
  })

  it('names the weakest among estimated okruhy even before the total is known', () => {
    const p = answer(answer(emptyProgress(), 'Pravidla provozu', MIN_ANSWERS, 5), 'Dopravní značky', MIN_ANSWERS, 5)
    const r = readiness(p)
    expect(r.expected).toBeNull()
    expect(r.weakest).toBe('Pravidla provozu') // loses 10 of 20, značky 1.5 of 3
  })

  it('the total is the sum of what the tiles show, never rounded up across 43', () => {
    // 9 of 10 right everywhere: 18 + 2,7 + 10,8 + 7,2 + 1,8 + 3,6 + 0,9 = 45.
    let p = emptyProgress()
    for (const cat of ALL) p = answer(p, cat, MIN_ANSWERS, 9)
    const r = readiness(p)
    expect(r.okruhy.map((o) => o.expected)).toEqual([18, 2.7, 10.8, 7.2, 1.8, 3.6, 0.9])
    expect(r.expected).toBe(45)
    expect(downToTenth(42.96)).toBe(42.9)
    expect(downToTenth(0.1 + 0.2)).toBe(0.3)
    expect(formatPoints(7.2)).toBe('7,2')
    expect(formatPoints(12)).toBe('12')
  })

  it('marks no weakest okruh while only one has an estimate', () => {
    const r = readiness(answer(emptyProgress(), 'Dopravní situace', MIN_ANSWERS, 3))
    expect(r.okruhy.find((o) => o.cat === 'Dopravní situace')!.expected).toBe(3.6)
    expect(r.weakest).toBeNull()
  })
})
