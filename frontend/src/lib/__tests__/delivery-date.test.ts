import { describe, it, expect } from 'vitest'
import { formatDeliveryDate, isDeliveryOptions, isIsoDate, validateDeliveryDate } from '../delivery-date'

const opts = { earliest: '2026-10-14', latest: '2026-10-28', blackoutDates: ['2026-10-20'] }

describe('formatDeliveryDate', () => {
  it('formats a plain date and a stored UTC-midnight timestamp the same way, independent of timezone', () => {
    expect(formatDeliveryDate('2026-10-14')).toBe('Wednesday, 14 October 2026')
    expect(formatDeliveryDate('2026-10-14T00:00:00.000Z')).toBe('Wednesday, 14 October 2026')
  })
  it('returns an empty string for missing or invalid input', () => {
    for (const v of [null, undefined, '', 'tomorrow', '2026-02-30']) expect(formatDeliveryDate(v as never)).toBe('')
  })
})

describe('isIsoDate / isDeliveryOptions', () => {
  it('is strict', () => {
    expect(isIsoDate('2026-10-14')).toBe(true)
    expect(isIsoDate('2026-10-14T00:00:00Z')).toBe(false)
    expect(isIsoDate('2026-13-01')).toBe(false)
  })
  it('accepts only well-formed options', () => {
    expect(isDeliveryOptions(opts)).toBe(true)
    expect(isDeliveryOptions(null)).toBe(false)
    expect(isDeliveryOptions({ ...opts, earliest: 'x' })).toBe(false)
    expect(isDeliveryOptions({ ...opts, latest: '2026-10-01' })).toBe(false)
    expect(isDeliveryOptions({ ...opts, blackoutDates: 'none' })).toBe(false)
    expect(isDeliveryOptions({ ...opts, blackoutDates: ['bad'] })).toBe(false)
  })
})

describe('validateDeliveryDate', () => {
  it('accepts the window edges and dates inside it', () => {
    for (const d of ['2026-10-14', '2026-10-19', '2026-10-28']) expect(validateDeliveryDate(d, opts)).toBeUndefined()
  })
  it('rejects empty, malformed, out-of-window and blackout dates with specific wording', () => {
    expect(validateDeliveryDate('', opts)).toBe('Choose a delivery date')
    expect(validateDeliveryDate('14/10/2026', opts)).toBe('Enter a valid delivery date')
    expect(validateDeliveryDate('2026-10-13', opts)).toMatch(/^Choose a date between Wednesday, 14 October 2026 and/)
    expect(validateDeliveryDate('2026-10-29', opts)).toMatch(/^Choose a date between/)
    expect(validateDeliveryDate('2026-10-20', opts)).toBe("We can't deliver on Tuesday, 20 October 2026. Please choose another day.")
  })
})
