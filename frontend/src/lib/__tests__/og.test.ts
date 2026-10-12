import { describe, it, expect } from 'vitest';
import { ogPhotoUrl, sanitizeOgText, clampProductName, ogPrice, nameFontSize } from '../og';

describe('ogPhotoUrl', () => {
  const T = 'c_fill,w_1200,h_630,g_auto,f_jpg,q_auto';
  it('inserts the crop/JPEG transformation right after /upload/', () => {
    expect(ogPhotoUrl('https://res.cloudinary.com/demo/image/upload/v1/a.jpg')).toBe(
      `https://res.cloudinary.com/demo/image/upload/${T}/v1/a.jpg`,
    );
    expect(ogPhotoUrl('https://res.cloudinary.com/demo/image/upload/sample.jpg')).toBe(
      `https://res.cloudinary.com/demo/image/upload/${T}/sample.jpg`,
    );
  });
  it('keeps existing transformations after ours and preserves the query string', () => {
    expect(ogPhotoUrl('https://res.cloudinary.com/demo/image/upload/w_200/v1/a.jpg?_a=B')).toBe(
      `https://res.cloudinary.com/demo/image/upload/${T}/w_200/v1/a.jpg?_a=B`,
    );
  });
  it('rejects placeholders, local paths, other hosts, http and non-upload paths', () => {
    expect(ogPhotoUrl('/images/placeholder-bloom.jpg')).toBeNull();
    expect(ogPhotoUrl('https://evil.example/image/upload/a.jpg')).toBeNull();
    expect(ogPhotoUrl('http://res.cloudinary.com/demo/image/upload/a.jpg')).toBeNull();
    expect(ogPhotoUrl('https://res.cloudinary.com.evil.com/demo/image/upload/a.jpg')).toBeNull();
    expect(ogPhotoUrl('https://res.cloudinary.com/demo/image/fetch/https://x.test/a.jpg')).toBeNull();
    expect(ogPhotoUrl('https://res.cloudinary.com/demo/video/upload/a.mp4')).toBeNull();
    expect(ogPhotoUrl('https://user:pw@res.cloudinary.com/demo/image/upload/a.jpg')).toBeNull();
    expect(ogPhotoUrl('')).toBeNull();
    expect(ogPhotoUrl(null)).toBeNull();
    expect(ogPhotoUrl(undefined)).toBeNull();
    expect(ogPhotoUrl('not a url')).toBeNull();
  });
});

describe('sanitizeOgText', () => {
  it('drops characters outside the bundled font (emoji, Devanagari) and collapses whitespace', () => {
    expect(sanitizeOgText('Rose \u{1F339}  Bouquet')).toBe('Rose Bouquet');
    expect(sanitizeOgText('गुलाब Rose')).toBe('Rose');
    expect(sanitizeOgText('Café — ₹499')).toBe('Café — ₹499');
  });
});

describe('clampProductName / ogPrice', () => {
  it('strips unsupported glyphs from names', () => {
    expect(clampProductName('Rose \u{1F339} Bouquet')).toBe('Rose Bouquet');
  });
  it('leaves short names, truncates very long ones with an ellipsis', () => {
    expect(clampProductName('Red Rose')).toBe('Red Rose');
    const long = 'Premium Long Stem Imported Red Roses Luxury Gift Bouquet With Seasonal Fillers And Greens Extra Large';
    const out = clampProductName(long);
    expect(out.length).toBeLessThanOrEqual(80);
    expect(out.endsWith('…')).toBe(true);
    expect(long.startsWith(out.slice(0, -1).trimEnd())).toBe(true);
  });
  it('formats INR, and returns null for enquiry/invalid prices', () => {
    expect(ogPrice({ price: 1499, saleMode: 'PURCHASE' })).toBe('₹1,499');
    expect(ogPrice({ price: '499', saleMode: undefined })).toBe('₹499');
    expect(ogPrice({ price: 499, saleMode: 'ENQUIRY' })).toBeNull();
    expect(ogPrice({ price: NaN, saleMode: 'PURCHASE' })).toBeNull();
  });
});

describe('nameFontSize', () => {
  it('is large for short names and smaller for long ones', () => {
    expect(nameFontSize('Red Rose')).toBe(96);
    expect(nameFontSize('Premium Red Rose Bouquet Large')).toBe(78);
    expect(nameFontSize('x '.repeat(40).trim())).toBeLessThanOrEqual(52);
  });
  it('shrinks so one very long word still fits the column, never below 36', () => {
    expect(nameFontSize('Chrysanthemums')).toBeLessThan(96);
    expect(nameFontSize('Chrysanthemums') * 14 * 0.58).toBeLessThanOrEqual(468);
    expect(nameFontSize('A'.repeat(60))).toBe(36);
  });
});
