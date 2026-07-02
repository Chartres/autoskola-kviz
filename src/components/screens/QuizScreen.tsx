import { useCallback, useEffect } from 'react'
import { useApp } from '@/app/AppContext'
import { currentQuestion } from '@/domain/session'
import { isBookmarked } from '@/domain/progress'
import { imageUrl } from '@/lib/assets'
import { QuestionCard } from '@/components/QuestionCard'
import { ExamTimer } from '@/components/ExamTimer'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { todayStr } from '@/lib/date'
import type { Choice } from '@/domain/types'

const MODE_LABEL: Record<string, string> = {
  lesson: 'Dnešní lekce',
  practice: 'Procvičování',
  review: 'Moje chyby',
  bookmarks: 'Záložky',
  exam: 'Zkušební test',
}

export function QuizScreen() {
  const { state, dispatch } = useApp()
  const { session, mode } = state
  const onExpire = useCallback(() => dispatch({ type: 'finishExam' }), [dispatch])

  // Warm the cache for the next question's image so it shows without a flash.
  const nextImage = session ? session.questions[session.index + 1]?.image : null
  useEffect(() => {
    if (nextImage) new Image().src = imageUrl(nextImage)
  }, [nextImage])

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
        <span className="text-xs uppercase tracking-wide text-sand-500">
          {MODE_LABEL[mode]}
        </span>
        {isExam && state.examEndsAt != null ? (
          <ExamTimer endsAt={state.examEndsAt} onExpire={onExpire} />
        ) : (
          <span className="w-12" />
        )}
      </header>

      <div className="mb-6">
        <ProgressBar value={session.index} max={session.questions.length} />
      </div>

      <QuestionCard
        key={question.id}
        question={question}
        reveal={!isExam}
        chosen={session.chosen[question.id] as Choice | undefined}
        bookmarked={isBookmarked(state.progress, question.id)}
        index={session.index}
        total={session.questions.length}
        onAnswer={(choice) => dispatch({ type: 'answer', choice, now: Date.now() })}
        onNext={() => dispatch({ type: 'next', today: todayStr() })}
        onToggleBookmark={() =>
          dispatch({ type: 'toggleBookmark', id: question.id })
        }
      />
    </div>
  )
}
