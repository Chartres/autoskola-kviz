import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadExamPlan,
  saveExamPlan,
  setExamDate,
  shouldAskResult,
  markReported,
  readinessBucket,
  EXAM_PLAN_KEY,
} from './examPlan'
import type { Readiness } from './readiness'

const withTotal = (expected: number | null) => ({ expected }) as Readiness

beforeEach(() => localStorage.clear())

describe('exam date on the device and the one-time result question (test A, 2026-11-07)', () => {
  it('starts with no date and asks nothing', () => {
    const plan = loadExamPlan()
    expect(plan).toEqual({ date: null, reportedFor: null })
    expect(shouldAskResult(plan, '2026-11-07')).toBe(false)
  })

  it('keeps the date on the device', () => {
    saveExamPlan(setExamDate(loadExamPlan(), '2026-11-20'))
    expect(loadExamPlan().date).toBe('2026-11-20')
    expect(JSON.parse(localStorage.getItem(EXAM_PLAN_KEY)!)).toEqual({ date: '2026-11-20', reportedFor: null })
  })

  it('asks only after the exam day, not on it', () => {
    const plan = setExamDate(loadExamPlan(), '2026-11-20')
    expect(shouldAskResult(plan, '2026-11-19')).toBe(false)
    expect(shouldAskResult(plan, '2026-11-20')).toBe(false)
    expect(shouldAskResult(plan, '2026-11-21')).toBe(true)
    expect(shouldAskResult(plan, '2027-01-02')).toBe(true)
  })

  it('asks once per date: an answer ends it, a new date asks again', () => {
    let plan = markReported(setExamDate(loadExamPlan(), '2026-11-20'))
    expect(shouldAskResult(plan, '2026-11-25')).toBe(false)
    plan = setExamDate(plan, '2026-12-10')
    expect(shouldAskResult(plan, '2026-11-25')).toBe(false)
    expect(shouldAskResult(plan, '2026-12-11')).toBe(true)
  })

  it('clearing the date asks nothing', () => {
    const plan = setExamDate(setExamDate(loadExamPlan(), '2026-11-20'), '')
    expect(plan.date).toBeNull()
    expect(shouldAskResult(plan, '2026-12-01')).toBe(false)
  })

  it('ignores damaged storage and invalid dates', () => {
    localStorage.setItem(EXAM_PLAN_KEY, '{"date": 5, "reportedFor": {}}')
    expect(loadExamPlan()).toEqual({ date: null, reportedFor: null })
    localStorage.setItem(EXAM_PLAN_KEY, 'not json')
    expect(loadExamPlan()).toEqual({ date: null, reportedFor: null })
    expect(setExamDate(loadExamPlan(), '20.11.2026').date).toBeNull()
  })

  it('puts the readiness total in a bucket, or "none" while there is no total', () => {
    expect(readinessBucket(withTotal(null))).toBe('none')
    expect(readinessBucket(withTotal(20))).toBe('lt35')
    expect(readinessBucket(withTotal(34.9))).toBe('lt35')
    expect(readinessBucket(withTotal(35))).toBe('35_39')
    expect(readinessBucket(withTotal(39.9))).toBe('35_39')
    expect(readinessBucket(withTotal(40))).toBe('40_42')
    expect(readinessBucket(withTotal(42.9))).toBe('40_42')
    expect(readinessBucket(withTotal(43))).toBe('43_45')
    expect(readinessBucket(withTotal(45.9))).toBe('43_45')
    expect(readinessBucket(withTotal(46))).toBe('46_50')
    expect(readinessBucket(withTotal(50))).toBe('46_50')
  })
})
