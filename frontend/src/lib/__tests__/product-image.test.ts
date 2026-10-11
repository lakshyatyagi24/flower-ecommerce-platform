import { describe, it, expect } from 'vitest';
import { productImage, PLACEHOLDER_IMAGE } from '../product-image';

describe('productImage', () => {
  it.each([
    ['null image', { image: null }],
    ['empty', { image: '' }],
    ['whitespace', { image: '   ' }],
    ['undefined product', undefined],
    ['null product', null],
    ['shopify url', { image: 'https://cdn.shopify.com/s/files/1/x.jpg' }],
    ['data uri', { image: 'data:image/png;base64,iVBORw0KGgo=' }],
    ['insecure cloudinary', { image: 'http://res.cloudinary.com/demo/image/upload/x.jpg' }],
    ['protocol-relative', { image: '//evil.com/x.jpg' }],
  ])('falls back to placeholder for %s', (_n, p) => {
    expect(productImage(p as never)).toBe(PLACEHOLDER_IMAGE);
  });

  it('passes through https cloudinary urls', () => {
    const u = 'https://res.cloudinary.com/demo/image/upload/v1/x.jpg';
    expect(productImage({ image: u })).toBe(u);
  });

  it('passes through local paths', () => {
    expect(productImage({ image: '/images/x.jpg' })).toBe('/images/x.jpg');
  });
});
