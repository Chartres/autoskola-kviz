import { describe, it, expect } from 'vitest'
import { makeRng } from './rng'
import { buildExam, evaluateExam, EXAM } from './exam'
import {
  createSession,
  answerCurrent,
  advance,
  currentQuestion,
  type SessionState,
} from './session'

describe('buildExam', () => {
  it('draws 25 questions matching the official composition', () => {
    const exam = buildExam(makeRng(1))
    expect(exam).toHaveLength(25)
    for (const part of EXAM.composition) {
      const drawn = exam.filter((q) => part.categories.includes(q.cat))
      expect(drawn, part.group).toHaveLength(part.count)
      for (const q of drawn) {
        expect(q.points, `${part.group} q${q.id}`).toBe(part.pointsPerQuestion)
      }
    }
  })

  it('is worth exactly 50 points', () => {
    const exam = buildExam(makeRng(7))
    expect(exam.reduce((n, q) => n + q.points, 0)).toBe(EXAM.maxPoints)
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
    expect(EXAM.maxPoints).toBe(50)
    expect(EXAM.passThreshold).toBe(43)
    expect(EXAM.timeLimitMinutes).toBe(30)
  })
})

function answerAll(exam: ReturnType<typeof buildExam>, correctCount: number) {
  let s: SessionState = createSession(exam)
  let i = 0
  while (currentQuestion(s)) {
    const cur = currentQuestion(s)!
    const wrong = (['a', 'b'] as const).find((o) => o !== cur.correct) ?? 'b'
    s = answerCurrent(s, i < correctCount ? cur.correct : wrong)
    s = advance(s)
    i++
  }
  return s
}

describe('evaluateExam (point-weighted)', () => {
  it('a perfect exam scores 50/50 and passes', () => {
    const exam = buildExam(makeRng(3))
    const result = evaluateExam(answerAll(exam, exam.length))
    expect(result.score).toBe(50)
    expect(result.total).toBe(50)
    expect(result.passed).toBe(true)
    expect(result.passThreshold).toBe(43)
  })

  it('sums the points of correctly answered questions only', () => {
    const exam = buildExam(makeRng(3))
    const result = evaluateExam(answerAll(exam, 2))
    const expected = exam.slice(0, 2).reduce((n, q) => n + q.points, 0)
    expect(result.score).toBe(expected)
    expect(result.passed).toBe(false)
  })

  it('one wrong 4-point situace question can still pass; two cannot', () => {
    // pass threshold 43 of 50: losing 7 points fails, losing 4 passes
    const exam = buildExam(makeRng(9))
    const all = evaluateExam(answerAll(exam, exam.length))
    expect(all.score - 4).toBeGreaterThanOrEqual(43) // one situace wrong → 46
    expect(all.score - 8).toBeLessThan(43) // two situace wrong → 42
  })

  it('exact 43-point threshold: one 4-pt wrong (46 → pass), two 4-pt wrong (42 → fail) (C2L5)', () => {
    const exam = buildExam(makeRng(3))
    const fourPtIndices = exam.reduce<number[]>(
      (acc, q, i) => (q.points === 4 ? [...acc, i] : acc),
      [],
    )
    expect(fourPtIndices.length).toBeGreaterThanOrEqual(2)

    function answerWith(wrongIndices: number[]): SessionState {
      let s: SessionState = createSession(exam)
      let i = 0
      while (currentQuestion(s)) {
        const cur = currentQuestion(s)!
        const wrong = (['a', 'b'] as const).find((o) => o !== cur.correct) ?? 'b'
        s = answerCurrent(s, wrongIndices.includes(i) ? wrong : cur.correct)
        s = advance(s)
        i++
      }
      return s
    }

    // One 4-pt wrong → score = 50 - 4 = 46 → passes
    const r46 = evaluateExam(answerWith([fourPtIndices[0]]))
    expect(r46.score).toBe(46)
    expect(r46.passed).toBe(true)
    expect(r46.passThreshold).toBe(43)

    // Two 4-pt wrong → score = 50 - 8 = 42 → fails
    const r42 = evaluateExam(answerWith([fourPtIndices[0], fourPtIndices[1]]))
    expect(r42.score).toBe(42)
    expect(r42.passed).toBe(false)
  })

  it('breaks the score down by category (question counts)', () => {
    const exam = buildExam(makeRng(4))
    const result = evaluateExam(answerAll(exam, exam.length))
    const totalByCat = Object.values(result.byCategory).reduce(
      (n, c) => n + c.total,
      0,
    )
    expect(totalByCat).toBe(exam.length)
    for (const part of EXAM.composition) {
      expect(result.byCategory[part.categories[0]]?.total).toBe(part.count)
    }
  })
})
