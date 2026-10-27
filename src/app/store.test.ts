import { describe, it, expect } from 'vitest'
import { reducer, initialState, resumeExam, type AppState } from './store'
import { EXAM } from '@/domain/exam'
import { getQuestion } from '@/domain/questions'
import { makeRng } from '@/domain/rng'
import { emptyProgress, recordAnswer, statFor } from '@/domain/progress'
import { currentQuestion, score } from '@/domain/session'
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
    s = reducer(s, { type: 'finishExam' })
    expect(s.view).toBe('results')
    expect(s.examResult?.passed).toBe(false)
  })

  it('starts a review session from the missed queue (recent miss first)', () => {
    let p = emptyProgress()
    p = recordAnswer(p, 6, false, 10)
    p = recordAnswer(p, 7, false, 20)
    let s = start({ progress: p })
    s = reducer(s, { type: 'startReview' })
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

  it('next through all exam questions sets examResult and clears examEndsAt', () => {
    let s = start()
    s = reducer(s, { type: 'startExam', rng: makeRng(7), now: 0 })
    expect(s.examEndsAt).not.toBeNull()
    const total = s.session!.questions.length
    for (let i = 0; i < total; i++) {
      const cur = currentQuestion(s.session!)!
      s = reducer(s, { type: 'answer', choice: cur.correct, now: i })
      s = reducer(s, { type: 'next' })
    }
    expect(s.view).toBe('results')
    expect(s.examResult).not.toBeNull()
    expect(s.examEndsAt).toBeNull()
  })

  it('returns to the menu and clears the active session', () => {
    let s = start()
    s = reducer(s, { type: 'startExam', rng: makeRng(1), now: 0 })
    s = reducer(s, { type: 'goMenu' })
    expect(s.view).toBe('home')
    expect(s.session).toBeNull()
    expect(s.examEndsAt).toBeNull()
  })
})

describe('resumeExam with damaged or stale saved data', () => {
  const now = 1_000_000
  const ids = [1, 2, 3]
  const ok = { ids, index: 1, records: [{ id: 1, choice: 'a' as const, correct: true }], endsAt: now + 60_000 }

  it('ignores records that are not answer records instead of crashing', () => {
    const s = resumeExam(start(), { ...ok, records: [null, 5] as never }, now)
    expect(s.view).toBe('home')
  })

  it('a position past the last question opens the results', () => {
    const s = resumeExam(start(), { ...ok, index: 99 }, now)
    expect(s.view).toBe('results')
  })

  it('drops a deadline further away than one exam length (clock moved, corrupt value)', () => {
    const s = resumeExam(start(), { ...ok, endsAt: now + (EXAM.timeLimitMinutes + 5) * 60_000 }, now)
    expect(s.view).toBe('home')
  })

  it('re-checks each saved answer against the current answer key', () => {
    const q = getQuestion(1)!
    const wrong = (['a', 'b', 'c'] as const).find((c) => c !== q.correct)!
    const s = resumeExam(start(), { ...ok, records: [{ id: 1, choice: wrong, correct: true }] }, now)
    expect(s.session!.records[0].correct).toBe(false)
  })
})

describe('control of error: a missed question returns until answered right', () => {
  const wrongOf = (c: string) => (['a', 'b', 'c'] as const).find((x) => x !== c)!
  // Play a whole round; answer wrong for questions whose index is in `miss`.
  function round(s: AppState, miss: number[] = [], today?: string): AppState {
    const total = s.session!.questions.length
    for (let i = 0; i < total; i++) {
      const cur = currentQuestion(s.session!)!
      s = reducer(s, { type: 'answer', choice: miss.includes(i) ? wrongOf(cur.correct) : cur.correct, now: 1000 + i })
      s = reducer(s, { type: 'next', today })
    }
    return s
  }
  const practice = () => {
    let s = reducer(start(), { type: 'setCategories', categories: new Set(['Zdravotnická příprava']) })
    return reducer(s, { type: 'startPractice', rng: makeRng(3) })
  }

  it('after the last question, the missed ones come back instead of the results', () => {
    let s = practice()
    const first = s.session!.questions
    s = round(s, [0, 2])
    expect(s.view).toBe('quiz')
    expect(s.session!.questions.map((q) => q.id)).toEqual([first[0].id, first[2].id])
    expect(s.correction?.missed).toBe(2)
  })

  it('a second attempt does not change the progress record', () => {
    let s = round(practice(), [0])
    const id = currentQuestion(s.session!)!.id
    const before = statFor(s.progress, id)
    s = round(s)
    expect(statFor(s.progress, id)).toEqual(before)
  })

  it('the set ends once no error stands, with the first-attempt score', () => {
    let s = practice()
    const total = s.session!.questions.length
    s = round(s, [1])
    s = round(s, [0]) // still wrong
    expect(s.view).toBe('quiz')
    s = round(s)
    expect(s.view).toBe('results')
    expect(s.session!.questions.length).toBe(total)
    expect(score(s.session!)).toBe(total - 1)
    expect(s.correction?.missed).toBe(1)
  })

  it('a daily lesson counts as complete only when its errors are corrected', () => {
    let s = reducer(start(), { type: 'startLesson', rng: makeRng(2) })
    s = round(s, [0], '2026-06-06')
    expect(s.progress.streak.current).toBe(0)
    s = round(s, [], '2026-06-06')
    expect(s.view).toBe('results')
    expect(s.progress.streak.current).toBe(1)
  })

  it('the exam keeps the real exam rules: no second attempts', () => {
    let s = reducer(start(), { type: 'startExam', rng: makeRng(4), now: 0 })
    s = round(s, [0, 1])
    expect(s.view).toBe('results')
    expect(s.correction).toBeNull()
  })

  it('a clean round goes straight to the results', () => {
    const s = round(practice())
    expect(s.view).toBe('results')
    expect(s.correction).toBeNull()
  })
})
