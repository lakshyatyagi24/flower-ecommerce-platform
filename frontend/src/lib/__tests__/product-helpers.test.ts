import { describe, it, expect } from 'vitest';
import { availability, toCartItem, minQty, careCopy, uspsFromSettings, minOrderCopy, stepUp, stepDown, isLowStock, LOW_STOCK_MAX } from '../product-helpers';
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

describe('minOrderCopy', () => {
  it('is null when there is no minimum above 1', () => {
    expect(minOrderCopy(1, 'stem')).toBeNull();
    expect(minOrderCopy(0, 'stem')).toBeNull();
    expect(minOrderCopy(undefined as unknown as number, 'stem')).toBeNull();
  });
  it('uses the product unit word, pluralised, only when the data says so', () => {
    expect(minOrderCopy(10, 'stem')).toBe('Minimum order: 10 stems');
    expect(minOrderCopy(6, 'Piece')).toBe('Minimum order: 6 pieces');
    expect(minOrderCopy(4, 'box')).toBe('Minimum order: 4 boxes');
    expect(minOrderCopy(3, 'bouquet')).toBe('Minimum order: 3 bouquets');
    expect(minOrderCopy(3, 'berry')).toBe('Minimum order: 3 berries');
    expect(minOrderCopy(5, 'stems')).toBe('Minimum order: 5 stems');
  });
  it('never invents a unit: missing, blank or bunch-like units leave the noun off', () => {
    expect(minOrderCopy(10)).toBe('Minimum order: 10');
    expect(minOrderCopy(10, null)).toBe('Minimum order: 10');
    expect(minOrderCopy(10, '  ')).toBe('Minimum order: 10');
    expect(minOrderCopy(10, 'bunch')).toBe('Minimum order: 10');
    expect(minOrderCopy(10, 'Bundle')).toBe('Minimum order: 10');
  });
});

describe('isLowStock', () => {
  it('is true from 1 up to and including the limit, never at zero or above it', () => {
    expect(LOW_STOCK_MAX).toBe(10);
    expect(isLowStock({ stock: 0 })).toBe(false);
    expect(isLowStock({ stock: -1 })).toBe(false);
    expect(isLowStock({ stock: 1 })).toBe(true);
    expect(isLowStock({ stock: 10 })).toBe(true);
    expect(isLowStock({ stock: 11 })).toBe(false);
  });
});

describe('stepUp / stepDown (R23: minimum-only)', () => {
  it('steps up by the minimum and the last step lands exactly on stock', () => {
    expect(stepUp(3, 3, 10)).toBe(6);
    expect(stepUp(9, 3, 10)).toBe(10);
    expect(stepUp(4, 4, 6)).toBe(6);
    expect(stepUp(1, 1, 5)).toBe(2);
  });
  it('never passes stock; unknown stock (0) steps freely', () => {
    expect(stepUp(10, 3, 10)).toBe(10);
    expect(stepUp(3, 3, 0)).toBe(6);
  });
  it('steps down by the minimum but never below it', () => {
    expect(stepDown(10, 3)).toBe(7);
    expect(stepDown(5, 3)).toBe(3);
    expect(stepDown(3, 3)).toBe(3);
    expect(stepDown(6, 4)).toBe(4);
  });
});
