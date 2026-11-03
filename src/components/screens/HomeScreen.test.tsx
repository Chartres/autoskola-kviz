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
      fireEvent.click(screen.getByRole('button', { name: /^Pravidla provozu/ }))
    })
    expect(seen.search).toBe('')
    expect(seen.n).toBeGreaterThan(0)
  })
})

describe('HomeScreen readiness (Připravenost, Pavol 2026-11-03: option B)', () => {
  async function homeWith(answers: Record<string, [number, number]>) {
    const { byCategory } = await import('@/domain/questions')
    const { recordAnswer } = await import('@/domain/progress')
    let p = emptyProgress()
    for (const [cat, [n, right]] of Object.entries(answers)) {
      byCategory(cat as never).slice(0, n).forEach((q, i) => {
        p = recordAnswer(p, q.id, i < right, 1000 + i)
      })
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    render(
      <AuthProvider>
        <AppProvider>
          <HomeScreen />
        </AppProvider>
      </AuthProvider>,
    )
  }
  const all = (right: Record<string, number> = {}) =>
    Object.fromEntries(
      ['Pravidla provozu', 'Dopravní značky', 'Dopravní situace', 'Zásady bezpečné jízdy',
        'Podmínky provozu vozidel', 'Související předpisy', 'Zdravotnická příprava'].map((c) => [c, [10, right[c] ?? 10]]),
    ) as Record<string, [number, number]>

  it('a new learner sees each okruh\'s points in the test and no estimate', async () => {
    await homeWith({})
    expect(screen.getByTestId('readiness-total').textContent).toMatch(/po 10 zodpovězených otázkách.*potřeba 43 z 50/)
    expect(screen.getByRole('button', { name: /^Dopravní situace/ }).textContent).toContain('max. 12 bodůzatím 0/10 otázek')
    expect(screen.getByRole('button', { name: /^Zdravotnická příprava/ }).textContent).toContain('max. 1 bod')
    expect(screen.queryAllByRole('progressbar', { name: /odhad bodů/ })).toHaveLength(0)
    expect(screen.queryByText('Nejvíc ztrát')).toBeNull()
  })

  it('with some okruhy estimated: their points and bar, the weakest marked, no total yet', async () => {
    await homeWith({ 'Pravidla provozu': [10, 5], 'Dopravní značky': [10, 9] })
    expect(screen.getByRole('button', { name: /^Pravidla provozu/ }).textContent).toContain('Nejvíc ztrát10 z 20 bodů')
    const bar = screen.getByRole('progressbar', { name: 'Pravidla provozu: odhad bodů' })
    expect(bar.getAttribute('aria-valuenow')).toBe('10')
    expect(bar.getAttribute('aria-valuetext')).toBe('10 z 20 bodů')
    expect(screen.getByTestId('readiness-total').textContent).toMatch(/Celkový odhad se ukáže/)
  })

  it('with every okruh estimated: the expected total against 43', async () => {
    await homeWith(all({ 'Dopravní situace': 6 }))
    expect(screen.getByTestId('readiness-total').textContent).toBe('Odhad u zkoušky: 45,2 z 50 bodů · potřeba 43')
    expect(screen.getByRole('button', { name: /^Dopravní situace/ }).textContent).toContain('Nejvíc ztrát7,2 z 12 bodů')
  })
})
