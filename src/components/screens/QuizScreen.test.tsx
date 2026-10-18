/**
 * F10: Integration test — timer expiry triggers finishExam dispatch in QuizScreen.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { QuizScreen } from './QuizScreen'
import { createSession } from '@/domain/session'
import { emptyProgress } from '@/domain/progress'
import type { AppState } from '@/app/store'
import type { Question } from '@/domain/types'

vi.mock('@/auth/supabase', () => ({ supabase: null, isAuthConfigured: false }))

const mockDispatch = vi.fn()

const STUB_QUESTION: Question = {
  id: 1,
  cat: 'Pravidla provozu',
  q: 'Test question',
  a: 'A',
  b: 'B',
  c: 'C',
  correct: 'a',
  image: null,
  points: 2,
  sourceId: 1,
}

function examState(examEndsAt: number): AppState {
  return {
    view: 'exam',
    mode: 'exam',
    session: createSession([STUB_QUESTION]),
    examResult: null,
    examEndsAt,
    progress: emptyProgress(),
    selectedCategories: new Set(),
    search: '',
    jizdyState: { version: 1, lessons: [] },
  }
}

vi.mock('@/app/AppContext', () => ({
  useApp: () => ({ state: mockState, dispatch: mockDispatch }),
}))

let mockState: AppState

beforeEach(() => {
  vi.useFakeTimers()
  mockDispatch.mockClear()
  mockState = examState(Date.now() + 10_000)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('QuizScreen exam timer expiry', () => {
  it('dispatches finishExam when ExamTimer fires onExpire', () => {
    render(<QuizScreen />)

    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'finishExam' })

    act(() => {
      vi.advanceTimersByTime(12_000) // past the 10s examEndsAt
    })

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'finishExam' })
  })
})
