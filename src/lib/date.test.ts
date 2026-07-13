import { describe, expect, it } from 'vitest'
import { formatDateCs } from './date'

describe('formatDateCs', () => {
  it('formats a date-only ISO string without the UTC-midnight shift', () => {
    // new Date('2026-07-12') is UTC midnight → "11. 7. 2026" west of UTC.
    // String math has no timezone to get wrong.
    expect(formatDateCs('2026-07-12')).toBe('12. 7. 2026')
    expect(formatDateCs('2027-01-01')).toBe('1. 1. 2027')
  })
})
