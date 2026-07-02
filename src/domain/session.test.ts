import { describe, it, expect } from 'vitest'
import type { Question } from './types'
import {
  createSession,
  answerCurrent,
  advance,
  currentQuestion,
  currentChoice,
  isCurrentAnswered,
  isFinished,
  score,
  wrongAnswers,
  progressRatio,
} from './session'

function q(id: number, correct: 'a' | 'b' | 'c'): Question {
  return {
    id,
    cat: 'Pravidla provozu',
    q: `q${id}`,
    a: 'a',
    b: 'b',
    c: 'c',
    correct,
    image: null,
    points: 2,
    sourceId: id,
  }
}

const QS = [q(1, 'a'), q(2, 'b'), q(3, 'c')]

describe('quiz session', () => {
  it('starts at the first question, unanswered', () => {
    const s = createSession(QS)
    expect(currentQuestion(s)?.id).toBe(1)
    expect(isCurrentAnswered(s)).toBe(false)
    expect(isFinished(s)).toBe(false)
    expect(score(s)).toBe(0)
  })

  it('records a correct answer and increments score', () => {
    let s = createSession(QS)
    s = answerCurrent(s, 'a')
    expect(isCurrentAnswered(s)).toBe(true)
    expect(currentChoice(s)).toBe('a')
    expect(score(s)).toBe(1)
  })

  it('records an incorrect answer without scoring', () => {
    let s = createSession(QS)
    s = answerCurrent(s, 'b') // correct is 'a'
    expect(score(s)).toBe(0)
    expect(wrongAnswers(s)).toEqual([{ id: 1, choice: 'b', correct: false }])
  })

  it('locks the current answer (cannot be changed once given)', () => {
    let s = createSession(QS)
    s = answerCurrent(s, 'b')
    s = answerCurrent(s, 'a') // ignored
    expect(currentChoice(s)).toBe('b')
    expect(score(s)).toBe(0)
  })

  it('advances through all questions to completion', () => {
    let s = createSession(QS)
    s = answerCurrent(s, 'a')
    s = advance(s)
    expect(currentQuestion(s)?.id).toBe(2)
    s = answerCurrent(s, 'b')
    s = advance(s)
    s = answerCurrent(s, 'a') // wrong (correct c)
    s = advance(s)
    expect(isFinished(s)).toBe(true)
    expect(currentQuestion(s)).toBeUndefined()
    expect(score(s)).toBe(2)
    expect(wrongAnswers(s).map((a) => a.id)).toEqual([3])
  })

  it('reports progress ratio', () => {
    let s = createSession(QS)
    expect(progressRatio(s)).toBe(0)
    s = answerCurrent(s, 'a')
    expect(progressRatio(s)).toBeCloseTo(1 / 3)
  })

  it('an empty session is immediately finished', () => {
    const s = createSession([])
    expect(isFinished(s)).toBe(true)
    expect(currentQuestion(s)).toBeUndefined()
  })
})
