import { useEffect, useState } from 'react'
import type { Choice, Question } from '@/domain/types'
import { imageUrl } from '@/lib/assets'
import { sourceLabel, sourceUrl, type Explanation, type LawSource } from '@/domain/explanations'

export interface QuestionCardProps {
  question: Question
  /** Whether to reveal correctness (practice/review) or hide it (exam). */
  reveal: boolean
  /** The chosen option, if the question has been answered. */
  chosen?: Choice
  bookmarked: boolean
  index: number
  total: number
  onAnswer: (choice: Choice) => void
  onNext: () => void
  onToggleBookmark: () => void
  /** Why the official answer is right, from the law; shown after answering outside the exam. */
  explanation?: Explanation | null
  onSourceOpen?: (source: LawSource) => void
  /** The set has errors to put right after this question (control of error). */
  willCorrect?: boolean
}

const ALL_OPTIONS: Choice[] = ['a', 'b', 'c']
/** Some official questions have only two answers (c is null). */
function optionsFor(question: Question): Choice[] {
  return ALL_OPTIONS.filter((o) => question[o] !== null)
}
const KEY_TO_CHOICE: Record<string, Choice> = {
  '1': 'a',
  '2': 'b',
  '3': 'c',
  a: 'a',
  b: 'b',
  c: 'c',
}

type OptionState = 'idle' | 'correct' | 'wrong' | 'selected' | 'muted'

function optionState(
  option: Choice,
  question: Question,
  chosen: Choice | undefined,
  reveal: boolean,
): OptionState {
  if (chosen === undefined) return 'idle'
  if (reveal) {
    if (option === question.correct) return 'correct'
    if (option === chosen) return 'wrong'
    return 'muted'
  }
  return option === chosen ? 'selected' : 'muted'
}

const STATE_CLASS: Record<OptionState, string> = {
  idle: 'border-sand-700 bg-sand-800/50 hover:border-terra-400 hover:bg-sand-700/50',
  selected: 'border-terra-500 bg-sand-700/70 glow-terra',
  correct: 'border-moss-500 bg-moss-500/12 text-sand-50 glow-moss',
  wrong: 'border-rust-500 bg-rust-500/12 text-sand-50',
  muted: 'border-sand-800 bg-sand-900/50 text-sand-400 opacity-60',
}

function ImageFailed() {
  return (
    <span role="alert" className="text-sm text-rust-400">
      Obrázek se nenačetl — jste offline?
    </span>
  )
}

export function QuestionCard({
  question,
  reveal,
  chosen,
  bookmarked,
  index,
  total,
  onAnswer,
  onNext,
  onToggleBookmark,
  explanation,
  onSourceOpen,
  willCorrect,
}: QuestionCardProps) {
  const answered = chosen !== undefined
  const isCorrect = answered && chosen === question.correct
  const options = optionsFor(question)
  // Images that failed to load (e.g. offline, not yet in the runtime cache).
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set())
  const markFailed = (src: string) => setFailed((f) => new Set(f).add(src))
  // Animated situations play the official clip; the still is the poster and the fallback.
  const showVideo = !!question.video && !failed.has(imageUrl(question.video))

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return
      // A focused button/link handles Enter/Space itself (bookmark, back, "Další"), and a
      // focused video uses Space for play/pause; answer keys still work on both.
      const onControl =
        e.target instanceof HTMLButtonElement ||
        e.target instanceof HTMLAnchorElement ||
        e.target instanceof HTMLVideoElement
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      const choice = KEY_TO_CHOICE[key]
      if (!answered && choice && options.includes(choice)) {
        e.preventDefault()
        onAnswer(choice)
      } else if (answered && !onControl && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answered, onAnswer, onNext, options])

  return (
    <article className="mx-auto w-full max-w-2xl">
      <header className="mb-4 flex items-center justify-between text-sm text-sand-400">
        <span className="font-mono font-medium tabular-nums text-sand-300">
          {String(index + 1).padStart(2, '0')}
          <span className="text-sand-600"> / {total}</span>
        </span>
        <span className="border border-sand-700 px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-sand-400">
          {question.cat}
        </span>
        <button
          type="button"
          onClick={onToggleBookmark}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? 'Odebrat ze záložek' : 'Přidat do záložek'}
          className={`px-2 py-1 font-mono text-xs uppercase tracking-wide transition-colors ${
            bookmarked ? 'text-terra-400' : 'text-sand-500 hover:text-terra-400'
          }`}
        >
          {bookmarked ? '★' : '☆'} Záložka
        </button>
      </header>

      {(question.image || question.video) && (
        /* min-h-64 = image cap (max-h-56) + p-4 padding — the box height is
           reserved up front so the arriving media never shifts the layout. */
        <div className="mb-5 flex min-h-64 items-center justify-center rounded-card border border-sand-700 bg-white p-4">
          {showVideo ? (
            <video
              key={question.id}
              data-testid="question-video"
              aria-label={`Animace k otázce ${question.id}`}
              controls
              playsInline
              preload="metadata"
              poster={question.image ? imageUrl(question.image) : undefined}
              onError={() => markFailed(imageUrl(question.video!))}
              className="max-h-56 w-auto"
            >
              <source
                src={imageUrl(question.video!)}
                type="video/mp4"
                onError={() => markFailed(imageUrl(question.video!))}
              />
            </video>
          ) : !question.image ? null : failed.has(imageUrl(question.image)) ? (
            <ImageFailed />
          ) : (
            <img
              src={imageUrl(question.image)}
              alt={`Obrázek k otázce ${question.id}`}
              className="max-h-56 w-auto object-contain"
              onError={() => markFailed(imageUrl(question.image!))}
            />
          )}
        </div>
      )}
      {question.video && (
        <p className="-mt-3 mb-4 font-mono text-xs text-sand-500">
          {showVideo
            ? 'Spusťte animaci a pozorně sledujte situaci.'
            : 'Animace nedostupná, zobrazen náhled situace.'}
        </p>
      )}
      {answered && reveal && explanation?.sign && (
        /* Orbis Pictus: the picture with its number and name, once the learner has answered. */
        <p className="-mt-3 mb-4 flex items-baseline gap-2 text-sm">
          <span className="shrink-0 whitespace-nowrap font-mono text-xs text-terra-300">{explanation.sign.code}</span>
          <span className="text-sand-300">{explanation.sign.name}</span>
        </p>
      )}

      <h2 className="mb-5 text-balance text-xl font-semibold leading-relaxed text-sand-50">
        {question.q}
      </h2>

      <div role="group" aria-label="Možnosti odpovědi" className="flex flex-col gap-3">
        {options.map((opt) => {
          const state = optionState(opt, question, chosen, reveal)
          const optImg = question[`${opt}Img`]
          return (
            <button
              key={opt}
              type="button"
              data-state={state}
              disabled={answered}
              onClick={() => !answered && onAnswer(opt)}
              className={`flex items-start gap-3 rounded-card border px-4 py-3 text-left transition-colors disabled:cursor-default ${STATE_CLASS[state]}`}
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-sand-500/60 font-mono text-xs font-semibold uppercase">
                {opt}
              </span>
              <span className="min-w-0 flex-1 leading-relaxed">
                {optImg &&
                  (failed.has(imageUrl(optImg)) ? (
                    <ImageFailed />
                  ) : (
                    <img
                      src={imageUrl(optImg)}
                      alt={`Možnost ${opt.toUpperCase()}`}
                      className="max-h-24 w-auto rounded-[2px] bg-white p-1"
                      onError={() => markFailed(imageUrl(optImg))}
                    />
                  ))}
                {question[opt]}
                {reveal && state === 'correct' && (
                  <span className="ml-2 whitespace-nowrap text-xs font-semibold text-moss-400">
                    ✓ Správná odpověď
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {!answered && (
        <p className="mt-3 font-mono text-xs text-sand-600">
          {options.length === 3 ? 'Klávesy A · B · C nebo 1 · 2 · 3' : 'Klávesy A · B nebo 1 · 2'}
        </p>
      )}

      {answered && reveal && explanation && (
        /* Set like a statute book: the reasoning, then the law quoted with its paragraph. */
        <section aria-labelledby="proc" aria-live="polite" className="mt-5 border-l-2 border-sand-600 pl-4">
          <h3 id="proc" className="mb-1 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-sand-500">Proč</h3>
          <p className="leading-relaxed text-sand-200">{explanation.why}</p>
          {explanation.flag && (
            <p className="mt-2 text-sm leading-relaxed text-terra-300">
              Pozor, oficiální odpověď je starší než dnešní stav: {explanation.flag}
            </p>
          )}
          {explanation.sources.map((s) => (
            <figure key={s.anchor + s.quote} className="mt-3">
              <blockquote className="italic leading-relaxed text-sand-300">„{s.quote}“</blockquote>
              <figcaption className="mt-1">
                <a
                  href={sourceUrl(s)}
                  target="_blank"
                  rel="noopener"
                  onClick={() => onSourceOpen?.(s)}
                  className="inline-block min-h-11 py-3 font-mono text-xs text-terra-400 underline-offset-2 hover:underline"
                >
                  {sourceLabel(s)}
                  <span className="sr-only"> (otevře se v novém okně)</span>
                </a>
              </figcaption>
            </figure>
          ))}
        </section>
      )}

      {answered && (
        <footer
          className="sticky bottom-0 z-10 -mx-4 mt-5 flex items-center justify-between gap-3 border-t border-sand-700 bg-sand-950/95 px-4 py-3 backdrop-blur sm:rounded-card sm:border"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          {reveal ? (
            <p
              className={`min-w-0 text-sm font-medium ${
                isCorrect ? 'text-moss-400' : 'text-rust-400'
              }`}
            >
              {isCorrect
                ? 'Správně.'
                : 'Nesprávně. Otázka se vrátí na konci sady.'}
            </p>
          ) : (
            <span className="text-sm text-sand-400">Uloženo</span>
          )}
          <button
            type="button"
            onClick={onNext}
            className="glow-terra inline-flex shrink-0 items-center gap-2 rounded-card bg-terra-500 px-5 py-2.5 font-display font-semibold text-sand-950 transition-colors hover:bg-terra-400"
          >
            <span>{index + 1 === total ? (willCorrect ? 'Opravit chyby' : 'Dokončit') : 'Další'}</span>
            <kbd className="flex h-5 min-w-5 items-center justify-center rounded-[2px] border border-sand-950/30 px-1 font-mono text-xs leading-none">
              ↵
            </kbd>
          </button>
        </footer>
      )}
    </article>
  )
}
