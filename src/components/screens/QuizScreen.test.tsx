/**
 * Persona journey (Tereza, 18): she answers a question in practice, reads why the answer is
 * right and which paragraph of law says so, gets one wrong, and meets it again at the end.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { App } from '@/App'
import { byCategory } from '@/domain/questions'

const { track, conversion } = vi.hoisted(() => ({ track: vi.fn(), conversion: vi.fn() }))
vi.mock('@/analytics', async (importActual) => ({
  ...(await importActual<typeof import('@/analytics')>()),
  track,
  conversion,
  identify: vi.fn(),
}))

beforeEach(() => {
  localStorage.clear()
  track.mockClear()
  conversion.mockClear()
})

function startOkruh(name: RegExp) {
  render(<App />)
  act(() => {
    fireEvent.click(screen.getByRole('button', { name }))
  })
}

describe('practice: why, from the law', () => {
  it('after answering, explains why and links the paragraph it comes from', async () => {
    startOkruh(/Zdravotnická příprava/)
    fireEvent.click(document.querySelector('button[data-state="idle"]')!)
    const why = await screen.findByRole('region', { name: 'Proč' })
    expect(why.textContent!.length).toBeGreaterThan(20)
  })

  it('reports opening a source', async () => {
    startOkruh(/Související předpisy/)
    for (let i = 0; i < 5; i++) {
      fireEvent.click(document.querySelector('button[data-state="idle"]')!)
      const link = (await screen.findByRole('region', { name: 'Proč' })).querySelector('a')
      if (link) {
        fireEvent.click(link)
        expect(track).toHaveBeenCalledWith('key_action', expect.objectContaining({ action: 'source_opened' }))
        return
      }
      fireEvent.click(screen.getByRole('button', { name: /Další/ }))
    }
    throw new Error('no cited explanation in the first five questions')
  })
})

describe('control of error', () => {
  it('a missed question returns at the end, labelled as the correction round', async () => {
    startOkruh(/Zdravotnická příprava/)
    const bank = byCategory('Zdravotnická příprava')
    const letters = ['a', 'b', 'c']
    const missed = screen.getByRole('heading', { level: 2 }).textContent
    for (let i = 0; i < bank.length; i++) {
      // Miss the first question, get the rest right.
      const q = bank.find((x) => x.q === screen.getByRole('heading', { level: 2 }).textContent)!
      const opts = [...document.querySelectorAll<HTMLButtonElement>('button[data-state="idle"]')]
      const right = letters.indexOf(q.correct)
      fireEvent.click(opts[i === 0 ? (right + 1) % opts.length : right])
      fireEvent.click(screen.getByRole('button', { name: /Další|Dokončit|Opravit chyby/ }))
    }
    expect(screen.getByText(/Oprava chyb/)).toBeInTheDocument()
    // Finishing the first round is a finished set: counted now, whether or not the learner stays.
    expect(conversion).toHaveBeenCalledTimes(1)
    expect(conversion).toHaveBeenCalledWith(expect.objectContaining({ mode: 'practice', corrections: 1 }))
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(missed)
  })
})
