import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider } from '@/auth/AuthContext'
import { AppProvider } from '@/app/AppContext'
import { StudyScreen } from './StudyScreen'

function renderStudy() {
  return render(
    <AuthProvider>
      <AppProvider>
        <StudyScreen />
      </AppProvider>
    </AuthProvider>,
  )
}

describe('StudyScreen', () => {
  it('shows the dataset freshness date', () => {
    renderStudy()
    expect(screen.getByText(/Otázky aktualizovány k/)).toBeInTheDocument()
  })
})
