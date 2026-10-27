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

  it('does not advance when Enter/Space is pressed on the focused bookmark button', async () => {
    const user = userEvent.setup()
    const { onNext, onToggleBookmark } = setup({ chosen: 'a' })
    screen.getByRole('button', { name: /záložek/ }).focus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onToggleBookmark).toHaveBeenCalledTimes(2)
    expect(onNext).not.toHaveBeenCalled()
  })

  it('says so when an option image fails to load', () => {
    setup({ question: { ...Q, a: '', aImg: 'media/x.png' } as Question })
    fireEvent.error(screen.getByAltText('Možnost A'))
    expect(screen.getByText(/Obrázek se nenačetl/)).toBeTruthy()
  })

  it('says so when the question image fails to load', () => {
    setup({ question: { ...Q, image: 'media/x.png' } })
    fireEvent.error(screen.getByAltText('Obrázek k otázce 1'))
    expect(screen.getByText(/Obrázek se nenačetl/)).toBeTruthy()
  })

  describe('explanation from the law (ad fontes)', () => {
    const explanation = {
      why: 'Chodec nesmí vstoupit na přechod bezprostředně před blížící se vozidlo.',
      sources: [{ law: '361/2000 Sb.', ref: '§ 54 odst. 3', anchor: 'p54-3', quote: 'Chodec nesmí vstupovat na přechod pro chodce' }],
    }

    it('after answering in practice: why, the quoted law and a link to the paragraph', () => {
      setup({ chosen: 'a', explanation })
      expect(screen.getByText(explanation.why)).toBeInTheDocument()
      expect(screen.getByText(/Chodec nesmí vstupovat na přechod pro chodce/)).toBeInTheDocument()
      const link = screen.getByRole('link', { name: /§ 54 odst. 3 zákona č. 361\/2000 Sb./ })
      expect(link).toHaveAttribute('href', 'https://www.zakonyprolidi.cz/cs/2000-361#p54-3')
    })

    it('not before answering, and never in the exam', () => {
      setup({ explanation })
      expect(screen.queryByText(explanation.why)).not.toBeInTheDocument()
      setup({ chosen: 'a', reveal: false, explanation })
      expect(screen.queryByText(explanation.why)).not.toBeInTheDocument()
    })

    it('says so when current law or practice differs from the official answer', () => {
      setup({ chosen: 'a', explanation: { ...explanation, flag: 'Současná doporučení uvádějí 5–6 cm.' } })
      expect(screen.getByText(/Současná doporučení uvádějí 5–6 cm./)).toBeInTheDocument()
    })

    it('reports opening a source', () => {
      const onSourceOpen = vi.fn()
      setup({ chosen: 'a', explanation, onSourceOpen })
      fireEvent.click(screen.getByRole('link', { name: /§ 54 odst. 3/ }))
      expect(onSourceOpen).toHaveBeenCalledWith(explanation.sources[0])
    })
  })

  it('a wrong answer says the question will come back', () => {
    const wrong = (['a', 'b', 'c'] as const).find((c) => c !== Q.correct)!
    setup({ chosen: wrong })
    expect(screen.getByText(/vrátí na konci sady/)).toBeInTheDocument()
  })

  it('a sign question names its sign under the picture once answered (Orbis Pictus)', () => {
    const explanation = { why: 'Značka upozorňuje na zatáčku vpravo.', sources: [], sign: { code: 'A 1a', name: 'Zatáčka vpravo' } }
    setup({ question: { ...Q, image: 'sign.png' }, explanation })
    expect(screen.queryByText('Zatáčka vpravo')).not.toBeInTheDocument()
    setup({ question: { ...Q, image: 'sign.png' }, chosen: 'a', explanation })
    expect(screen.getByText('A 1a')).toBeInTheDocument()
    expect(screen.getByText('Zatáčka vpravo')).toBeInTheDocument()
  })

  it('renders a video with the still as poster for animated questions', () => {
    setup({ question: { ...Q, video: 'anim.mp4', image: 'still.webp' } })
    const video = screen.getByTestId('question-video')
    expect(video).toHaveAttribute('poster', expect.stringContaining('still.webp'))
    expect(video.querySelector('source')).toHaveAttribute('src', expect.stringContaining('anim.mp4'))
    expect(screen.getByText(/Spusťte animaci/)).toBeInTheDocument()
  })

  it('falls back to the still when the video fails to load (offline, unsupported)', () => {
    setup({ question: { ...Q, video: 'anim.mp4', image: 'still.webp' } })
    fireEvent.error(screen.getByTestId('question-video'))
    expect(screen.queryByTestId('question-video')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Obrázek k otázce/ })).toBeInTheDocument()
    expect(screen.getByText(/Animace nedostupná/)).toBeInTheDocument()
  })

  it('ignores answer keys originating from the video element', () => {
    const { onNext } = setup({ question: { ...Q, video: 'anim.mp4', image: 'still.webp' }, chosen: 'b' })
    // Space on the focused video toggles play/pause; it must not also advance.
    fireEvent.keyDown(screen.getByTestId('question-video'), { key: ' ' })
    expect(onNext).not.toHaveBeenCalled()
    fireEvent.keyDown(document.body, { key: ' ' })
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('answer keys still work while the video has focus (after pressing play)', () => {
    const { onAnswer } = setup({ question: { ...Q, video: 'anim.mp4', image: 'still.webp' } })
    fireEvent.keyDown(screen.getByTestId('question-video'), { key: '2' })
    expect(onAnswer).toHaveBeenCalledWith('b')
  })

  it('names the video for screen readers', () => {
    setup({ question: { ...Q, video: 'anim.mp4', image: 'still.webp' } })
    expect(screen.getByLabelText('Animace k otázce 1')).toBe(screen.getByTestId('question-video'))
  })

  it('the last question says the errors come next when there are some', () => {
    setup({ chosen: 'a', index: 9, total: 10, willCorrect: true })
    expect(screen.getByRole('button', { name: /Opravit chyby/ })).toBeInTheDocument()
  })

  it('the explanation is a region named by its heading and announced when it appears', () => {
    const explanation = { why: 'Protože zákon.', sources: [] }
    setup({ chosen: 'a', explanation })
    const region = screen.getByRole('region', { name: 'Proč' })
    expect(region).toHaveAttribute('aria-live', 'polite')
  })
})
