import { describe, it, expect } from 'vitest';
import { safeRedirect } from '../safe-redirect';

describe('safeRedirect', () => {
  it.each([
    ['/%09/evil.com'],
    ['/\t/evil.com'],
    ['/\\evil.com'],
    ['/\\\\evil.com'],
    ['//evil.com'],
    ['https://evil.com'],
    ['javascript:alert(1)'],
    ['/\n/evil.com'],
    ['/%5Cevil.com'],
    ['/%2F/evil.com'],
    ['/%0d/evil.com'],
    ['/%E0%A4%A'],
    ['evil.com'],
    [''],
  ])('rejects %j', (v) => {
    expect(safeRedirect(v)).toBeNull();
  });

  it('rejects null/undefined', () => {
    expect(safeRedirect(null)).toBeNull();
    expect(safeRedirect(undefined)).toBeNull();
  });

  it.each([
    ['/ok?x=1'],
    ['/account/orders'],
    ['/checkout/success?orderId=12'],
    ['/products/rose#reviews'],
    ['/'],
  ])('allows %j', (v) => {
    expect(safeRedirect(v)).toBe(v);
  });
});
