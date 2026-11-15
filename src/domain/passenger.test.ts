import { describe, expect, it } from 'vitest'
import { PASSENGERS, getPassenger, noteAfterAnswer, noteForResult, resultMoment, seedFor, type Moment } from './passenger'

const kuzel = getPassenger('kuzel')!
const MOMENTS: Moment[] = ['wrong', 'tilt', 'streak5', 'streak10', 'passed', 'failed', 'almost', 'perfect', 'corrected']

describe('passenger roster', () => {
  it('has four passengers, each with an intro, a plate and a battery of lines for every moment', () => {
    expect(PASSENGERS.map((p) => p.id)).toEqual(['kuzel', 'panak', 'stromecek', 'karel'])
    for (const p of PASSENGERS) {
      expect(p.intro.length).toBeGreaterThan(40)
      expect(p.plate).toBeTruthy()
      // A set of 20 with every answer wrong still never repeats a line.
      expect(p.lines.wrong.length, p.id).toBeGreaterThanOrEqual(20)
      for (const m of MOMENTS) expect(p.lines[m].length, `${p.id} ${m}`).toBeGreaterThanOrEqual(3)
    }
  })

  it('no passenger says the same thing twice, and no two passengers share a line', () => {
    const all = PASSENGERS.flatMap((p) => Object.values(p.lines).flat())
    expect(new Set(all).size).toBe(all.length)
  })

  it('never addresses the learner in a gendered past tense ("prošel jsi", "věděla jste")', () => {
    for (const p of PASSENGERS) {
      for (const line of [p.intro, ...Object.values(p.lines).flat()]) {
        expect(line, `${p.id}: ${line}`).not.toMatch(/\b\p{L}+l[a]? js(i|te)\b|\bjs(i|te) \p{L}+l[ai]?\b/u)
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

  it('does not repeat itself within a set: twenty separate mistakes get twenty different lines', () => {
    const seen = new Set<string>()
    const outcomes: boolean[] = []
    for (let i = 0; i < 20; i++) {
      outcomes.push(true, false) // never three in a row
      seen.add(noteAfterAnswer(kuzel, outcomes, undefined, 7)!)
    }
    expect(seen.size).toBe(20)
  })

  it('starts somewhere else in another set', () => {
    expect(noteAfterAnswer(kuzel, [false], undefined, 0)).not.toBe(noteAfterAnswer(kuzel, [false], undefined, 5))
    expect(seedFor(['12', '40', '7'])).not.toBe(seedFor(['13', '40', '7']))
    expect(seedFor(['12', '40', '7'])).toBe(seedFor(['12', '40', '7']))
  })

  it('the third mistake in a row gets a line of its own', () => {
    expect(kuzel.lines.tilt).toContain(noteAfterAnswer(kuzel, [true, false, false, false]))
    expect(kuzel.lines.wrong).toContain(noteAfterAnswer(kuzel, [false, false, false, false]))
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

describe('results', () => {
  it('names the moment of a mock exam: passed, failed, almost, perfect', () => {
    expect(resultMoment({ exam: true, passed: true, score: 46, needed: 43, wrong: 2, corrected: 0 })).toBe('passed')
    expect(resultMoment({ exam: true, passed: false, score: 30, needed: 43, wrong: 9, corrected: 0 })).toBe('failed')
    expect(resultMoment({ exam: true, passed: false, score: 41, needed: 43, wrong: 4, corrected: 0 })).toBe('almost')
    expect(resultMoment({ exam: true, passed: true, score: 50, needed: 43, wrong: 0, corrected: 0 })).toBe('perfect')
  })

  it('names the moment of a practice set: perfect, corrected, failed', () => {
    expect(resultMoment({ exam: false, wrong: 0, corrected: 0 })).toBe('perfect')
    expect(resultMoment({ exam: false, wrong: 3, corrected: 3 })).toBe('corrected')
    expect(resultMoment({ exam: false, wrong: 4, corrected: 0 })).toBe('failed')
  })

  it('picks the line for that moment, by seed', () => {
    expect(noteForResult(kuzel, { exam: false, wrong: 3, corrected: 3 })).toBe(kuzel.lines.corrected[0])
    expect(noteForResult(kuzel, { exam: false, wrong: 3, corrected: 3 }, 2)).toBe(kuzel.lines.corrected[2])
  })
})
