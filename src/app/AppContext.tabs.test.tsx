import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AppProvider, useApp } from './AppContext'
import { emptyProgress, recordAnswer } from '@/domain/progress'
import { STORAGE_KEY, ROUND_KEY, EXAM_KEY, loadProgress, saveJizdy, swapDeviceAccount } from '@/domain/storage'
import { byCategory } from '@/domain/questions'
import { freshRng } from '@/domain/rng'

const { auth } = vi.hoisted(() => ({ auth: { user: null as { id: string } | null } }))
vi.mock('@/auth/supabase', () => ({ supabase: null, isAuthConfigured: false }))
vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ user: auth.user }),
  registerBeforeSignOut: () => () => {},
}))

let dispatch: ReturnType<typeof useApp>['dispatch']
function Spy() {
  const { state, dispatch: d } = useApp()
  dispatch = d
  const answered = Object.values(state.progress.stats).filter((s) => s.seen > 0).length
  return <div data-testid="n">{answered}/{state.jizdyState.lessons.length}</div>
}

function ViewSpy() {
  return <div data-testid="view">{useApp().state.view}</div>
}

beforeEach(() => {
  localStorage.clear()
  auth.user = null
})

// Another tab writes localStorage; the browser fires `storage` in this tab.
const otherTabWrote = (key: string) =>
  act(() => { window.dispatchEvent(new StorageEvent('storage', { key })) })

describe('AppProvider across tabs on one device', () => {
  it("picks up another tab's answers and does not overwrite them on the next answer", () => {
    render(<AppProvider><Spy /></AppProvider>)
    // Tab 1 answered 10 questions and saved them.
    let tab1 = emptyProgress()
    for (let id = 1; id <= 10; id++) tab1 = recordAnswer(tab1, id, true, 1000 + id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tab1))
    otherTabWrote(STORAGE_KEY)
    expect(screen.getByTestId('n').textContent).toBe('10/0')

    // This tab answers one more: storage must hold all 11.
    act(() => dispatch({ type: 'hydrate', progress: recordAnswer(loadProgress(), 11, true, 5000) }))
    expect(Object.keys(loadProgress().stats)).toHaveLength(11)
  })

  it("picks up another tab's Jízdy lessons", () => {
    render(<AppProvider><Spy /></AppProvider>)
    saveJizdy({ version: 1, lessons: [{ id: 'a', date: '2026-09-01', durationMin: 60, skills: [] }] })
    otherTabWrote('jizdy-v1')
    expect(screen.getByTestId('n').textContent).toBe('0/1')
  })

  it("does not write its own set back when another tab saves a set (no ping-pong)", () => {
    render(<AppProvider><Spy /></AppProvider>)
    // This tab is partway through its own set.
    act(() => dispatch({ type: 'startLesson', rng: freshRng() }))
    act(() => dispatch({ type: 'answer', choice: 'a', now: 1000 }))
    expect(localStorage.getItem(ROUND_KEY)).not.toBeNull()
    // The other tab saves its set: this tab must leave it in storage.
    const ids = byCategory('Zdravotnická příprava').slice(0, 10).map((q) => q.id)
    const theirs = JSON.stringify({ mode: 'lesson', ids, records: [{ id: ids[0], choice: 'a' }] })
    localStorage.setItem(ROUND_KEY, theirs)
    otherTabWrote(ROUND_KEY)
    expect(localStorage.getItem(ROUND_KEY)).toBe(theirs)
  })

  it("drops account A's exam when B's sign-in link opened in another tab switches this tab to B", async () => {
    const ui = () => <AppProvider><Spy /><ViewSpy /></AppProvider>
    auth.user = { id: 'A' }
    const { rerender } = render(ui())
    act(() => dispatch({ type: 'startExam', rng: freshRng(), now: Date.now() }))
    act(() => dispatch({ type: 'answer', choice: 'a', now: Date.now() }))
    expect(localStorage.getItem(EXAM_KEY)).not.toBeNull()
    // Tab 2 opened B's link: it recorded B as the device account; this tab hears B's session.
    swapDeviceAccount('B')
    auth.user = { id: 'B' }
    await act(async () => rerender(ui()))
    expect(screen.getByTestId('view').textContent).toBe('home')
    expect(localStorage.getItem(EXAM_KEY)).toBeNull()
  })

  it("closes account A's okruh set on screen when B's sign-in link opened in another tab switches this tab to B", async () => {
    const ui = () => <AppProvider><Spy /><ViewSpy /></AppProvider>
    auth.user = { id: 'A' }
    const { rerender } = render(ui())
    act(() => dispatch({ type: 'startLesson', rng: freshRng() }))
    act(() => dispatch({ type: 'answer', choice: 'a', now: Date.now() }))
    expect(localStorage.getItem(ROUND_KEY)).not.toBeNull()
    swapDeviceAccount('B')
    auth.user = { id: 'B' }
    await act(async () => rerender(ui()))
    expect(screen.getByTestId('view').textContent).toBe('home')
    expect(localStorage.getItem(ROUND_KEY)).toBeNull()
  })
})
