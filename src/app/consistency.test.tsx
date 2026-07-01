import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AuthProvider } from '@/auth/AuthContext'
import { AppProvider } from '@/app/AppContext'
import { App } from '@/App'
import { saveProgress } from '@/domain/storage'
import {
  emptyProgress,
  recordAnswer,
  summary,
  type ProgressData,
} from '@/domain/progress'
import { ALL_QUESTIONS } from '@/domain/questions'

// Build a known progress: practise the first 5 questions (3 of them twice).
function seededProgress(): ProgressData {
  let p = emptyProgress()
  const ids = ALL_QUESTIONS.slice(0, 5).map((q) => q.id)
  ids.forEach((id, i) => (p = recordAnswer(p, id, true, 100 + i)))
  ids.slice(0, 3).forEach((id, i) => (p = recordAnswer(p, id, true, 200 + i)))
  return p
}

beforeEach(() => localStorage.clear())

describe('cross-screen data consistency', () => {
  it('the same progress yields identical numbers on the menu and in statistics', async () => {
    saveProgress(seededProgress())
    render(
      <AuthProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </AuthProvider>,
    )

    const num = (el: HTMLElement | null) => parseInt(el?.textContent ?? '', 10)

    // Home reflects the seeded progress (the user's complaint: it must show up).
    const answered = num(await screen.findByTestId('stat-answered'))
    const mastered = num(screen.getByTestId('stat-mastered'))
    expect(answered).toBe(5) // 5 distinct questions seen
    expect(mastered).toBe(3) // 3 answered correctly twice

    // Navigate to the Postup (stats) tab and assert the very same numbers.
    fireEvent.click(screen.getByRole('button', { name: 'Postup' }))
    expect(num(screen.getByTestId('stat-answered'))).toBe(answered)
    expect(num(screen.getByTestId('stat-mastered'))).toBe(mastered)
  })

  it('summary is internally consistent (category sums equal the totals)', () => {
    const sum = summary(seededProgress(), ALL_QUESTIONS)
    const cats = Object.values(sum.byCategory)
    const seenSum = cats.reduce((n, c) => n + c!.seen, 0)
    const masteredSum = cats.reduce((n, c) => n + c!.mastered, 0)
    const totalSum = cats.reduce((n, c) => n + c!.total, 0)
    expect(seenSum).toBe(sum.answered)
    expect(masteredSum).toBe(sum.mastered)
    expect(totalSum).toBe(sum.total)
    expect(sum.total).toBe(ALL_QUESTIONS.length)
  })
})
