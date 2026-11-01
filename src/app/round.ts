import type { Choice, CategoryName, Question } from '@/domain/types'
import { getQuestion } from '@/domain/questions'
import type { SessionState } from '@/domain/session'
import type { AppState, PracticeSet } from './store'

/**
 * An unfinished practice or daily set, kept so the learner can come back to it ("Pokračovat").
 * Answers already count in progress the moment they are given; this only keeps the set itself:
 * which questions, which were answered how, and where the okruh queue stands. Per device
 * (localStorage), never synced. Only ids are stored; questions come from the bundled dataset.
 */
export interface SavedRound {
  mode: 'lesson' | 'practice'
  ids: number[]
  records: { id: number; choice: Choice }[]
  /** Set while in the correction round (Kontrola chyby): the first round, already finished. */
  correction?: { firstIds: number[]; firstRecords: { id: number; choice: Choice }[]; missed: number; today?: string }
  /** Okruh practice: the whole queue, where this set starts, and the selection that built it. */
  practiceSet?: { queue: number[]; offset: number; label: string; categories: CategoryName[]; search: string }
}

const plain = (s: SessionState) => s.records.map(({ id, choice }) => ({ id, choice }))

/** The current set, if it is one that waits when left unfinished (okruh set or daily set). */
export function snapshotRound(state: AppState): SavedRound | null {
  const { session, mode } = state
  if (!session || (mode !== 'lesson' && mode !== 'practice')) return null
  if (state.view !== 'quiz') return null
  // Nothing answered yet: nothing to come back to.
  if (!session.records.length && !state.correction) return null
  const ps = state.practiceSet
  return {
    mode,
    ids: session.questions.map((q) => q.id),
    records: plain(session),
    ...(state.correction && {
      correction: {
        firstIds: state.correction.first.questions.map((q) => q.id),
        firstRecords: plain(state.correction.first),
        missed: state.correction.missed,
        today: state.correction.today,
      },
    }),
    ...(mode === 'practice' && ps && {
      practiceSet: {
        queue: ps.queue.map((q) => q.id),
        offset: ps.offset,
        label: ps.label,
        categories: [...state.selectedCategories],
        search: state.search,
      },
    }),
  }
}

function questionsFor(ids: unknown): Question[] | null {
  if (!Array.isArray(ids) || !ids.length) return null
  const qs = ids.map((id) => getQuestion(Number(id)))
  return qs.every((q) => q) ? (qs as Question[]) : null
}

/** Rebuild a session; scored against today's answer key, in case a deploy corrected one. */
function sessionFor(questions: Question[], records: unknown): SessionState | null {
  if (!Array.isArray(records)) return null
  const byId = new Map(questions.map((q) => [q.id, q]))
  const seen = new Set<number>()
  for (const r of records) {
    if (!r || typeof r !== 'object' || !byId.has(r.id) || seen.has(r.id) || !['a', 'b', 'c'].includes(r.choice)) return null
    seen.add(r.id)
  }
  const recs = (records as { id: number; choice: Choice }[]).map(({ id, choice }) => ({
    id,
    choice,
    correct: choice === byId.get(id)!.correct,
  }))
  const chosen = Object.fromEntries(recs.map((r) => [r.id, r.choice])) as Record<number, Choice>
  // Resume at the first unanswered question; all answered (left before "Dokončit"): the last one.
  const first = questions.findIndex((q) => chosen[q.id] === undefined)
  return { questions, records: recs, chosen, index: first === -1 ? questions.length - 1 : first }
}

/** Put a saved round back on screen exactly as it was left; null if it no longer fits the bank. */
export function restoreRound(state: AppState, saved: SavedRound): AppState | null {
  if (!saved || typeof saved !== 'object') return null
  if (saved.mode !== 'lesson' && saved.mode !== 'practice') return null
  const questions = questionsFor(saved.ids)
  const session = questions && sessionFor(questions, saved.records)
  if (!session) return null

  let correction: AppState['correction'] = null
  if (saved.correction) {
    if (typeof saved.correction !== 'object' || typeof saved.correction.missed !== 'number') return null
    const fq = questionsFor(saved.correction.firstIds)
    const first = fq && sessionFor(fq, saved.correction.firstRecords)
    if (!first) return null
    // The first round is over; its conversion was counted when it ended.
    correction = { first: { ...first, index: fq!.length }, missed: saved.correction.missed, today: saved.correction.today, counted: true }
  }

  let practiceSet: PracticeSet | null = null
  let { selectedCategories, search } = state
  if (saved.mode === 'practice') {
    const sp = saved.practiceSet
    const queue = sp && questionsFor(sp.queue)
    if (
      !sp || !queue || typeof sp.label !== 'string' || typeof sp.search !== 'string' ||
      !Array.isArray(sp.categories) || !sp.categories.every((c) => typeof c === 'string')
    ) return null
    practiceSet = { queue, offset: Number(sp.offset) || 0, label: sp.label }
    selectedCategories = new Set(sp.categories)
    search = sp.search
  }

  return {
    ...state,
    view: 'quiz',
    mode: saved.mode,
    session,
    examResult: null,
    examEndsAt: null,
    correction,
    practiceSet,
    selectedCategories,
    search,
    pendingRound: null,
  }
}

/** For the resume prompt: what the set is and how far it got. */
export function roundSummary(saved: SavedRound): { title: string; answered: number; total: number; correcting: boolean } {
  const title = saved.mode === 'lesson' ? 'Denní dávka' : (saved.practiceSet?.label ?? 'Procvičování')
  return { title, answered: saved.records.length, total: saved.ids.length, correcting: !!saved.correction }
}

/** A saved round read from storage, kept only if it can still be put back on screen. */
export function validRound(state: AppState, raw: SavedRound | null): SavedRound | null {
  try {
    return raw && restoreRound(state, raw) ? raw : null
  } catch {
    return null
  }
}
