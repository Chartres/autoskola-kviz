import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider } from '@/auth/AuthContext'
import { AppProvider } from '@/app/AppContext'
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
