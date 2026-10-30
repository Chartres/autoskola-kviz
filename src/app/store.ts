import type { CategoryName, Choice } from '@/domain/types'
import type { Rng } from '@/domain/rng'
import { emptyJizdyState, logLesson as jizdyLogLesson, type JizdyState, type LessonRecord } from '@/domain/jizdy'
import {
  createSession,
  answerCurrent,
  advance,
  isFinished,
  type SessionState,
} from '@/domain/session'
import {
  buildPractice,
  missedQuestions,
  bookmarkedQuestions,
} from '@/domain/selection'
import { buildExam, evaluateExam, EXAM, type ExamResult } from '@/domain/exam'
import {
  statFor,
  emptyProgress,
  recordAnswer,
  recordLessonComplete,
  toggleBookmark,
  type ProgressData,
} from '@/domain/progress'
import { buildLesson } from '@/domain/lesson'
import type { Question } from '@/domain/types'
import { getQuestion } from '@/domain/questions'
import type { SavedExam } from '@/domain/storage'
import { shuffle } from '@/domain/rng'

// Bottom-tab destinations (persistent nav) + focused full-screen flows.
export type TabView = 'home' | 'practice' | 'stats' | 'guide' | 'jizdy'
export type View = TabView | 'quiz' | 'exam' | 'results'
export type Mode = 'practice' | 'review' | 'bookmarks' | 'exam' | 'lesson'

export const TAB_VIEWS: TabView[] = ['home', 'practice', 'stats', 'guide', 'jizdy']
export function isTabView(v: View): v is TabView {
  return (TAB_VIEWS as string[]).includes(v)
}

export interface AppState {
  view: View
  mode: Mode | null
  session: SessionState | null
  examResult: ExamResult | null
  examEndsAt: number | null
  /** Second attempts at a set's missed questions (control of error). `first` keeps the
   * first-attempt round, which the results score; `missed` is how many it had. */
  correction: { first: SessionState; missed: number; today?: string } | null
  /** Okruh practice runs in sets of SET_SIZE: the whole ordered queue and where this set starts. */
  practiceSet: PracticeSet | null
  progress: ProgressData
  selectedCategories: Set<CategoryName>
  search: string
  jizdyState: JizdyState
}

/** Questions per practice set: finishable in one sitting, with a results screen after each. */
export const SET_SIZE = 20

export interface PracticeSet {
  queue: Question[]
  /** Index in `queue` of this set's first question. */
  offset: number
  /** What is being practised: one okruh's name, or a description of the selection. */
  label: string
}

/** Questions left in the queue after the current set (0: this is the last set). */
export function remainingAfter(ps: PracticeSet): number {
  return Math.max(0, ps.queue.length - (ps.offset + SET_SIZE))
}

/** 1-based number of the current set and how many sets the queue has. */
export function setPosition(ps: PracticeSet): { set: number; sets: number; from: number; to: number } {
  return {
    set: Math.floor(ps.offset / SET_SIZE) + 1,
    sets: Math.ceil(ps.queue.length / SET_SIZE),
    from: ps.offset + 1,
    to: Math.min(ps.offset + SET_SIZE, ps.queue.length),
  }
}

export function initialState(): AppState {
  return {
    view: 'home',
    mode: null,
    session: null,
    examResult: null,
    examEndsAt: null,
    correction: null,
    practiceSet: null,
    progress: emptyProgress(),
    selectedCategories: new Set(),
    search: '',
    jizdyState: emptyJizdyState(),
  }
}

/** An exam whose time ran out longer ago than this is dropped on load instead of shown. */
export const STALE_EXAM_MS = 60 * 60 * 1000

/**
 * Put a saved exam back on screen at app load: still running → the same question and
 * deadline; time ran out while away → its results; abandoned long ago → nothing.
 */
export function resumeExam(state: AppState, saved: SavedExam | null, now: number): AppState {
  if (!saved) return state
  const found = saved.ids.map(getQuestion)
  if (!found.length || found.some((q) => !q)) return state
  const questions = found as NonNullable<(typeof found)[number]>[]
  // Damaged storage, or a deadline beyond one exam length (clock moved back): start clean.
  if (saved.endsAt > now + EXAM.timeLimitMinutes * 60 * 1000) return state
  const byId = new Map(questions.map((q) => [q.id, q]))
  const valid = saved.records.every(
    (r) => !!r && typeof r === 'object' && byId.has(r.id) && ['a', 'b', 'c'].includes(r.choice),
  )
  if (!valid) return state
  // Score against today's answer key, in case a deploy corrected one meanwhile.
  const records = saved.records.map((r) => ({ ...r, correct: r.choice === byId.get(r.id)!.correct }))
  const session: SessionState = {
    questions,
    index: Math.max(0, Math.min(Number(saved.index) || 0, questions.length)),
    records,
    chosen: Object.fromEntries(records.map((r) => [r.id, r.choice])),
  }
  if (now < saved.endsAt && !isFinished(session)) {
    return { ...begin(state, 'exam', session), examEndsAt: saved.endsAt }
  }
  if (now - saved.endsAt > STALE_EXAM_MS) return state
  return {
    ...begin(state, 'exam', session),
    view: 'results',
    examResult: evaluateExam(session),
    examEndsAt: null,
  }
}

export type Action =
  | { type: 'hydrate'; progress: ProgressData }
  | { type: 'setCategories'; categories: Set<CategoryName> }
  | { type: 'setSearch'; search: string }
  | { type: 'startLesson'; rng: Rng }
  | { type: 'startPractice'; rng: Rng; /** open on this question (question pages) */ firstId?: number }
  | { type: 'nextSet' }
  | { type: 'startReview' }
  | { type: 'startBookmarks'; rng: Rng }
  | { type: 'startExam'; rng: Rng; now: number }
  | { type: 'answer'; choice: Choice; now: number }
  | { type: 'next'; today?: string }
  | { type: 'finishExam' }
  | { type: 'toggleBookmark'; id: number }
  | { type: 'goMenu' }
  | { type: 'navigate'; view: TabView }
  | { type: 'logLesson'; record: LessonRecord }
  | { type: 'hydrateJizdy'; state: JizdyState }

function begin(state: AppState, mode: Mode, questions: SessionState): AppState {
  return {
    ...state,
    mode,
    session: questions,
    examResult: null,
    correction: null,
    practiceSet: null,
    view: mode === 'exam' ? 'exam' : 'quiz',
  }
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      return { ...state, progress: action.progress }

    case 'setCategories':
      return { ...state, selectedCategories: action.categories }

    case 'setSearch':
      return { ...state, search: action.search }

    case 'startLesson':
      return begin(
        state,
        'lesson',
        createSession(buildLesson(state.progress, action.rng)),
      )

    case 'startPractice': {
      let qs = buildPractice(
        { categories: state.selectedCategories, search: state.search },
        action.rng,
      )
      // Questions not yet answered come first, so "next 20" moves through the okruh.
      const unseen: Question[] = []
      const seen: Question[] = []
      for (const q of qs) (statFor(state.progress, q.id).seen === 0 ? unseen : seen).push(q)
      qs = [...unseen, ...seen]
      const first = qs.find((q) => q.id === action.firstId)
      if (first) qs = [first, ...qs.filter((q) => q !== first)]
      const cats = [...state.selectedCategories]
      const label = state.search.trim()
        ? 'Výběr podle hledání'
        : cats.length === 1 ? cats[0] : cats.length ? 'Vybrané okruhy' : 'Všechny okruhy'
      return {
        ...begin(state, 'practice', createSession(qs.slice(0, SET_SIZE))),
        practiceSet: { queue: qs, offset: 0, label },
      }
    }

    case 'nextSet': {
      const ps = state.practiceSet
      if (!ps || !remainingAfter(ps)) return state
      const offset = ps.offset + SET_SIZE
      return {
        ...begin(state, 'practice', createSession(ps.queue.slice(offset, offset + SET_SIZE))),
        practiceSet: { ...ps, offset },
      }
    }

    case 'startReview':
      return begin(
        state,
        'review',
        createSession(missedQuestions(state.progress)),
      )

    case 'startBookmarks':
      return begin(
        state,
        'bookmarks',
        createSession(shuffle(bookmarkedQuestions(state.progress), action.rng)),
      )

    case 'startExam':
      return {
        ...begin(state, 'exam', createSession(buildExam(action.rng))),
        examEndsAt: action.now + EXAM.timeLimitMinutes * 60 * 1000,
      }

    case 'answer': {
      if (!state.session) return state
      const session = answerCurrent(state.session, action.choice)
      if (session === state.session) return state // nothing to answer, or already answered
      const { id, correct } = session.records[session.records.length - 1]
      return {
        ...state,
        session,
        // A second attempt right after the explanation is practice, not evidence of mastery.
        progress: state.correction ? state.progress : recordAnswer(state.progress, id, correct, action.now),
      }
    }

    case 'next': {
      if (!state.session) return state
      const session = advance(state.session)
      if (isFinished(session)) {
        // Control of error: outside the exam, a set isn't over while one of its answers is wrong.
        const missed = session.questions.filter((q) => session.chosen[q.id] !== q.correct)
        if (state.mode !== 'exam' && missed.length) {
          return {
            ...state,
            session: createSession(missed),
            correction: {
              first: state.correction?.first ?? session,
              missed: state.correction?.missed ?? missed.length,
              // The day the set was played, for the lesson streak, even if corrections run late.
              today: state.correction?.today ?? action.today,
            },
          }
        }
        return {
          ...state,
          session: state.correction?.first ?? session,
          view: 'results',
          examResult: state.mode === 'exam' ? evaluateExam(session) : null,
          // L1: also clear examEndsAt when the exam ends via question-by-question
          // navigation (finishExam and goMenu already clear it; this path did not).
          examEndsAt: null,
          progress:
            state.mode === 'lesson' && (state.correction?.today ?? action.today)
              ? recordLessonComplete(state.progress, (state.correction?.today ?? action.today)!)
              : state.progress,
        }
      }
      return { ...state, session }
    }

    case 'finishExam': {
      if (!state.session) return state
      return {
        ...state,
        view: 'results',
        examResult: evaluateExam(state.session),
        examEndsAt: null,
      }
    }

    case 'toggleBookmark':
      return { ...state, progress: toggleBookmark(state.progress, action.id) }

    case 'goMenu':
      return {
        ...state,
        correction: null,
        practiceSet: null,
        view: 'home',
        mode: null,
        session: null,
        examResult: null,
        examEndsAt: null,
      }

    case 'navigate':
      return { ...state, view: action.view }

    case 'hydrateJizdy':
      return { ...state, jizdyState: action.state }

    case 'logLesson':
      return { ...state, jizdyState: jizdyLogLesson(state.jizdyState, action.record) }

    default:
      return state
  }
}
