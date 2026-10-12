import { describe, it, expect } from 'vitest';
import { photosFirst } from '../home-order';

const p = (id: number, image: string | null) => ({ id, image });
const CLD = 'https://res.cloudinary.com/demo/image/upload/a.jpg';

describe('photosFirst', () => {
  it('moves products with a real Cloudinary photo ahead, keeping order otherwise (stable)', () => {
    const out = photosFirst([p(1, null), p(2, CLD), p(3, ''), p(4, CLD), p(5, '/images/placeholder-bloom.jpg')]);
    expect(out.map((x) => x.id)).toEqual([2, 4, 1, 3, 5]);
  });
  it('does not mutate and handles empty input', () => {
    const input = [p(1, null), p(2, CLD)];
    photosFirst(input);
    expect(input.map((x) => x.id)).toEqual([1, 2]);
    expect(photosFirst([])).toEqual([]);
  });
});
