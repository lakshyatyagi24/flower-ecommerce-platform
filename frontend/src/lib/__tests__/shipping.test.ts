import { describe, it, expect } from 'vitest';
import { parseFreeThreshold, shippingFor, parseFlatRate } from '../shipping';

describe('shipping mirrors the backend', () => {
  it('threshold "0" means every order ships free (backend: subtotal >= 0)', () => {
    expect(shippingFor(100, 99, parseFreeThreshold('0'))).toBe(0);
  });
  it('blank, whitespace-only, missing or non-numeric threshold means no free shipping', () => {
    for (const raw of ['', '  ', undefined, null, 'abc']) expect(shippingFor(5000, 99, parseFreeThreshold(raw))).toBe(99);
  });
  it('charges below the threshold and is free at or above it', () => {
    const t = parseFreeThreshold('1499');
    expect(shippingFor(1498, 99, t)).toBe(99);
    expect(shippingFor(1499, 99, t)).toBe(0);
  });
  it('flat rate: invalid means 0', () => {
    expect(parseFlatRate('99')).toBe(99);
    expect(parseFlatRate('x')).toBe(0);
    expect(parseFlatRate(undefined)).toBe(0);
  });
});
