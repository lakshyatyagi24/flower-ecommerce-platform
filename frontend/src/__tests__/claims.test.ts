import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * Honesty guard (R10/R16): the storefront must not hardcode delivery-time or urgency claims. Anything that
 * needs such a sentence must read it from settings.
 */
export const BANNED_PHRASES = ['same-day', 'same day', 'free delivery', 'within a few hours', 'limited time', 'farm-fresh', 'next-day', '24 hours', 'guarantee'];

/**
 * Files allowed to contain a banned phrase. EMPTY since Task 3.7b: every claim was removed or moved to settings.
 * Do not add entries; reword the copy or read it from settings instead.
 */
export const ALLOWLIST: string[] = [];

const SRC = join(__dirname, '..');
const ROOTS = ['components', 'app', 'lib'];
const SOURCE = /\.(tsx?|jsx?|mdx?|css)$/;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === '__tests__' || name === 'node_modules') continue;
      walk(p, out);
    } else if (SOURCE.test(name) && !/\.(test|spec)\.[tj]sx?$/.test(name)) {
      out.push(p);
    }
  }
  return out;
}

const files = ROOTS.flatMap((r) => walk(join(SRC, r))).map((p) => ({
  path: relative(SRC, p).split('\\').join('/'),
  text: readFileSync(p, 'utf8').toLowerCase(),
}));

const hits = (text: string) => BANNED_PHRASES.filter((b) => text.includes(b));

describe('claims scan', () => {
  it('scans a meaningful number of files', () => {
    expect(files.length).toBeGreaterThan(40);
  });

  it('finds no banned phrase outside the allowlist', () => {
    const offenders = files
      .filter((f) => !ALLOWLIST.includes(f.path))
      .map((f) => ({ path: f.path, phrases: hits(f.text) }))
      .filter((f) => f.phrases.length > 0);
    expect(offenders).toEqual([]);
  });

  it('keeps the allowlist honest: every entry exists and still contains a banned phrase', () => {
    for (const entry of ALLOWLIST) {
      const f = files.find((x) => x.path === entry);
      expect(f, `${entry} no longer exists - remove it from ALLOWLIST`).toBeDefined();
      expect(hits(f!.text).length, `${entry} is clean - remove it from ALLOWLIST`).toBeGreaterThan(0);
    }
  });
});

/**
 * The 95 product descriptions live in the backend repo (prisma/data/product-copy.js) and are shown on product pages, so the
 * same banned phrases apply to them. Runs only where the sibling repo is checked out next to this one; the backend has its
 * own, stricter spec (src/catalog/product-copy.spec.ts) that always runs.
 */
const COPY_FILE = join(__dirname, '..', '..', '..', '..', 'flower-backend', 'prisma', 'data', 'product-copy.js');

describe('product copy claims scan (sibling backend repo)', () => {
  it.skipIf(!existsSync(COPY_FILE))('finds no banned phrase in any product description', () => {
    const { PRODUCT_COPY } = createRequire(import.meta.url)(COPY_FILE) as { PRODUCT_COPY: Record<string, { description: string }> };
    const entries = Object.entries(PRODUCT_COPY);
    expect(entries.length).toBe(95);
    const offenders = entries
      .map(([slug, c]) => ({ slug, phrases: hits(c.description.toLowerCase()) }))
      .filter((e) => e.phrases.length > 0);
    expect(offenders).toEqual([]);
  });
});
