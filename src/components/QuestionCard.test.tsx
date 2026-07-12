import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestionCard } from './QuestionCard'
import type { Question } from '@/domain/types'

const Q: Question = {
  id: 1,
  cat: 'Pravidla provozu',
  q: 'Chodec vstupující na přechod pro chodce:',
  a: 'má vždy absolutní přednost.',
  b: 'nesmí vstupovat bezprostředně před blížící se vozidlo.',
  c: 'smí přecházet kdekoli, je-li přechod dále než 50 m.',
  correct: 'b',
  image: null,
  points: 2,
  sourceId: 1,
}

function setup(props: Partial<Parameters<typeof QuestionCard>[0]> = {}) {
  const onAnswer = vi.fn()
  const onNext = vi.fn()
  const onToggleBookmark = vi.fn()
  render(
    <QuestionCard
      question={Q}
      reveal
      bookmarked={false}
      index={0}
      total={10}
      onAnswer={onAnswer}
      onNext={onNext}
      onToggleBookmark={onToggleBookmark}
      {...props}
    />,
  )
  return { onAnswer, onNext, onToggleBookmark }
}

describe('QuestionCard', () => {
  it('renders the stem and three options', () => {
    setup()
    expect(screen.getByText('Chodec vstupující na přechod pro chodce:')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /absolutní přednost/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nesmí vstupovat/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /kdekoli/ })).toBeInTheDocument()
  })

  it('calls onAnswer with the chosen option', async () => {
    const { onAnswer } = setup()
    await userEvent.click(screen.getByRole('button', { name: /nesmí vstupovat/ }))
    expect(onAnswer).toHaveBeenCalledWith('b')
  })

  it('supports keyboard selection (1/2/3)', async () => {
    const { onAnswer } = setup()
    await userEvent.keyboard('2')
    expect(onAnswer).toHaveBeenCalledWith('b')
  })

  it('supports keyboard selection by letter (a/b/c, case-insensitive)', async () => {
    const { onAnswer } = setup()
    await userEvent.keyboard('c')
    expect(onAnswer).toHaveBeenCalledWith('c')
    await userEvent.keyboard('A')
    expect(onAnswer).toHaveBeenCalledWith('a')
  })

  it('reveals the correct answer after a wrong choice (control of error)', () => {
    setup({ chosen: 'a' })
    // the correct option is marked, regardless of what was chosen
    const correct = screen.getByRole('button', { name: /nesmí vstupovat/ })
    expect(correct).toHaveAttribute('data-state', 'correct')
    const wrong = screen.getByRole('button', { name: /absolutní přednost/ })
    expect(wrong).toHaveAttribute('data-state', 'wrong')
    expect(screen.getByText(/správná odpověď/i)).toBeInTheDocument()
  })

  it('locks options once answered', () => {
    setup({ chosen: 'b' })
    expect(screen.getByRole('button', { name: /absolutní přednost/ })).toBeDisabled()
  })

  it('does NOT reveal correctness in exam mode', () => {
    setup({ chosen: 'a', reveal: false })
    const correct = screen.getByRole('button', { name: /nesmí vstupovat/ })
    expect(correct).not.toHaveAttribute('data-state', 'correct')
    // chosen option is merely selected
    expect(screen.getByRole('button', { name: /absolutní přednost/ })).toHaveAttribute(
      'data-state',
      'selected',
    )
    expect(screen.queryByText(/správná odpověď/i)).not.toBeInTheDocument()
  })

  it('toggles the bookmark', async () => {
    const { onToggleBookmark } = setup()
    await userEvent.click(screen.getByRole('button', { name: /zálož/i }))
    expect(onToggleBookmark).toHaveBeenCalled()
  })

  it('renders only two options when c is null and ignores the c key', async () => {
    const { onAnswer } = setup({ question: { ...Q, c: null } })
    expect(screen.queryByRole('button', { name: /kdekoli/ })).not.toBeInTheDocument()
    await userEvent.keyboard('3')
    await userEvent.keyboard('c')
    expect(onAnswer).not.toHaveBeenCalled()
    await userEvent.keyboard('2')
    expect(onAnswer).toHaveBeenCalledWith('b')
  })

  it('renders the question image eagerly (current question) with an alt text', () => {
    setup({ question: { ...Q, image: 'znacka-stuj.svg' } })
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', expect.stringContaining('znacka-stuj.svg'))
    // Eager by default — the current question's image must not lazy-load.
    expect(img).not.toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAccessibleName()
    // The media box reserves its height up front (no layout flash on load).
    expect(img.parentElement).toHaveClass('min-h-64')
  })

  it('renders a video with the still as poster for animated questions', () => {
    setup({ question: { ...Q, video: 'anim.mp4', image: 'still.webp' } })
    const video = screen.getByTestId('question-video')
    expect(video).toHaveAttribute('poster', expect.stringContaining('still.webp'))
    expect(video.querySelector('source')).toHaveAttribute(
      'src',
      expect.stringContaining('anim.mp4'),
    )
    expect(screen.getByText(/Spusťte animaci/)).toBeInTheDocument()
  })

  it('falls back to the still when the video fails to load', () => {
    setup({ question: { ...Q, video: 'anim.mp4', image: 'still.webp' } })
    fireEvent.error(screen.getByTestId('question-video'))
    expect(screen.queryByTestId('question-video')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Obrázek k otázce/ })).toBeInTheDocument()
    expect(screen.getByText(/Animace nedostupná/)).toBeInTheDocument()
  })

  it('renders a plain image for non-video questions (unchanged)', () => {
    setup({ question: { ...Q, image: 'still.webp' } })
    expect(screen.queryByTestId('question-video')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Obrázek k otázce/ })).toBeInTheDocument()
  })
})
