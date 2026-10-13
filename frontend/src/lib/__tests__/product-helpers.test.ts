import { describe, it, expect } from 'vitest';
import { availability, toCartItem, minQty, careCopy, uspsFromSettings } from '../product-helpers';
import { splitDescription, leadText } from '../description';
import type { ApiProduct } from '../api';

const p: ApiProduct = {
  id: 7, name: 'Red Rose', slug: 'red-rose', description: null, price: 100, image: null, stock: 20,
  featured: false, active: true, categoryId: 1, saleMode: 'PURCHASE', gstRate: 5, minOrderQty: 1,
};

describe('availability', () => {
  it('in stock / out of stock / enquiry', () => {
    expect(availability(p)).toBe('in-stock');
    expect(availability({ ...p, stock: 0 })).toBe('out-of-stock');
    expect(availability({ ...p, saleMode: 'ENQUIRY', stock: 0 })).toBe('enquiry');
  });
  it('treats stock below the minimum order quantity as out of stock', () => {
    expect(availability({ ...p, stock: 3, minOrderQty: 5 })).toBe('out-of-stock');
    expect(availability({ ...p, stock: 5, minOrderQty: 5 })).toBe('in-stock');
  });
});

describe('minQty / toCartItem', () => {
  it('defaults the minimum to 1', () => {
    expect(minQty({ minOrderQty: undefined })).toBe(1);
    expect(minQty({ minOrderQty: 0 })).toBe(1);
    expect(minQty({ minOrderQty: 6 })).toBe(6);
  });
  it('produces the cart item shape', () => {
    expect(toCartItem(p)).toEqual({
      productId: 7, slug: 'red-rose', name: 'Red Rose', price: 100, image: null,
      saleMode: 'PURCHASE', gstRate: 5, minOrderQty: 1, stock: 20,
    });
  });
});

describe('splitDescription / leadText', () => {
  it('skips label lines for the lead and flags them as headings', () => {
    const d = splitDescription('What you get\n\nTwelve roses.\n\nSize it right\n\nFits a vase.');
    expect(d.lead).toBe('Twelve roses.');
    expect(d.rest).toEqual([
      { text: 'What you get', heading: true },
      { text: 'Size it right', heading: true },
      { text: 'Fits a vase.', heading: false },
    ]);
  });
  it('handles empty input', () => {
    expect(splitDescription(null)).toEqual({ lead: '', rest: [] });
    expect(leadText(null)).toBe('');
    expect(leadText('Only a label')).toBe('Only a label');
  });
});

describe('careCopy', () => {
  it('is keyed on product type', () => {
    expect(careCopy('CUT_FLOWER').join(' ')).toMatch(/trim/i);
    expect(careCopy('PLANT').join(' ')).toMatch(/light/i);
    expect(careCopy('HAMPER').join(' ')).not.toMatch(/trim|stems/i);
    expect(careCopy(undefined).length).toBeGreaterThan(0);
  });
});

describe('uspsFromSettings', () => {
  it('reads trust.uspN settings, max 3', () => {
    const s = {
      'trust.usp1Title': 'A', 'trust.usp1Body': 'a body', 'trust.usp2Title': 'B', 'trust.usp2Body': '',
      'trust.usp3Title': 'C', 'trust.usp3Body': 'c', 'trust.usp4Title': 'D', 'trust.usp4Body': 'd',
    };
    expect(uspsFromSettings(s)).toEqual([
      { title: 'A', body: 'a body' }, { title: 'B', body: '' }, { title: 'C', body: 'c' },
    ]);
  });
  it('falls back to a generic claim with no same-day promise', () => {
    const out = uspsFromSettings({});
    expect(out).toEqual([{ title: 'Chosen with care', body: '' }]);
  });
});
