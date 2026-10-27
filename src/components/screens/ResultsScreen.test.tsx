import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResultsScreen } from './ResultsScreen'
import { getQuestion } from '@/domain/questions'
import { createSession, answerCurrent } from '@/domain/session'

const q = getQuestion(448)!
const q2 = getQuestion(1)!
const h = vi.hoisted(() => ({ session: null as unknown, correction: null as unknown }))
h.session = answerCurrent(createSession([q]), 'a')

vi.mock('@/app/AppContext', () => ({
  useApp: () => ({
    state: {
      session: h.session,
      examResult: null,
      mode: 'practice',
      correction: h.correction,
      progress: { streak: { current: 0 } },
    },
    dispatch: vi.fn(),
  }),
}))
const { conversion, track } = vi.hoisted(() => ({ conversion: vi.fn(), track: vi.fn() }))
vi.mock('@/analytics', () => ({ track, conversion }))
vi.mock('@/components/FeedbackCard', () => ({ FeedbackCard: () => null }))

describe('ResultsScreen', () => {
  it('counts a finished practice set as a conversion (North Star: weekly set completers)', () => {
    conversion.mockClear()
    render(<ResultsScreen />)
    expect(conversion).toHaveBeenCalledTimes(1)
    expect(conversion).toHaveBeenCalledWith(expect.objectContaining({ mode: 'practice' }))
  })

  it('shows the correct answer image for picture-answer questions', () => {
    expect(q.correct).toBe('c')
    render(<ResultsScreen />)
    const img = screen.getByAltText('Správná odpověď C') as HTMLImageElement
    expect(img.src).toContain(q.cImg!)
  })

  it('lists unanswered questions with their correct answer', () => {
    h.session = answerCurrent(createSession([q2, q]), q2.correct)
    render(<ResultsScreen />)
    expect(screen.getByText('Nezodpovězené (1)')).toBeTruthy()
    expect(screen.getByText(q.q)).toBeTruthy()
    expect(screen.getByAltText('Správná odpověď C')).toBeTruthy()
  })

  it('after a correction round: says how many errors were put right, and reports it', () => {
    h.correction = { first: h.session, missed: 2 }
    conversion.mockClear()
    try {
      render(<ResultsScreen />)
      expect(screen.getByText(/Opraveny 2 chyby/)).toBeTruthy()
      // The set was already counted when its first round ended (QuizScreen); not twice.
      expect(conversion).not.toHaveBeenCalled()
      expect(track).toHaveBeenCalledWith('key_action', { action: 'errors_corrected', count: 2 })
    } finally {
      h.correction = null
    }
  })
})
