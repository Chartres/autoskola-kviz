import { describe, it, expect } from 'vitest'
import {
  emptyJizdyState,
  logLesson,
  skillCoverage,
  isReady,
  type Skill,
  type LessonRecord,
} from './jizdy'

const skills: Skill[] = [
  { id: 'rozjezd', label: 'Rozjezd', requiredReps: 2 },
  { id: 'couvani', label: 'Couvání', requiredReps: 3 },
  { id: 'parkovani', label: 'Parkování', requiredReps: 2 },
]

function lesson(id: string, practiced: string[]): LessonRecord {
  return { id, date: '2026-07-01', durationMin: 60, skills: practiced }
}

describe('emptyJizdyState', () => {
  it('returns a v1 state with no lessons', () => {
    const s = emptyJizdyState()
    expect(s.version).toBe(1)
    expect(s.lessons).toHaveLength(0)
  })
})

describe('logLesson', () => {
  it('appends a lesson without mutating state', () => {
    const s0 = emptyJizdyState()
    const rec = lesson('l1', ['rozjezd'])
    const s1 = logLesson(s0, rec)
    expect(s1.lessons).toHaveLength(1)
    expect(s1.lessons[0]).toBe(rec)
    expect(s0.lessons).toHaveLength(0) // original unchanged
  })

  it('accumulates multiple lessons', () => {
    let s = emptyJizdyState()
    s = logLesson(s, lesson('l1', ['rozjezd']))
    s = logLesson(s, lesson('l2', ['couvani']))
    expect(s.lessons).toHaveLength(2)
  })
})

describe('skillCoverage', () => {
  it('returns zero counts when no lessons logged', () => {
    const coverage = skillCoverage(emptyJizdyState(), skills)
    expect(coverage).toEqual({ rozjezd: 0, couvani: 0, parkovani: 0 })
  })

  it('counts each skill across lessons', () => {
    let s = emptyJizdyState()
    s = logLesson(s, lesson('l1', ['rozjezd', 'couvani']))
    s = logLesson(s, lesson('l2', ['rozjezd', 'parkovani']))
    s = logLesson(s, lesson('l3', ['couvani']))
    const c = skillCoverage(s, skills)
    expect(c.rozjezd).toBe(2)
    expect(c.couvani).toBe(2)
    expect(c.parkovani).toBe(1)
  })

  it('ignores skill ids not in the skills list', () => {
    let s = emptyJizdyState()
    s = logLesson(s, lesson('l1', ['unknown-skill']))
    const c = skillCoverage(s, skills)
    expect(c).toEqual({ rozjezd: 0, couvani: 0, parkovani: 0 })
  })
})

describe('isReady', () => {
  it('returns false for empty state', () => {
    expect(isReady(emptyJizdyState(), skills)).toBe(false)
  })

  it('returns false when skills list is empty', () => {
    expect(isReady(emptyJizdyState(), [])).toBe(false)
  })

  it('returns false when not all skills meet requiredReps', () => {
    let s = emptyJizdyState()
    // rozjezd needs 2, couvani needs 3, parkovani needs 2
    s = logLesson(s, lesson('l1', ['rozjezd', 'rozjezd', 'parkovani', 'parkovani']))
    // couvani still 0 reps
    expect(isReady(s, skills)).toBe(false)
  })

  it('returns true when all skills meet their required reps', () => {
    let s = emptyJizdyState()
    s = logLesson(s, lesson('l1', ['rozjezd', 'couvani', 'parkovani']))
    s = logLesson(s, lesson('l2', ['rozjezd', 'couvani', 'parkovani']))
    s = logLesson(s, lesson('l3', ['couvani']))
    // rozjezd: 2, couvani: 3, parkovani: 2
    expect(isReady(s, skills)).toBe(true)
  })

  it('correctly uses per-skill requiredReps, not a global threshold', () => {
    const singleRepSkills: Skill[] = [
      { id: 'rozjezd', label: 'Rozjezd', requiredReps: 1 },
    ]
    let s = emptyJizdyState()
    s = logLesson(s, lesson('l1', ['rozjezd']))
    expect(isReady(s, singleRepSkills)).toBe(true)
  })
})
