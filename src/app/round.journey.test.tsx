/** Leaving a set partway and coming back (Pavol, 2026-11-01), through the real app. */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { App } from '@/App'
import { byCategory } from '@/domain/questions'
import { ROUND_KEY } from '@/domain/storage'

const { track, conversion } = vi.hoisted(() => ({ track: vi.fn(), conversion: vi.fn() }))
vi.mock('@/analytics', async (importActual) => ({
  ...(await importActual<typeof import('@/analytics')>()),
  track,
  conversion,
  identify: vi.fn(),
}))

// Fixed seeds: two questions of this okruh share their wording, and the test finds a question
// by its wording, so random sets would make it flaky.
vi.mock('@/domain/rng', async (importActual) => {
  const real = await importActual<typeof import('@/domain/rng')>()
  let seed = 1
  return { ...real, freshRng: () => real.makeRng(seed++) }
})

const OKRUH = 'Zdravotnická příprava'
const bank = byCategory(OKRUH)
const letters = ['a', 'b', 'c']
const heading = () => screen.getByRole('heading', { level: 2 }).textContent
const current = () => bank.find((x) => x.q === heading())!

/** Answer the question on screen (right, or the first wrong option) and move on. */
function answer(right = true) {
  const q = current()
  const pick = right ? letters.indexOf(q.correct) : q.correct === 'a' ? 1 : 0
  fireEvent.click(document.querySelectorAll<HTMLButtonElement>('button[data-state="idle"]')[pick])
  fireEvent.click(screen.getByRole('button', { name: /Další|Dokončit|Opravit chyby/ }))
}

const finishEvents = () =>
  track.mock.calls.filter(([e]) => ['session_finish', 'lesson_complete', 'exam_finish'].includes(e as string))

beforeEach(() => {
  track.mockClear()
  conversion.mockClear()
  localStorage.clear()
})

describe('an unfinished set waits on Home', () => {
  it('leave after 8, reload, Pokračovat: question 9 of the same set; no completion events until finished', () => {
    render(<App />)
    act(() => fireEvent.click(screen.getByRole('button', { name: new RegExp(OKRUH) })))
    const asked: string[] = []
    for (let i = 0; i < 8; i++) {
      asked.push(heading()!)
      answer()
    }
    const ninth = heading()
    act(() => fireEvent.click(screen.getByRole('button', { name: /Konec/ })))
    expect(conversion).not.toHaveBeenCalled()
    expect(finishEvents()).toEqual([])
    expect(localStorage.getItem(ROUND_KEY)).toBeTruthy()

    // A reload: the set still waits.
    cleanup()
    render(<App />)
    expect(screen.getByText('Rozpracovaná sada')).toBeTruthy()
    expect(screen.getByText('Zodpovězeno 8 z 20')).toBeTruthy()
    act(() => fireEvent.click(screen.getByRole('button', { name: /Pokračovat/ })))
    expect(track).toHaveBeenCalledWith('key_action', expect.objectContaining({ action: 'round_resumed', answered: 8 }))
    expect(heading()).toBe(ninth)
    expect(screen.getByText((_, el) => el?.textContent === '09 / 20')).toBeTruthy()

    for (let i = 8; i < 20; i++) answer()
    expect(screen.getByText(/sada 1 z \d+ hotová/)).toBeTruthy()
    expect(conversion).toHaveBeenCalledTimes(1)
    expect(finishEvents()).toHaveLength(1)
    expect(localStorage.getItem(ROUND_KEY)).toBeNull()
    expect(asked).not.toContain(ninth)
  })

  it('Nový trénink starts a fresh set of the okruh without the questions already answered', () => {
    render(<App />)
    act(() => fireEvent.click(screen.getByRole('button', { name: new RegExp(OKRUH) })))
    const asked = new Set<string>()
    for (let i = 0; i < 8; i++) {
      asked.add(heading()!)
      answer()
    }
    act(() => fireEvent.click(screen.getByRole('button', { name: /Konec/ })))
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Nový trénink' })))
    expect(screen.getByText((_, el) => el?.textContent === '01 / 20')).toBeTruthy()
    const shown = new Set<string>()
    for (let i = 0; i < 20; i++) {
      shown.add(heading()!)
      answer()
    }
    // Two questions in this okruh share their wording; only unique wordings identify a question.
    const unique = (h: string) => bank.filter((q) => q.q === h).length === 1
    expect([...shown].filter((h) => asked.has(h) && unique(h))).toEqual([])
    expect(screen.queryByText('Rozpracovaná sada')).toBeNull()
  })

  it('a correction round left partway: the conversion is not sent again when it is resumed', () => {
    render(<App />)
    act(() => fireEvent.click(screen.getByRole('button', { name: new RegExp(OKRUH) })))
    for (let i = 0; i < 20; i++) answer(i >= 2) // two wrong
    expect(screen.getByText(/Oprava chyb/)).toBeTruthy()
    expect(conversion).toHaveBeenCalledTimes(1)
    act(() => fireEvent.click(screen.getByRole('button', { name: /Konec/ })))
    expect(screen.getByText('Oprava chyb · zodpovězeno 0 z 2')).toBeTruthy()
    act(() => fireEvent.click(screen.getByRole('button', { name: /Pokračovat/ })))
    expect(screen.getByText(/Oprava chyb/)).toBeTruthy()
    answer()
    answer()
    expect(screen.getByText(/sada 1 z \d+ hotová/)).toBeTruthy()
    expect(screen.getByText(/Opraveny 2 chyby/)).toBeTruthy()
    expect(conversion).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith('key_action', { action: 'errors_corrected', count: 2 })
  })

  it('a mock exam left early sends no exam_finish', () => {
    render(<App />)
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Procvičovat' })))
    act(() => fireEvent.click(screen.getByRole('button', { name: /Zkušební test/ })))
    act(() => fireEvent.click(document.querySelectorAll<HTMLButtonElement>('button[data-state="idle"]')[0]))
    act(() => fireEvent.click(screen.getByRole('button', { name: /Konec/ })))
    expect(finishEvents()).toEqual([])
    expect(conversion).not.toHaveBeenCalled()
    expect(screen.queryByText('Rozpracovaná sada')).toBeNull()
  })

  it('a reload on a topic landing page mid-set shows the waiting set, not a new one', () => {
    window.history.replaceState(null, '', '/okruh/zdravotnicka-priprava/')
    try {
      render(<App />)
      for (let i = 0; i < 3; i++) answer()
      cleanup()
      render(<App />)
      expect(screen.getByText('Zodpovězeno 3 z 20')).toBeTruthy()
      expect(window.location.pathname).toBe('/')
    } finally {
      window.history.replaceState(null, '', '/')
    }
  })

  it('a damaged or outdated saved set is dropped without breaking Home', () => {
    for (const bad of [
      { mode: 'practice', ids: [bank[0].id], records: [], practiceSet: { queue: [bank[0].id], offset: 0, label: { x: 1 }, categories: 5, search: '' } },
      { mode: 'lesson', ids: [999999], records: [] },
      { mode: 'lesson', ids: [bank[0].id], records: [{ id: bank[0].id, choice: 'z' }] },
    ]) {
      localStorage.setItem(ROUND_KEY, JSON.stringify(bad))
      render(<App />)
      expect(screen.getByText('Denní dávka')).toBeTruthy()
      expect(screen.queryByText('Rozpracovaná sada')).toBeNull()
      cleanup()
    }
  })

  it('a set finished in another tab disappears from this one', () => {
    render(<App />)
    act(() => fireEvent.click(screen.getByRole('button', { name: new RegExp(OKRUH) })))
    answer()
    act(() => fireEvent.click(screen.getByRole('button', { name: /Konec/ })))
    expect(screen.getByText('Rozpracovaná sada')).toBeTruthy()
    localStorage.removeItem(ROUND_KEY)
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: ROUND_KEY }))
    })
    expect(screen.queryByText('Rozpracovaná sada')).toBeNull()
  })
})
