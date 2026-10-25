/** Reloading the page (or coming back after the browser dropped it) mid-exam. */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import { AppProvider, useApp } from './AppContext'
import { AuthProvider } from '@/auth/AuthContext'
import { makeRng } from '@/domain/rng'

vi.mock('@/auth/supabase', () => ({ supabase: null, isAuthConfigured: false }))

let app!: ReturnType<typeof useApp>
function Probe() {
  app = useApp()
  return null
}
const mount = () => render(<AuthProvider><AppProvider><Probe /></AppProvider></AuthProvider>)
function reload() {
  cleanup()
  mount()
}

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-25T10:00:00Z'))
})
afterEach(() => vi.useRealTimers())

function startExamAndAnswerTwo() {
  mount()
  act(() => app.dispatch({ type: 'startExam', rng: makeRng(7), now: Date.now() }))
  for (let i = 0; i < 2; i++) {
    const q = app.state.session!.questions[app.state.session!.index]
    act(() => app.dispatch({ type: 'answer', choice: q.correct, now: Date.now() }))
    act(() => app.dispatch({ type: 'next' }))
  }
  return { ids: app.state.session!.questions.map((q) => q.id), endsAt: app.state.examEndsAt }
}

describe('exam survives a reload', () => {
  it('comes back on the same question with its answers and the same deadline', () => {
    const before = startExamAndAnswerTwo()
    vi.setSystemTime(new Date('2026-10-25T10:05:00Z'))
    reload()
    expect(app.state.view).toBe('exam')
    expect(app.state.mode).toBe('exam')
    expect(app.state.session!.questions.map((q) => q.id)).toEqual(before.ids)
    expect(app.state.session!.index).toBe(2)
    expect(app.state.session!.records).toHaveLength(2)
    expect(app.state.examEndsAt).toBe(before.endsAt)
  })

  it('time ran out while away: opens on the results of that exam', () => {
    startExamAndAnswerTwo()
    vi.setSystemTime(new Date('2026-10-25T10:31:00Z')) // 30 min limit + 1
    reload()
    expect(app.state.view).toBe('results')
    expect(app.state.examResult).not.toBeNull()
    expect(app.state.session!.records).toHaveLength(2)
  })

  it('an exam abandoned long ago is dropped, not shown', () => {
    startExamAndAnswerTwo()
    vi.setSystemTime(new Date('2026-10-26T10:00:00Z'))
    reload()
    expect(app.state.view).toBe('home')
    expect(app.state.session).toBeNull()
  })

  it('a finished or quit exam does not come back', () => {
    startExamAndAnswerTwo()
    act(() => app.dispatch({ type: 'goMenu' }))
    reload()
    expect(app.state.view).toBe('home')
  })
})
