import { describe, it, expect } from 'vitest';
import { findColourHits } from './colour-patterns.mjs';

describe('findColourHits', () => {
  it('matches hex, arbitrary and rgb values', () => {
    expect(findColourHits('color: #fff;')).toContain('#fff');
    expect(findColourHits('x="#7C835A"')).toContain('#7C835A');
    expect(findColourHits('className="bg-[#abc]"')).toContain('[#abc]');
    expect(findColourHits('a: rgba(0,0,0,.5)')).toContain('rgba(0,0,0,.5)');
    expect(findColourHits('text-[rgb(1,2,3)]')).toContain('[rgb(1,2,3)]');
  });
  it('ignores tokens, entities and anchors', () => {
    expect(findColourHits('className="bg-charcoal text-ivory"')).toEqual([]);
    expect(findColourHits('&#123; <a href="#main">')).toEqual([]);
    expect(findColourHits('var(--color-moss)')).toEqual([]);
  });
});
