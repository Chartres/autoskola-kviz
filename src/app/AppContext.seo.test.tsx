import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AppProvider, useApp } from './AppContext'
import { TOPICS } from '@/lib/topics'

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ user: null }),
  registerBeforeSignOut: () => () => {},
}))

function View() {
  const { state, dispatch } = useApp()
  return <button onClick={() => dispatch({ type: 'goMenu' })}>{state.view}</button>
}

afterEach(() => window.history.replaceState(null, '', '/'))

describe('SEO topic page', () => {
  it('returns the URL to / when the user leaves the practice started from /okruh/<slug>/', () => {
    window.history.replaceState(null, '', `/okruh/${TOPICS[0].slug}/`)
    render(<AppProvider><View /></AppProvider>)
    expect(screen.getByRole('button').textContent).toBe('quiz')
    expect(window.location.pathname).toBe(`/okruh/${TOPICS[0].slug}/`)
    act(() => screen.getByRole('button').click())
    expect(screen.getByRole('button').textContent).toBe('home')
    expect(window.location.pathname).toBe('/')
  })
})

describe('question page', () => {
  it('/otazka/<id>-<slug>/ opens practice of its okruh on that question, and leaves the URL after', async () => {
    const { getQuestion } = await import('@/domain/questions')
    const { currentQuestion } = await import('@/domain/session')
    let shown: number | undefined
    function Q() {
      const { state, dispatch } = useApp()
      shown = state.session ? currentQuestion(state.session)?.id : undefined
      return <button onClick={() => dispatch({ type: 'goMenu' })}>{state.view}</button>
    }
    window.history.replaceState(null, '', '/otazka/13-chodec-na-prechodu/')
    render(<AppProvider><Q /></AppProvider>)
    expect(screen.getByRole('button').textContent).toBe('quiz')
    expect(shown).toBe(13)
    expect(getQuestion(13)).toBeTruthy()
    act(() => screen.getByRole('button').click())
    expect(window.location.pathname).toBe('/')
  })
})

describe('mock-exam guide page', () => {
  it('/zkouska-nanecisto/ opens the Procvičovat tab without starting a timed exam, and leaves the URL', () => {
    window.history.replaceState(null, '', '/zkouska-nanecisto/')
    render(<AppProvider><View /></AppProvider>)
    expect(screen.getByRole('button').textContent).toBe('practice')
    expect(window.location.pathname).toBe('/')
    expect(localStorage.getItem('autoskola-kviz:exam:v1')).toBeNull()
  })
})
