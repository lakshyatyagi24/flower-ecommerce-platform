import { describe, it, expect } from 'vitest';
import { gzipSync } from 'node:zlib';
import { BUDGETS_KB, budgetFor, firstLoadKb } from './bundle-budget.mjs';

describe('bundle budget helpers', () => {
  it('sums gzip size of unique js files only', () => {
    const buf = Buffer.from('a'.repeat(5000));
    const one = gzipSync(buf).length / 1000;
    const kb = firstLoadKb(['a.js', 'a.js', 'b.css', 'c.js'], () => buf);
    expect(kb).toBeCloseTo(one * 2, 5);
  });
  it('uses the route budget, falling back to default', () => {
    expect(budgetFor('/checkout/page')).toBe(BUDGETS_KB['/checkout/page']);
    expect(budgetFor('/nope/page')).toBe(BUDGETS_KB.default);
  });
  it('every budget is a sane positive number', () => {
    Object.values(BUDGETS_KB).forEach((v) => expect(v).toBeGreaterThan(80));
  });
});
