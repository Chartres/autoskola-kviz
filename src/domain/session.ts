import type { Choice, Question } from './types'

export interface AnswerRecord {
  id: number
  choice: Choice
  correct: boolean
}

export interface SessionState {
  questions: Question[]
  index: number
  /** Answer per question id, in the order they were answered. */
  records: AnswerRecord[]
  /** Fast lookup: question id -> chosen option. */
  chosen: Record<number, Choice>
}

export function createSession(questions: Question[]): SessionState {
  return { questions, index: 0, records: [], chosen: {} }
}

export function currentQuestion(s: SessionState): Question | undefined {
  return s.questions[s.index]
}

export function isFinished(s: SessionState): boolean {
  return s.index >= s.questions.length
}

export function currentChoice(s: SessionState): Choice | undefined {
  const cur = currentQuestion(s)
  return cur ? s.chosen[cur.id] : undefined
}

export function isCurrentAnswered(s: SessionState): boolean {
  return currentChoice(s) !== undefined
}

/** Record the answer for the current question. No-op if already answered. */
export function answerCurrent(s: SessionState, choice: Choice): SessionState {
  const cur = currentQuestion(s)
  if (!cur || s.chosen[cur.id] !== undefined) return s
  const correct = choice === cur.correct
  return {
    ...s,
    records: [...s.records, { id: cur.id, choice, correct }],
    chosen: { ...s.chosen, [cur.id]: choice },
  }
}

export function advance(s: SessionState): SessionState {
  if (isFinished(s)) return s
  return { ...s, index: s.index + 1 }
}

export function score(s: SessionState): number {
  return s.records.reduce((n, r) => n + (r.correct ? 1 : 0), 0)
}

export function wrongAnswers(s: SessionState): AnswerRecord[] {
  return s.records.filter((r) => !r.correct)
}

export function progressRatio(s: SessionState): number {
  if (s.questions.length === 0) return 0
  return s.records.length / s.questions.length
}
