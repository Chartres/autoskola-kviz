import { describe, it, expect } from 'vitest'
import { reducer, initialState, type AppState } from './store'
import { makeRng } from '@/domain/rng'
import { emptyProgress, recordAnswer, statFor } from '@/domain/progress'
import { currentQuestion, isFinished, score } from '@/domain/session'
import { byCategory } from '@/domain/questions'
import { LESSON_SIZE } from '@/domain/lesson'

function start(overrides: Partial<AppState> = {}): AppState {
  return { ...initialState(), ...overrides }
}

describe('app store', () => {
  it('starts practice for the selected categories', () => {
    let s = start()
    s = reducer(s, { type: 'setCategories', categories: new Set(['Související předpisy']) })
    s = reducer(s, { type: 'startPractice', rng: makeRng(1) })
    expect(s.view).toBe('quiz')
    expect(s.mode).toBe('practice')
    expect(s.session?.questions.length).toBe(byCategory('Související předpisy').length)
    expect(s.session?.questions.every((q) => q.cat === 'Související předpisy')).toBe(true)
  })

  it('answering records to the session and to progress', () => {
    let s = start()
    s = reducer(s, { type: 'setCategories', categories: new Set(['Související předpisy']) })
    s = reducer(s, { type: 'startPractice', rng: makeRng(1) })
    const cur = currentQuestion(s.session!)!
    s = reducer(s, { type: 'answer', choice: cur.correct, now: 1000 })
    expect(score(s.session!)).toBe(1)
    expect(statFor(s.progress, cur.id).correct).toBe(1)
  })

  it('advances and finishes into results', () => {
    let s = start()
    s = reducer(s, { type: 'setCategories', categories: new Set(['Související předpisy']) })
    s = reducer(s, { type: 'startPractice', rng: makeRng(1) })
    const total = s.session!.questions.length
    for (let i = 0; i < total; i++) {
      const cur = currentQuestion(s.session!)!
      s = reducer(s, { type: 'answer', choice: cur.correct, now: i })
      s = reducer(s, { type: 'next' })
    }
    expect(s.view).toBe('results')
  })

  it('runs an exam and evaluates pass/fail on finish', () => {
    let s = start()
    s = reducer(s, { type: 'startExam', rng: makeRng(7), now: 0 })
    expect(s.mode).toBe('exam')
    expect(s.session?.questions.length).toBe(25)
    expect(s.examEndsAt).toBe(30 * 60 * 1000)
    // answer everything correctly
    const total = s.session!.questions.length
    for (let i = 0; i < total; i++) {
      const cur = currentQuestion(s.session!)!
      s = reducer(s, { type: 'answer', choice: cur.correct, now: i })
      s = reducer(s, { type: 'next' })
    }
    expect(s.view).toBe('results')
    // all correct → full 50 points, a pass under the official model
    expect(s.examResult?.score).toBe(50)
    expect(s.examResult?.passed).toBe(true)
  })

  it('finishExam (time up) evaluates the partial session', () => {
    let s = start()
    s = reducer(s, { type: 'startExam', rng: makeRng(7), now: 0 })
    s = reducer(s, { type: 'finishExam', now: 5 })
    expect(s.view).toBe('results')
    expect(s.examResult?.passed).toBe(false)
  })

  it('starts a review session from the missed queue (recent miss first)', () => {
    let p = emptyProgress()
    p = recordAnswer(p, 6, false, 10)
    p = recordAnswer(p, 7, false, 20)
    let s = start({ progress: p })
    s = reducer(s, { type: 'startReview', rng: makeRng(1) })
    expect(s.mode).toBe('review')
    // same points (both Pravidla, 2 b) → the more recently missed (7) first
    expect(s.session?.questions.map((q) => q.id)).toEqual([7, 6])
  })

  it('toggles bookmarks in progress', () => {
    let s = start()
    s = reducer(s, { type: 'toggleBookmark', id: 3 })
    expect(s.progress.bookmarks).toContain(3)
  })

  it('runs a finishable daily lesson and bumps the streak on completion', () => {
    let s = start()
    s = reducer(s, { type: 'startLesson', rng: makeRng(2) })
    expect(s.mode).toBe('lesson')
    expect(s.session?.questions.length).toBe(LESSON_SIZE)
    const total = s.session!.questions.length
    for (let i = 0; i < total; i++) {
      const cur = currentQuestion(s.session!)!
      s = reducer(s, { type: 'answer', choice: cur.correct, now: i })
      s = reducer(s, { type: 'next', today: '2026-06-06' })
    }
    expect(s.view).toBe('results')
    expect(s.progress.streak.current).toBe(1)
  })

  it('returns to the menu and clears the active session', () => {
    let s = start()
    s = reducer(s, { type: 'startExam', rng: makeRng(1), now: 0 })
    s = reducer(s, { type: 'goMenu' })
    expect(s.view).toBe('home')
    expect(s.session).toBeNull()
    expect(s.examEndsAt).toBeNull()
  })

  it('records finished exams into examHistory', () => {
    let s = reducer(initialState(), { type: 'startExam', rng: makeRng(1), now: 0 })
    while (!isFinished(s.session!)) {
      const q = currentQuestion(s.session!)!
      s = reducer(s, { type: 'answer', choice: q.correct, now: 1 })
      s = reducer(s, { type: 'next', now: 2 })
    }
    expect(s.view).toBe('results')
    expect(s.examHistory.exams).toHaveLength(1)
    expect(s.examHistory.exams[0]).toMatchObject({ passed: true, total: 50, at: 2 })
  })

  it('finishExam (timer expiry) also records history', () => {
    let s = reducer(initialState(), { type: 'startExam', rng: makeRng(1), now: 0 })
    s = reducer(s, { type: 'finishExam', now: 9 })
    expect(s.examHistory.exams).toHaveLength(1)
    expect(s.examHistory.exams[0].at).toBe(9)
  })
})
