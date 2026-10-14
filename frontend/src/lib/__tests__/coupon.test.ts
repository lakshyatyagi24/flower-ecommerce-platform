import { describe, it, expect } from 'vitest'
import { isCouponError, normalizeCouponInput, round2, totalAfterDiscount } from '../coupon'

describe('coupon helpers', () => {
  it('round2 matches the server (half-up to paise)', () => {
    expect(round2(1.005)).toBe(1.01)
    expect(round2(0.1 + 0.2)).toBe(0.3)
    expect(round2(2.675)).toBe(2.68)
  })

  it('total = subtotal - discount + shipping + gst, rounded to paise', () => {
    expect(totalAfterDiscount(1000, 100, 99, 0)).toBe(999)
    expect(totalAfterDiscount(1000, 200, 99, 180)).toBe(1079)
    expect(totalAfterDiscount(333.33, 50, 0, 0)).toBe(283.33)
    expect(totalAfterDiscount(100, 0, 50, 0)).toBe(150)
  })

  it('normalises a typed code: no spaces, upper case', () => {
    expect(normalizeCouponInput(' save 10 ')).toBe('SAVE10')
    expect(normalizeCouponInput('a-b_c')).toBe('A-B_C')
  })

  it('recognises only the server\'s coupon-flagged errors', () => {
    expect(isCouponError({ payload: { field: 'couponCode', message: 'x' } })).toBe(true)
    expect(isCouponError({ payload: { message: 'x' } })).toBe(false)
    expect(isCouponError({ payload: null })).toBe(false)
    expect(isCouponError(new Error('x'))).toBe(false)
    expect(isCouponError(null)).toBe(false)
  })
})
