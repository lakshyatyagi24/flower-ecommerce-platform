import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * Honesty guard (R10/R16): the storefront must not hardcode delivery-time or urgency claims. Anything that
 * needs such a sentence must read it from settings.
 */
export const BANNED_PHRASES = ['same-day', 'same day', 'free delivery', 'within a few hours', 'limited time'];

/**
 * Files that still contain a banned phrase and are cleaned up in Task 3.7 (about / FAQ / corporate / refund
 * copy; EnquiryForm and FAQSnapshot, used by /contact, were found by this scan).
 * TO BE EMPTIED IN TASK 3.7. Paths are relative to `src/`, forward slashes.
 */
export const ALLOWLIST: string[] = [
  'app/about/components/Studio.tsx',
  'app/about/components/CTA.tsx',
  'app/faq/faq-data.ts',
  'app/corporate/page.tsx',
  'app/refund-policy/page.tsx',
  'components/EnquiryForm.tsx',
  'components/FAQSnapshot.tsx',
];

const SRC = join(__dirname, '..');
const ROOTS = ['components', 'app'];
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
