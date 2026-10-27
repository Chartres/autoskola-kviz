import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResultsScreen } from './ResultsScreen'
import { getQuestion } from '@/domain/questions'
import { createSession, answerCurrent } from '@/domain/session'

const q = getQuestion(448)!
const q2 = getQuestion(1)!
const h = vi.hoisted(() => ({ session: null as unknown }))
h.session = answerCurrent(createSession([q]), 'a')

vi.mock('@/app/AppContext', () => ({
  useApp: () => ({
    state: {
      session: h.session,
      examResult: null,
      mode: 'practice',
      progress: { streak: { current: 0 } },
    },
    dispatch: vi.fn(),
  }),
}))
const { conversion } = vi.hoisted(() => ({ conversion: vi.fn() }))
vi.mock('@/analytics', () => ({ track: vi.fn(), conversion }))
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
})
