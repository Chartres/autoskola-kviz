/**
 * Analytics on the primary theory journey. The shared `events` table only accepts the
 * event names in its insert policy; anything else is rejected silently (fire-and-forget),
 * so a wrong name means the event never reaches the console.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { App } from './App'

const { track, conversion } = vi.hoisted(() => ({ track: vi.fn(), conversion: vi.fn() }))
vi.mock('@/analytics', async (importActual) => ({
  ...(await importActual<typeof import('./analytics')>()),
  track,
  conversion,
  identify: vi.fn(),
}))

// Copy of the insert policy on flywheel-core public.events ("log known events"),
// read 2026-10-25.
const DB_ACCEPTS = [
  'page_view', 'signup_started', 'signup_completed', 'conversion', 'key_action',
  'feedback_given', 'error', 'app_open', 'start_lesson', 'start_practice', 'start_exam',
  'start_review', 'start_bookmarks', 'lesson_complete', 'exam_finish', 'session_finish',
]

const sent = () => track.mock.calls.map(([e]) => e as string)

beforeEach(() => {
  track.mockClear()
  conversion.mockClear()
  localStorage.clear()
})

describe('analytics on the theory journey', () => {
  it('sends page_view for the first screen and for each screen change', () => {
    render(<App />)
    expect(track).toHaveBeenCalledWith('page_view', { view: 'home' })
    act(() => {
      fireEvent.click(screen.getAllByText(/zvládnuto/)[0].closest('button')!)
    })
    expect(track).toHaveBeenCalledWith('page_view', { view: 'quiz' })
  })

  it('starting an okruh from Home sends only event names the database accepts', () => {
    render(<App />)
    act(() => {
      fireEvent.click(screen.getAllByText(/zvládnuto/)[0].closest('button')!)
    })
    expect(sent().filter((e) => !DB_ACCEPTS.includes(e))).toEqual([])
    expect(track).toHaveBeenCalledWith('start_practice', expect.objectContaining({ topic: expect.any(String) }))
  })

  it('a topic landing page counts its practice screen, not a home view that never showed', () => {
    window.history.replaceState(null, '', '/okruh/dopravni-znacky/')
    try {
      render(<App />)
      expect(track).not.toHaveBeenCalledWith('page_view', { view: 'home' })
      expect(track).toHaveBeenCalledWith('page_view', { view: 'quiz' })
    } finally {
      window.history.replaceState(null, '', '/')
    }
  })

  it('an okruh runs in sets of 20: each finished set has a results screen and sends one conversion', async () => {
    const { byCategory } = await import('@/domain/questions')
    render(<App />)
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Zdravotnická příprava/ }))
    })
    const bank = byCategory('Zdravotnická příprava')
    const sets = Math.ceil(bank.length / 20)
    const letters = ['a', 'b', 'c']
    const playSet = (n: number) => {
      for (let i = 0; i < n; i++) {
        const q = bank.find((x) => x.q === screen.getByRole('heading', { level: 2 }).textContent)!
        fireEvent.click(document.querySelectorAll<HTMLButtonElement>('button[data-state="idle"]')[letters.indexOf(q.correct)])
        fireEvent.click(screen.getByRole('button', { name: /Další|Dokončit/ }))
      }
    }
    expect(screen.getByText(`Zdravotnická příprava · sada 1 z ${sets} · otázky 1–20 z ${bank.length}`)).toBeTruthy()
    playSet(20)
    expect(screen.getByText(new RegExp(`sada 1 z ${sets} hotová`))).toBeTruthy()
    expect(screen.getByRole('progressbar', { name: 'Zdravotnická příprava: zodpovězené otázky' }).getAttribute('aria-valuenow')).toBe('20')
    expect(track).toHaveBeenCalledWith('session_finish', expect.objectContaining({ mode: 'practice', total: 20, set: 1, sets }))
    expect(conversion).toHaveBeenCalledTimes(1)
    expect(conversion).toHaveBeenCalledWith(expect.objectContaining({ mode: 'practice', total: 20 }))

    const rest = bank.length - 20
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: `Dalších ${Math.min(20, rest)}` }))
    })
    playSet(Math.min(20, rest))
    expect(screen.getByText(new RegExp(`sada 2 z ${sets} hotová`))).toBeTruthy()
    expect(conversion).toHaveBeenCalledTimes(2)
    if (sets === 2) expect(screen.queryByRole('button', { name: /^Dalších/ })).toBeNull()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Zpět' }))
    })
    expect(track).toHaveBeenCalledWith('page_view', { view: 'home' })
  })
})
