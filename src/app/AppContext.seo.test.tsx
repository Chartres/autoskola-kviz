import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AppProvider, useApp } from './AppContext'
import { TOPICS } from '@/lib/topics'
import { byCategory } from '@/domain/questions'
import { emptyProgress, recordAnswer } from '@/domain/progress'
import { saveProgress } from '@/domain/storage'

const { auth } = vi.hoisted(() => ({ auth: { user: null as { id: string } | null } }))
vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ user: auth.user }),
  registerBeforeSignOut: () => () => {},
}))

function View() {
  const { state, dispatch } = useApp()
  return <button onClick={() => dispatch({ type: 'goMenu' })}>{state.view}</button>
}

afterEach(() => {
  window.history.replaceState(null, '', '/')
  auth.user = null
  localStorage.clear()
})

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

describe('signed-in user on a topic page', () => {
  // The account answered all of the okruh but three questions: those three open the set.
  function landSignedIn(sessionLate: boolean) {
    const topic = TOPICS[0]
    const qs = byCategory(topic.category)
    let progress = emptyProgress()
    for (const q of qs.slice(3)) progress = recordAnswer(progress, q.id, true, 1000)
    saveProgress(progress, 'A')
    let set: number[] = []
    function SetSpy() {
      set = useApp().state.session?.questions.map((q) => q.id) ?? []
      return null
    }
    window.history.replaceState(null, '', `/okruh/${topic.slug}/`)
    if (!sessionLate) auth.user = { id: 'A' }
    const { rerender } = render(<AppProvider><SetSpy /></AppProvider>)
    auth.user = { id: 'A' }
    act(() => rerender(<AppProvider><SetSpy /></AppProvider>))
    expect(set.slice(0, 3).sort()).toEqual(qs.slice(0, 3).map((q) => q.id).sort())
  }
  it('gets a set built from the account’s progress (session known a render late)', () => landSignedIn(true))
  it('gets a set built from the account’s progress (session known on the first render)', () => landSignedIn(false))
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
