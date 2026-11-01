import { describe, it, expect } from 'vitest'
import { reducer, initialState, SET_SIZE, type AppState } from './store'
import { snapshotRound, restoreRound, roundSummary, type SavedRound } from './round'
import { makeRng } from '@/domain/rng'
import { statFor } from '@/domain/progress'
import { currentQuestion, score } from '@/domain/session'
import type { Choice, Question } from '@/domain/types'

const OKRUH = 'Zdravotnická příprava' as const
const wrongOf = (q: Question): Choice => (q.correct === 'a' ? 'b' : 'a')

function okruhSet(seed = 1): AppState {
  let s = reducer(initialState(), { type: 'setCategories', categories: new Set([OKRUH]) })
  return reducer(s, { type: 'startPractice', rng: makeRng(seed) })
}

/** Answer n questions (right unless `wrong` says otherwise) and move on after each. */
function play(s: AppState, n: number, wrong = (_i: number) => false): AppState {
  for (let i = 0; i < n; i++) {
    const q = currentQuestion(s.session!)!
    s = reducer(s, { type: 'answer', choice: wrong(i) ? wrongOf(q) : q.correct, now: 1000 + i })
    s = reducer(s, { type: 'next', today: '2026-11-01' })
  }
  return s
}

/** What survives a reload: the pending round through JSON. */
const reloaded = (s: AppState): AppState => ({
  ...initialState(),
  progress: s.progress,
  pendingRound: JSON.parse(JSON.stringify(s.pendingRound)) as SavedRound,
})

describe('an unfinished set waits (Pavol, 2026-11-01)', () => {
  it('leaving an okruh set partway keeps it, with its answers already in progress', () => {
    let s = play(okruhSet(), 8)
    const ids = s.session!.questions.map((q) => q.id)
    s = reducer(s, { type: 'goMenu' })
    expect(s.view).toBe('home')
    expect(s.pendingRound?.mode).toBe('practice')
    expect(s.pendingRound?.ids).toEqual(ids)
    expect(roundSummary(s.pendingRound!)).toMatchObject({ title: OKRUH, answered: 8, total: SET_SIZE })
    for (const id of ids.slice(0, 8)) expect(statFor(s.progress, id).seen).toBe(1)
  })

  it('Pokračovat resumes the same questions at the first unanswered one, after a reload too', () => {
    let s = play(okruhSet(), 8)
    const before = s.session!
    const queue = s.practiceSet!.queue.map((q) => q.id)
    s = reloaded(reducer(s, { type: 'goMenu' }))
    s = reducer(s, { type: 'resumeRound' })
    expect(s.view).toBe('quiz')
    expect(s.mode).toBe('practice')
    expect(s.session!.questions.map((q) => q.id)).toEqual(before.questions.map((q) => q.id))
    expect(s.session!.index).toBe(8)
    expect(s.session!.chosen).toEqual(before.chosen)
    expect(s.practiceSet!.queue.map((q) => q.id)).toEqual(queue)
    expect([...s.selectedCategories]).toEqual([OKRUH])
    expect(s.pendingRound).toBeNull()
    // Finishing it reaches the results, scored on the whole set.
    s = play(s, SET_SIZE - 8)
    expect(s.view).toBe('results')
    expect(score(s.session!)).toBe(SET_SIZE)
  })

  it('a question answered but not yet moved past resumes after it', () => {
    let s = play(okruhSet(), 3)
    s = reducer(s, { type: 'answer', choice: currentQuestion(s.session!)!.correct, now: 5 })
    s = reducer(reducer(s, { type: 'goMenu' }), { type: 'resumeRound' })
    expect(s.session!.index).toBe(4)
  })

  it('every question answered but "Dokončit" not pressed: resumes on the last one', () => {
    let s = play(okruhSet(), SET_SIZE - 1)
    s = reducer(s, { type: 'answer', choice: currentQuestion(s.session!)!.correct, now: 5 })
    s = reducer(reducer(s, { type: 'goMenu' }), { type: 'resumeRound' })
    expect(s.session!.index).toBe(SET_SIZE - 1)
    s = reducer(s, { type: 'next', today: '2026-11-01' })
    expect(s.view).toBe('results')
  })

  it('a new set skips what was answered in the unfinished one', () => {
    let s = play(okruhSet(1), 8)
    const answered = s.session!.questions.slice(0, 8).map((q) => q.id)
    s = reducer(s, { type: 'goMenu' })
    s = reducer(s, { type: 'startPractice', rng: makeRng(99) })
    const fresh = s.session!.questions.map((q) => q.id)
    expect(fresh.filter((id) => answered.includes(id))).toEqual([])
    // Starting a set replaces the one waiting.
    expect(s.pendingRound).toBeNull()
  })

  it('Nový trénink drops the waiting set and starts a new one of the same okruh', () => {
    let s = play(okruhSet(1), 8)
    const answered = s.session!.questions.slice(0, 8).map((q) => q.id)
    s = reducer(s, { type: 'goMenu' })
    s = reducer(s, { type: 'setCategories', categories: new Set(['Dopravní značky']) })
    s = reducer(s, { type: 'newRound', rng: makeRng(5) })
    expect(s.view).toBe('quiz')
    expect(s.pendingRound).toBeNull()
    expect(s.session!.questions.every((q) => q.cat === OKRUH)).toBe(true)
    expect(s.session!.questions.some((q) => answered.includes(q.id))).toBe(false)
  })

  it('leaving without answering anything keeps nothing', () => {
    const s = reducer(okruhSet(), { type: 'goMenu' })
    expect(s.pendingRound).toBeNull()
  })

  it('the daily set waits too, and the streak counts only when it is finished', () => {
    let s = reducer(initialState(), { type: 'startLesson', rng: makeRng(3) })
    const total = s.session!.questions.length
    s = play(s, 4)
    s = reducer(s, { type: 'goMenu' })
    expect(s.progress.streak.current).toBe(0)
    expect(roundSummary(s.pendingRound!)).toMatchObject({ title: 'Denní dávka', answered: 4, total })
    s = reducer(reloaded(s), { type: 'resumeRound' })
    expect(s.mode).toBe('lesson')
    expect(s.session!.index).toBe(4)
    s = play(s, total - 4)
    expect(s.view).toBe('results')
    expect(s.progress.streak.current).toBe(1)
  })

  it('a correction round left partway resumes there; results keep the first-attempt score', () => {
    let s = play(okruhSet(), SET_SIZE, (i) => i < 3) // 3 wrong → correction round of 3
    expect(s.correction?.missed).toBe(3)
    s = play(s, 1) // put one right
    s = reloaded(reducer(s, { type: 'goMenu' }))
    expect(roundSummary(s.pendingRound!)).toMatchObject({ correcting: true, answered: 1, total: 3 })
    s = reducer(s, { type: 'resumeRound' })
    expect(s.correction).toMatchObject({ missed: 3, counted: true })
    expect(s.session!.questions).toHaveLength(3)
    expect(s.session!.index).toBe(1)
    s = play(s, 2)
    expect(s.view).toBe('results')
    expect(score(s.session!)).toBe(SET_SIZE - 3)
  })

  it('a mock exam left early keeps its answers, records no result, and leaves a waiting set alone', () => {
    let s = reducer(play(okruhSet(), 5), { type: 'goMenu' })
    const waiting = s.pendingRound
    s = reducer(s, { type: 'startExam', rng: makeRng(7), now: 0 })
    const q = currentQuestion(s.session!)!
    s = reducer(s, { type: 'answer', choice: q.correct, now: 10 })
    s = reducer(s, { type: 'goMenu' })
    expect(statFor(s.progress, q.id).seen).toBeGreaterThan(0)
    expect(s.examResult).toBeNull()
    expect(s.pendingRound).toBe(waiting)
    expect(snapshotRound(s)).toBeNull()
  })

  it('a saved round that no longer fits the bank is dropped', () => {
    const s = reducer(play(okruhSet(), 2), { type: 'goMenu' })
    const bad = { ...s.pendingRound!, ids: [...s.pendingRound!.ids.slice(1), 999999] }
    expect(restoreRound(s, bad)).toBeNull()
    const badChoice = { ...s.pendingRound!, records: [{ id: s.pendingRound!.ids[0], choice: 'x' as Choice }] }
    expect(restoreRound(s, badChoice)).toBeNull()
    const r = reducer({ ...s, pendingRound: bad }, { type: 'resumeRound' })
    expect(r.view).toBe('home')
    expect(r.pendingRound).toBeNull()
  })
})
