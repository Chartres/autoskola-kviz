import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '@/app/AppContext'
import { currentChoice, currentQuestion, score } from '@/domain/session'
import { isBookmarked } from '@/domain/progress'
import { imageUrl } from '@/lib/assets'
import { QuestionCard } from '@/components/QuestionCard'
import { ExamTimer } from '@/components/ExamTimer'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { todayStr } from '@/lib/date'
import { loadExplanations, type Explanations } from '@/domain/explanations'
import { track, conversion } from '@/analytics'
import { setPosition } from '@/app/store'

const MODE_LABEL: Record<string, string> = {
  lesson: 'Denní dávka',
  practice: 'Procvičování',
  review: 'Moje chyby',
  bookmarks: 'Záložky',
  exam: 'Zkušební test',
}

export function QuizScreen() {
  const { state, dispatch } = useApp()
  const { session, mode } = state
  const onExpire = useCallback(() => dispatch({ type: 'finishExam' }), [dispatch])
  // Explanations load as their own chunk; practice works without them meanwhile.
  const [explanations, setExplanations] = useState<Explanations | null>(null)
  useEffect(() => {
    if (mode && mode !== 'exam') loadExplanations().then(setExplanations, () => {})
  }, [mode])

  // Warm the cache for the next question's image so it shows without a flash.
  const nextImage = session ? session.questions[session.index + 1]?.image : null
  useEffect(() => {
    if (nextImage) new Image().src = imageUrl(nextImage)
  }, [nextImage])

  // A finished first round is a finished set (the North Star), even if the learner then leaves
  // the correction round; ResultsScreen doesn't count it again.
  const counted = useRef<unknown>(null)
  const first = state.correction?.first
  useEffect(() => {
    if (!first || counted.current === first) return
    counted.current = first
    conversion({ mode, score: score(first), total: first.questions.length, corrections: state.correction!.missed })
  }, [first]) // eslint-disable-line react-hooks/exhaustive-deps

  // Each question opens at the top (explanations make cards long on a phone).
  const questionId = session ? currentQuestion(session)?.id : undefined
  useEffect(() => {
    document.scrollingElement?.scrollTo?.(0, 0)
  }, [questionId])

  if (!session || !mode) return null
  const question = currentQuestion(session)
  const isExam = mode === 'exam'

  if (!question) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sand-300">
        <p className="mb-4">Žádné otázky k zobrazení.</p>
        <button
          type="button"
          className="text-terra-400 hover:underline"
          onClick={() => dispatch({ type: 'goMenu' })}
        >
          ← Zpět na rozcestník
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <header className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => dispatch({ type: 'goMenu' })}
          className="text-sm text-sand-400 hover:text-terra-400"
        >
          ← Konec
        </button>
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.15em] text-sand-500">
          {state.correction ? `Oprava chyb · ${MODE_LABEL[mode]}` : MODE_LABEL[mode]}
        </span>
        {isExam && state.examEndsAt != null ? (
          <ExamTimer endsAt={state.examEndsAt} onExpire={onExpire} />
        ) : (
          <span className="w-12" />
        )}
      </header>

      <div className="mb-6">
        <ProgressBar value={Object.keys(session.chosen).length} max={session.questions.length} />
        {state.practiceSet && (() => {
          const p = setPosition(state.practiceSet)
          return (
            <p className="mt-2 font-mono text-xs text-sand-500 tabular-nums">
              {state.practiceSet.label} · sada {p.set} z {p.sets} · otázky {p.from}–{p.to} z {state.practiceSet.queue.length}
            </p>
          )
        })()}
      </div>

      <QuestionCard
        key={question.id}
        question={question}
        reveal={!isExam}
        chosen={currentChoice(session)}
        bookmarked={isBookmarked(state.progress, question.id)}
        index={session.index}
        total={session.questions.length}
        onAnswer={(choice) => dispatch({ type: 'answer', choice, now: Date.now() })}
        onNext={() => dispatch({ type: 'next', today: todayStr() })}
        onToggleBookmark={() =>
          dispatch({ type: 'toggleBookmark', id: question.id })
        }
        explanation={explanations?.[question.id]}
        willCorrect={!isExam && session.questions.some((q) => session.chosen[q.id] !== undefined && session.chosen[q.id] !== q.correct)}
        onSourceOpen={(s) =>
          track('key_action', { action: 'source_opened', question: question.id, law: s.law, ref: s.ref })
        }
      />
    </div>
  )
}
