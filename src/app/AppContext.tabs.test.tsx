import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AppProvider, useApp } from './AppContext'
import { emptyProgress, recordAnswer } from '@/domain/progress'
import { STORAGE_KEY, loadProgress, saveJizdy } from '@/domain/storage'

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
