import { describe, expect, it } from 'vitest'
import { PASSENGERS, getPassenger, noteAfterAnswer, noteForResult } from './passenger'

const kuzel = getPassenger('kuzel')!

describe('passenger roster', () => {
  it('has four passengers, each with an intro, a plate and lines for every moment', () => {
    expect(PASSENGERS.map((p) => p.id)).toEqual(['kuzel', 'panak', 'stromecek', 'karel'])
    for (const p of PASSENGERS) {
      expect(p.intro.length).toBeGreaterThan(40)
      expect(p.plate).toBeTruthy()
      expect(p.lines.wrong.length).toBeGreaterThanOrEqual(6)
      for (const m of ['streak5', 'streak10', 'passed', 'failed', 'corrected'] as const) {
        expect(p.lines[m].length, `${p.id} ${m}`).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('never addresses the learner in a gendered past tense ("prošel jsi", "spadla jsi")', () => {
    for (const p of PASSENGERS) {
      for (const line of [p.intro, ...Object.values(p.lines).flat()]) {
        expect(line, `${p.id}: ${line}`).not.toMatch(/\b\p{L}+l[a]? jsi\b|\bjsi \p{L}+l[a]?\b/u)
      }
    }
  })

  it('states no rule of the road: no paragraph signs, speeds or distances in the comments', () => {
    for (const p of PASSENGERS) {
      for (const line of Object.values(p.lines).flat()) {
        expect(line, `${p.id}: ${line}`).not.toMatch(/§|km\/h|\bmetr|přednost|rychlost/i)
      }
    }
  })

  it('returns undefined for an unknown or empty id', () => {
    expect(getPassenger('nobody')).toBeUndefined()
    expect(getPassenger(null)).toBeUndefined()
  })
})

describe('noteAfterAnswer', () => {
  it('comments on a wrong answer', () => {
    expect(noteAfterAnswer(kuzel, [false])).toBe(kuzel.lines.wrong[0])
  })

  it('does not repeat itself: the nth mistake of a set gets the nth line, then wraps', () => {
    const n = kuzel.lines.wrong.length
    const seen = new Set<string>()
    const outcomes: boolean[] = []
    for (let i = 0; i < n; i++) {
      outcomes.push(false)
      seen.add(noteAfterAnswer(kuzel, outcomes)!)
    }
    expect(seen.size).toBe(n)
    outcomes.push(false)
    expect(noteAfterAnswer(kuzel, outcomes)).toBe(kuzel.lines.wrong[0])
  })

  it('stays quiet on an ordinary right answer', () => {
    expect(noteAfterAnswer(kuzel, [true])).toBeNull()
    expect(noteAfterAnswer(kuzel, [false, true, true])).toBeNull()
  })

  it('speaks once at five and once at ten right answers in a row', () => {
    const five = [false, true, true, true, true, true]
    expect(noteAfterAnswer(kuzel, five)).toBe(kuzel.lines.streak5[0])
    expect(noteAfterAnswer(kuzel, [...five, true])).toBeNull()
    expect(noteAfterAnswer(kuzel, Array(10).fill(true))).toBe(kuzel.lines.streak10[0])
    expect(noteAfterAnswer(kuzel, Array(11).fill(true))).toBeNull()
  })

  it('keeps quiet on first-aid questions: injuries are not a place for a joke', () => {
    expect(noteAfterAnswer(kuzel, [false], 'Zdravotnická příprava')).toBeNull()
    expect(noteAfterAnswer(kuzel, Array(5).fill(true), 'Zdravotnická příprava')).toBeNull()
    expect(noteAfterAnswer(kuzel, [false], 'Dopravní značky')).toBe(kuzel.lines.wrong[0])
  })

  it('says nothing before any answer', () => {
    expect(noteAfterAnswer(kuzel, [])).toBeNull()
  })
})

describe('noteForResult', () => {
  it('a passed or failed mock exam gets the matching line', () => {
    expect(noteForResult(kuzel, { exam: true, passed: true, wrong: 2, corrected: 0 })).toBe(kuzel.lines.passed[0])
    expect(noteForResult(kuzel, { exam: true, passed: false, wrong: 9, corrected: 0 })).toBe(kuzel.lines.failed[0])
  })

  it('a practice set with every mistake put right gets the "corrected" line', () => {
    expect(noteForResult(kuzel, { exam: false, wrong: 3, corrected: 3 })).toBe(kuzel.lines.corrected[0])
  })

  it('a clean practice set counts as passed; one left with open mistakes as failed', () => {
    expect(noteForResult(kuzel, { exam: false, wrong: 0, corrected: 0 })).toBe(kuzel.lines.passed[0])
    expect(noteForResult(kuzel, { exam: false, wrong: 4, corrected: 0 })).toBe(kuzel.lines.failed[0])
  })
})
