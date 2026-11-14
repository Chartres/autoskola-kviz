import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AppProvider, useApp } from './AppContext'
import { emptyProgress, recordAnswer } from '@/domain/progress'
import { STORAGE_KEY, ROUND_KEY, loadProgress, saveJizdy } from '@/domain/storage'
import { byCategory } from '@/domain/questions'
import type { SavedRound } from './round'

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ user: null }),
  registerBeforeSignOut: () => () => {},
}))

let dispatch: ReturnType<typeof useApp>['dispatch']
function Spy() {
  const { state, dispatch: d } = useApp()
  dispatch = d
  const answered = Object.values(state.progress.stats).filter((s) => s.seen > 0).length
  return <div data-testid="n">{answered}/{state.jizdyState.lessons.length}</div>
}

beforeEach(() => localStorage.clear())

// Another tab writes localStorage; the browser fires `storage` in this tab.
const otherTabWrote = (key: string) =>
  act(() => { window.dispatchEvent(new StorageEvent('storage', { key })) })

function RoundSpy() {
  const { state } = useApp()
  return <div data-testid="round">{state.pendingRound ? 'waiting' : 'none'}</div>
}

describe('ROUND_KEY cross-tab handler', () => {
  it('does not re-dispatch when another tab echoes back an identical round (loop guard)', () => {
    // Load a valid lesson-mode round so this tab has a pendingRound on mount.
    const ids = byCategory('Zdravotnická příprava').slice(0, 10).map((q) => q.id)
    const round: SavedRound = { mode: 'lesson', ids, records: [] }
    localStorage.setItem(ROUND_KEY, JSON.stringify(round))

    render(<AppProvider><RoundSpy /></AppProvider>)
    expect(screen.getByTestId('round').textContent).toBe('waiting')

    // Another tab (or the loop-echo) writes the same round back to ROUND_KEY.
    // The fix must skip setPendingRound to avoid an infinite re-save loop.
    const saved = localStorage.getItem(ROUND_KEY)!
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: ROUND_KEY, newValue: saved }))
    })

    // Pending round is still there — no spurious dispatch changed it.
    expect(screen.getByTestId('round').textContent).toBe('waiting')
  })
})

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
})
