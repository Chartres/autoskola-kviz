import { describe, it, expect } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { useEffect } from 'react'
import { AuthProvider } from '@/auth/AuthContext'
import { AppProvider, useApp } from '@/app/AppContext'
import { HomeScreen } from './HomeScreen'
import { emptyProgress } from '@/domain/progress'
import { STORAGE_KEY } from '@/domain/storage'
import { todayStr } from '@/lib/date'

function streakShown(lastDate: string): string | null | undefined {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...emptyProgress(), streak: { current: 5, best: 5, lastDate } }),
  )
  render(
    <AuthProvider>
      <AppProvider>
        <HomeScreen />
      </AppProvider>
    </AuthProvider>,
  )
  return screen.getByText(/v řadě/).previousElementSibling?.textContent
}

describe('HomeScreen streak (M7)', () => {
  it('shows 0 when the stored streak is broken (last lesson 3 days ago)', () => {
    const d = new Date()
    d.setDate(d.getDate() - 3)
    expect(streakShown(todayStr(d))).toBe('0')
  })

  it('shows the stored streak when the last lesson was today', () => {
    expect(streakShown(todayStr())).toBe('5')
  })
})

describe('HomeScreen okruh tile', () => {
  it('ignores a search term typed earlier on the Procvičovat tab', () => {
    let seen: { search: string; n: number } = { search: 'x', n: -1 }
    function Probe() {
      const { state, dispatch } = useApp()
      useEffect(() => dispatch({ type: 'setSearch', search: 'zzzzzz' }), [dispatch])
      seen = { search: state.search, n: state.session?.questions.length ?? -1 }
      return null
    }
    render(
      <AuthProvider>
        <AppProvider>
          <Probe />
          <HomeScreen />
        </AppProvider>
      </AuthProvider>,
    )
    expect(seen.search).toBe('zzzzzz')
    act(() => {
      fireEvent.click(screen.getAllByText(/zvládnuto/)[0].closest('button')!)
    })
    expect(seen.search).toBe('')
    expect(seen.n).toBeGreaterThan(0)
  })
})
