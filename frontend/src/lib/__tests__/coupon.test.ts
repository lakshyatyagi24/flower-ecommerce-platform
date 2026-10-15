import { describe, it, expect } from 'vitest'
import fixtures from './discount-fixtures.json'
import { allocateDiscount, gstAfterDiscount, gstPerLine, isCouponError, normalizeCouponInput, round2, totalAfterDiscount } from '../coupon'

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

// Same fixtures as the backend (src/coupons/discount-tax.spec.ts and orders.coupons.spec.ts): the checkout must show
// the total the server will charge.
describe('GST on the discounted value (parity with the server)', () => {
  const rose = { lineTotal: 1000, gstRate: 18 }
  const multi = [
    { lineTotal: 333.33, gstRate: 18 },
    { lineTotal: 333.33, gstRate: 12 },
    { lineTotal: 333.34, gstRate: 5 },
  ]

  it('1000 less 200 at 18% is 144 and the total follows', () => {
    expect(gstPerLine([rose], 200)).toEqual([144])
    expect(gstAfterDiscount([rose], 200)).toBe(144)
    expect(totalAfterDiscount(1000, 200, 99, gstAfterDiscount([rose], 200))).toBe(1043)
  })

  it('without a discount GST is line * rate', () => {
    expect(gstAfterDiscount([rose], 0)).toBe(180)
    expect(totalAfterDiscount(1000, 0, 99, 180)).toBe(1279)
  })

  it('zero-rate lines stay zero', () => {
    expect(gstPerLine([{ lineTotal: 500, gstRate: 0 }, { lineTotal: 500, gstRate: 18 }], 100)).toEqual([0, 81])
    expect(gstAfterDiscount([{ lineTotal: 1000, gstRate: 0 }], 200)).toBe(0)
  })

  it('percent with a max discount: 2000 capped at 150, 5% GST', () => {
    expect(gstAfterDiscount([{ lineTotal: 2000, gstRate: 5 }], 150)).toBe(92.5)
    expect(totalAfterDiscount(2000, 150, 0, 92.5)).toBe(1942.5)
  })

  it('multi-line: proportional split, last line takes the remainder, sums exact', () => {
    expect(allocateDiscount([333.33, 333.33, 333.34], 100)).toEqual([33.33, 33.33, 33.34])
    expect(allocateDiscount([100, 100, 100], 10)).toEqual([3.33, 3.33, 3.34])
    expect(gstPerLine(multi, 100)).toEqual([54, 36, 15])
    expect(gstAfterDiscount(multi, 100)).toBe(105)
    expect(totalAfterDiscount(1000, 100, 0, 105)).toBe(1005)
  })

  it('allocations always add up to the discount', () => {
    for (const [lines, d] of [
      [[19.99, 5.01, 74.5], 17.77],
      [[0.01, 0.01, 0.01], 0.02],
      [[250, 125.5, 99.99, 10], 100],
    ] as Array<[number[], number]>) {
      const sum = allocateDiscount(lines, d).reduce((a, b) => a + b, 0)
      expect(Math.round(sum * 100)).toBe(Math.round(d * 100))
    }
  })
})

// discount-fixtures.json is byte-identical to the backend's src/coupons/discount-fixtures.json, so the storefront and
// the server split the discount and tax it the same way, paisa for paisa.
describe('shared fixtures (parity with the server)', () => {
  it.each(fixtures.allocations.map((c) => [JSON.stringify(c.lines) + ' / ' + c.discount, c] as const))('allocate %s', (_n, c) => {
    expect(allocateDiscount(c.lines, c.discount)).toEqual(c.shares)
  })

  it.each(fixtures.gst.map((c) => [JSON.stringify(c.lines) + ' / ' + c.discount, c] as const))('gst %s', (_n, c) => {
    expect(gstPerLine(c.lines, c.discount)).toEqual(c.gst)
  })

  it('the near-zero line case that used to give -0.01 on the last line', () => {
    const shares = allocateDiscount([4181.78, 755.7, 3.34, 0], 2749.95)
    expect(shares).toEqual([2327.5, 420.6, 1.85, 0])
  })

  it('an oversized discount is clamped to the subtotal', () => {
    expect(allocateDiscount([10, 20], 999)).toEqual([10, 20])
    expect(allocateDiscount([0, 0], 10)).toEqual([0, 0])
  })
})

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('discount split invariants (seeded fuzz, same generator and seed as the server)', () => {
  it(`holds for ${fixtures.fuzz.baskets} random baskets`, () => {
    const paise = (n: number) => Math.round(n * 100)
    const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
    const rnd = mulberry32(fixtures.fuzz.seed)
    const rates = [0, 5, 12, 18, 28]
    for (let b = 0; b < fixtures.fuzz.baskets; b++) {
      const n = 1 + Math.floor(rnd() * 6)
      const lines = Array.from({ length: n }, () => ({
        lineTotal: (rnd() < 0.1 ? 0 : 1 + Math.floor(rnd() * 500000)) / 100,
        gstRate: rates[Math.floor(rnd() * rates.length)],
      }))
      const subtotalPaise = sum(lines.map((l) => paise(l.lineTotal)))
      const discountPaise = rnd() < 0.1 ? subtotalPaise : Math.floor(rnd() * (subtotalPaise + 1))
      const discount = discountPaise / 100
      const ctx = JSON.stringify({ lines, discount })
      const shares = allocateDiscount(lines.map((l) => l.lineTotal), discount)
      expect([ctx, paise(sum(shares))]).toEqual([ctx, discountPaise])
      shares.forEach((s, i) => expect([ctx, s >= 0 && paise(s) <= paise(lines[i].lineTotal)]).toEqual([ctx, true]))
      const gst = gstPerLine(lines, discount)
      expect([ctx, paise(gstAfterDiscount(lines, discount))]).toEqual([ctx, paise(sum(gst))])
    }
  })
})
