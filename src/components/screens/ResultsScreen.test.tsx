/**
 * F8: Tests for conversion activation KPI and event tracking in ResultsScreen.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { ResultsScreen } from './ResultsScreen'
import { createSession, answerCurrent } from '@/domain/session'
import { emptyProgress } from '@/domain/progress'
import type { AppState } from '@/app/store'
import type { Question } from '@/domain/types'

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockTrack = vi.fn()
const mockConversion = vi.fn()

vi.mock('@/analytics', () => ({
  track: (...args: unknown[]) => mockTrack(...args),
  conversion: (...args: unknown[]) => mockConversion(...args),
  identify: vi.fn(),
  feedback: vi.fn(),
  logError: vi.fn(),
}))

vi.mock('@/auth/supabase', () => ({ supabase: null, isAuthConfigured: false }))

const mockDispatch = vi.fn()

vi.mock('@/app/AppContext', () => ({
  useApp: () => ({ state: mockState, dispatch: mockDispatch }),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

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

let mockState: AppState

function makeState(overrides: Partial<AppState>): AppState {
  return {
    view: 'results',
    mode: null,
    session: null,
    examResult: null,
    examEndsAt: null,
    progress: emptyProgress(),
    selectedCategories: new Set(),
    search: '',
    jizdyState: { version: 1, lessons: [] },
    ...overrides,
  }
}

beforeEach(() => {
  mockTrack.mockClear()
  mockConversion.mockClear()
  mockDispatch.mockClear()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ResultsScreen tracking', () => {
  it('fires lesson_complete and conversion on lesson finish', () => {
    const session = answerCurrent(createSession([STUB_QUESTION]), 'a')
    mockState = makeState({ mode: 'lesson', session })

    render(<ResultsScreen />)

    expect(mockTrack).toHaveBeenCalledWith(
      'lesson_complete',
      expect.objectContaining({ mode: 'lesson' }),
    )
    expect(mockConversion).toHaveBeenCalledOnce()
  })

  it('fires exam_finish and not conversion on exam finish', () => {
    const session = answerCurrent(createSession([STUB_QUESTION]), 'a')
    const examResult = {
      score: 2,
      total: 2,
      passed: true,
      passThreshold: 1,
      byCategory: {},
    }
    mockState = makeState({ mode: 'exam', session, examResult })

    render(<ResultsScreen />)

    expect(mockTrack).toHaveBeenCalledWith(
      'exam_finish',
      expect.objectContaining({ mode: 'exam' }),
    )
    expect(mockConversion).not.toHaveBeenCalled()
  })

  it('fires session_finish for practice mode', () => {
    const session = answerCurrent(createSession([STUB_QUESTION]), 'a')
    mockState = makeState({ mode: 'practice', session })

    render(<ResultsScreen />)

    expect(mockTrack).toHaveBeenCalledWith(
      'session_finish',
      expect.objectContaining({ mode: 'practice' }),
    )
    expect(mockConversion).not.toHaveBeenCalled()
  })
})
