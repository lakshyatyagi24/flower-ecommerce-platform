import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { pickHero } from '../hero';
import { safeImage } from '../product-image';

const IMAGES = path.resolve(__dirname, '../../../public/images');
const list = (dir: string) => fs.readdirSync(path.join(IMAGES, dir)).filter((f) => f.endsWith('.webp'));

describe('interim stock photos shipped in public/images', () => {
  it('hero files are real WebP, within the size budget, and accepted by pickHero', () => {
    const files = list('hero');
    expect(files.length).toBeGreaterThanOrEqual(3);
    for (const f of files) {
      const buf = fs.readFileSync(path.join(IMAGES, 'hero', f));
      expect(buf.subarray(0, 4).toString('latin1')).toBe('RIFF');
      expect(buf.subarray(8, 12).toString('latin1')).toBe('WEBP');
      expect(buf.length).toBeLessThanOrEqual(350 * 1024);
      const h = pickHero([{ title: 'Flowers', alt: 'x', image: `/images/hero/${f}`, href: '/products', active: true }]);
      expect(h.source).toBe('slider');
      expect(h.image).toBe(`/images/hero/${f}`);
    }
  });

  it('product photos are real WebP files the storefront will serve unchanged', () => {
    const files = list('products');
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const buf = fs.readFileSync(path.join(IMAGES, 'products', f));
      expect(buf.subarray(0, 4).toString('latin1')).toBe('RIFF');
      expect(buf.subarray(8, 12).toString('latin1')).toBe('WEBP');
      expect(buf.length).toBeLessThanOrEqual(300 * 1024);
      expect(safeImage(`/images/products/${f}`)).toBe(`/images/products/${f}`);
    }
  });

  it('every shipped photo is credited in CREDITS.md', () => {
    const credits = fs.readFileSync(path.join(IMAGES, 'CREDITS.md'), 'utf8');
    for (const f of list('hero')) expect(credits).toContain(`hero/${f}`);
    for (const f of list('products')) expect(credits).toContain(`products/${f}`);
  });
});
