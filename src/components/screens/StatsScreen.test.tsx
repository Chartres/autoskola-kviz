import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider } from '@/auth/AuthContext'
import { AppProvider } from '@/app/AppContext'
import { StatsScreen } from './StatsScreen'

function renderStats() {
  return render(
    <AuthProvider>
      <AppProvider>
        <StatsScreen />
      </AppProvider>
    </AuthProvider>,
  )
}

describe('StatsScreen', () => {
  beforeEach(() => localStorage.clear())

  it('lists recent mock exams with a readiness line', () => {
    localStorage.setItem(
      'exam-history-v1',
      JSON.stringify({
        version: 1,
        exams: [
          { at: 1750000000000, score: 45, total: 50, passed: true },
          { at: 1750100000000, score: 38, total: 50, passed: false },
        ],
      }),
    )
    renderStats()
    expect(screen.getByText(/Ostré testy/)).toBeInTheDocument()
    expect(screen.getByText(/1 z posledních 2/)).toBeInTheDocument()
    expect(screen.getByText('45')).toBeInTheDocument()
    expect(screen.getByText('38')).toBeInTheDocument()
  })
})
