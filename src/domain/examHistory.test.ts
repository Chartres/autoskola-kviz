import { describe, expect, it } from 'vitest'
import { emptyExamHistory, recordExam, readiness, EXAM_HISTORY_LIMIT } from './examHistory'

const result = { score: 45, total: 50, passed: true, passThreshold: 43, byCategory: {} }

describe('examHistory', () => {
  it('appends records with a timestamp', () => {
    const h = recordExam(emptyExamHistory(), result, 1000)
    expect(h.exams).toEqual([{ at: 1000, score: 45, total: 50, passed: true }])
  })

  it('caps stored exams at the limit', () => {
    let h = emptyExamHistory()
    for (let i = 0; i < EXAM_HISTORY_LIMIT + 5; i++) h = recordExam(h, result, i)
    expect(h.exams).toHaveLength(EXAM_HISTORY_LIMIT)
    expect(h.exams[0].at).toBe(5)
  })

  it('readiness counts passes in the last five exams', () => {
    let h = emptyExamHistory()
    const fail = { ...result, score: 30, passed: false }
    for (const r of [fail, result, result, fail, result, result]) h = recordExam(h, r, 1)
    expect(readiness(h)).toEqual({ passed: 4, total: 5 }) // oldest fail fell out of the window
  })

  it('readiness of empty history is 0/0', () => {
    expect(readiness(emptyExamHistory())).toEqual({ passed: 0, total: 0 })
  })
})
