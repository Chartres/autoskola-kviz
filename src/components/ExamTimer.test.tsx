/**
 * M11: Test that ExamTimer dispatches onExpire when the countdown reaches zero.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { ExamTimer } from './ExamTimer'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ExamTimer', () => {
  it('calls onExpire when the timer reaches zero', () => {
    const onExpire = vi.fn()
    const endsAt = Date.now() + 5000 // 5 seconds from now

    render(<ExamTimer endsAt={endsAt} onExpire={onExpire} />)

    expect(onExpire).not.toHaveBeenCalled()

    // Advance time past endsAt so remaining <= 0.
    act(() => {
      vi.advanceTimersByTime(6000)
    })

    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('does not call onExpire before the time is up', () => {
    const onExpire = vi.fn()
    const endsAt = Date.now() + 10_000

    render(<ExamTimer endsAt={endsAt} onExpire={onExpire} />)

    act(() => {
      vi.advanceTimersByTime(5000) // half the time
    })

    expect(onExpire).not.toHaveBeenCalled()
  })

  it('calls onExpire immediately when endsAt is in the past', () => {
    const onExpire = vi.fn()
    const endsAt = Date.now() - 1000 // already expired

    render(<ExamTimer endsAt={endsAt} onExpire={onExpire} />)

    // Trigger the effect that checks remaining.
    act(() => {
      vi.advanceTimersByTime(0)
    })

    expect(onExpire).toHaveBeenCalledTimes(1)
  })
})
