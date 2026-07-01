import { describe, it, expect } from 'vitest'
import { makeRng } from './rng'
import { buildExam, evaluateExam, EXAM } from './exam'
import { ALL_QUESTIONS } from './questions'
import {
  createSession,
  answerCurrent,
  advance,
  currentQuestion,
  type SessionState,
} from './session'

describe('buildExam', () => {
  it('draws from every okruh (placeholder bank: one question each)', () => {
    const exam = buildExam(makeRng(1))
    // each composition part contributes what its pool has → all 7 questions
    expect(exam).toHaveLength(ALL_QUESTIONS.length)
    expect(new Set(exam.map((q) => q.cat)).size).toBe(7)
  })

  it('has no duplicate questions', () => {
    const exam = buildExam(makeRng(2))
    expect(new Set(exam.map((q) => q.id)).size).toBe(exam.length)
  })

  it('is deterministic for a seed', () => {
    const a = buildExam(makeRng(5)).map((q) => q.id)
    const b = buildExam(makeRng(5)).map((q) => q.id)
    expect(a).toEqual(b)
  })

  it('exposes the official exam format', () => {
    expect(EXAM.totalQuestions).toBe(25)
    expect(EXAM.passThreshold).toBe(21)
    expect(EXAM.timeLimitMinutes).toBe(30)
  })
})

function answerAll(exam: ReturnType<typeof buildExam>, correctCount: number) {
  let s: SessionState = createSession(exam)
  let i = 0
  while (currentQuestion(s)) {
    const cur = currentQuestion(s)!
    const wrong = (['a', 'b', 'c'] as const).find((o) => o !== cur.correct)!
    s = answerCurrent(s, i < correctCount ? cur.correct : wrong)
    s = advance(s)
    i++
  }
  return s
}

describe('evaluateExam', () => {
  it('scores correct answers and applies the pass threshold', () => {
    const exam = buildExam(makeRng(3))
    const result = evaluateExam(answerAll(exam, exam.length))
    expect(result.score).toBe(exam.length)
    expect(result.total).toBe(exam.length)
    expect(result.passThreshold).toBe(EXAM.passThreshold)
    // 7 correct of a 21-question threshold: honest fail until the real bank lands
    expect(result.passed).toBe(result.score >= result.passThreshold)
  })

  it('counts wrong answers as not scored', () => {
    const exam = buildExam(makeRng(3))
    const result = evaluateExam(answerAll(exam, 2))
    expect(result.score).toBe(2)
    expect(result.passed).toBe(false)
  })

  it('breaks the score down by category', () => {
    const exam = buildExam(makeRng(4))
    const result = evaluateExam(answerAll(exam, exam.length))
    const totalByCat = Object.values(result.byCategory).reduce(
      (n, c) => n + c.total,
      0,
    )
    expect(totalByCat).toBe(exam.length)
  })
})
