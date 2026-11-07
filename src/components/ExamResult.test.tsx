/** Test A (2026-11-07): exam date on the device, then once "Jak dopadla zkouška?" */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { AuthProvider } from '@/auth/AuthContext'
import { AppProvider } from '@/app/AppContext'
import { HomeScreen } from '@/components/screens/HomeScreen'
import { EXAM_PLAN_KEY } from '@/domain/examPlan'
import { todayStr } from '@/lib/date'
import { STORAGE_KEY } from '@/domain/storage'
import { emptyProgress, recordAnswer } from '@/domain/progress'
import { ALL_QUESTIONS } from '@/domain/questions'

const { track } = vi.hoisted(() => ({ track: vi.fn() }))
vi.mock('@/analytics', async (importActual) => ({
  ...(await importActual<typeof import('@/analytics')>()),
  track,
  conversion: vi.fn(),
  identify: vi.fn(),
}))

const day = (offset: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return todayStr(d)
}
const home = () =>
  render(
    <AuthProvider>
      <AppProvider>
        <HomeScreen />
      </AppProvider>
    </AuthProvider>,
  )
const resultEvents = () => track.mock.calls.filter(([name]) => name === 'exam_result_reported')
// Before allow-list v4 the answer rode on key_action; it must not be sent that way any more.
const legacyEvents = () => track.mock.calls.filter(([, p]) => (p as { action?: string })?.action === 'exam_result_reported')

beforeEach(() => {
  localStorage.clear()
  track.mockClear()
})

describe('exam date and result question on Home', () => {
  it('the date entered is kept on the device; before and on the exam day nothing is asked', () => {
    home()
    expect(screen.queryByText('Jak dopadla zkouška?')).toBeNull()
    fireEvent.change(screen.getByLabelText('Termín zkoušky'), { target: { value: day(0) } })
    expect(JSON.parse(localStorage.getItem(EXAM_PLAN_KEY)!).date).toBe(day(0))
    cleanup()
    home()
    expect((screen.getByLabelText('Termín zkoušky') as HTMLInputElement).value).toBe(day(0))
    expect(screen.queryByText('Jak dopadla zkouška?')).toBeNull()
  })

  it('after the date: asks once, sends one event with the answer and the readiness bucket, then never again', () => {
    localStorage.setItem(EXAM_PLAN_KEY, JSON.stringify({ date: day(-1), reportedFor: null }))
    home()
    expect(screen.getByRole('heading', { name: 'Jak dopadla zkouška?' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Složil(a)' }))
    expect(resultEvents()).toEqual([
      ['exam_result_reported', { result: 'passed', readiness_bucket: 'none' }],
    ])
    expect(screen.getByRole('status').textContent).toBe('Díky za odpověď.')
    expect(screen.queryByRole('button', { name: 'Nesložil(a)' })).toBeNull()
    cleanup()
    home()
    expect(screen.queryByText('Jak dopadla zkouška?')).toBeNull()
    expect(resultEvents()).toHaveLength(1)
  })

  it('"Ještě ne" also ends the question for that date; a new later date asks again after it', () => {
    localStorage.setItem(EXAM_PLAN_KEY, JSON.stringify({ date: day(-3), reportedFor: null }))
    home()
    fireEvent.click(screen.getByRole('button', { name: 'Ještě ne' }))
    expect(resultEvents()[0][1]).toMatchObject({ result: 'not_yet' })
    fireEvent.change(screen.getByLabelText('Termín zkoušky'), { target: { value: day(-1) } })
    cleanup()
    home()
    fireEvent.click(screen.getByRole('button', { name: 'Nesložil(a)' }))
    expect(resultEvents().map(([, p]) => (p as { result: string }).result)).toEqual(['not_yet', 'failed'])
  })

  it('the event carries no date, free text or other data', () => {
    localStorage.setItem(EXAM_PLAN_KEY, JSON.stringify({ date: day(-1), reportedFor: null }))
    home()
    fireEvent.click(screen.getByRole('button', { name: 'Nesložil(a)' }))
    expect(Object.keys(resultEvents()[0][1] as object).sort()).toEqual(['readiness_bucket', 'result'])
    expect(legacyEvents()).toEqual([])
  })

  it('a retake date entered before answering: the answer belongs to the first date, the retake is asked after it', () => {
    localStorage.setItem(EXAM_PLAN_KEY, JSON.stringify({ date: day(-1), reportedFor: null }))
    home()
    fireEvent.change(screen.getByLabelText('Termín zkoušky'), { target: { value: day(14) } })
    fireEvent.click(screen.getByRole('button', { name: 'Nesložil(a)' }))
    expect(JSON.parse(localStorage.getItem(EXAM_PLAN_KEY)!)).toEqual({ date: day(14), reportedFor: day(-1) })
    // On a visit after the retake date it asks again.
    localStorage.setItem(EXAM_PLAN_KEY, JSON.stringify({ date: day(-2), reportedFor: day(-1) }))
    cleanup()
    home()
    expect(screen.getByRole('heading', { name: 'Jak dopadla zkouška?' })).toBeTruthy()
  })

  it('sends the learner\'s real readiness bucket', () => {
    // 10 answers in every okruh, 9 right: 45 expected → bucket 43_45.
    let p = emptyProgress()
    const seen = new Map<string, number>()
    for (const q of ALL_QUESTIONS) {
      const n = seen.get(q.cat) ?? 0
      if (n >= 10) continue
      seen.set(q.cat, n + 1)
      p = recordAnswer(p, q.id, n < 9, 1000 + n)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    localStorage.setItem(EXAM_PLAN_KEY, JSON.stringify({ date: day(-1), reportedFor: null }))
    home()
    fireEvent.click(screen.getByRole('button', { name: 'Složil(a)' }))
    expect(resultEvents()[0][1]).toEqual({ result: 'passed', readiness_bucket: '43_45' })
  })

  it('the date field is named "Termín zkoušky" and described by the on-device note', () => {
    home()
    const field = screen.getByLabelText('Termín zkoušky')
    expect(document.getElementById(field.getAttribute('aria-describedby')!)!.textContent).toBe('Zůstane jen v tomto zařízení.')
  })
})
