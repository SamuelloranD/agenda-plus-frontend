import { describe, expect, it } from 'vitest'
import { addCalendarDays, apiSlotTimestamp, utcDateKey } from './bookingTime'

describe('bookingTime', () => {
  it('uses the backend UTC day near local midnight', () => {
    expect(utcDateKey(new Date('2026-10-14T01:00:00Z'))).toBe('2026-10-14')
    expect(apiSlotTimestamp('2026-10-14T00:30:00')).toBe(Date.parse('2026-10-14T00:30:00Z'))
  })

  it('advances calendar dates across month boundaries without local timezone shifts', () => {
    expect(addCalendarDays('2026-10-31', 1)).toBe('2026-11-01')
  })
})
