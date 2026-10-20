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
