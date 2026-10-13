// Pure helpers for the first-load JS budget check (see check-bundle.mjs).
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * First-load JS budgets in kB (gzip), per app-router entry. Measured on 2026-10-13 (Next 14.2.35) with a
 * ~10% headroom, so an accidental heavy import fails the check but normal feature work does not:
 *   /            106 kB   /products 104 kB   /products/[slug] 112 kB   /checkout 115 kB   (shared floor 87 kB)
 * Raise a budget deliberately (in the same commit that adds the weight), never silently. `default` applies to
 * every route not listed.
 */
export const BUDGETS_KB = {
  '/page': 118,
  '/products/page': 116,
  '/products/[slug]/page': 124,
  '/checkout/page': 128,
  default: 120,
};

export function budgetFor(entry, budgets = BUDGETS_KB) {
  return budgets[entry] ?? budgets.default;
}

/** gzip size in kB (decimal, like Next's table) of the unique JS files an entry loads on first paint. */
export function firstLoadKb(files, readFile) {
  const js = [...new Set(files)].filter((f) => f.endsWith('.js'));
  const bytes = js.reduce((sum, f) => sum + gzipSync(readFile(f)).length, 0);
  return bytes / 1000;
}

/** Returns [{ entry, kb, budget, ok }] for every page entry in .next/app-build-manifest.json. */
export function measureBuild(nextDir = '.next', budgets = BUDGETS_KB) {
  const manifest = JSON.parse(readFileSync(join(nextDir, 'app-build-manifest.json'), 'utf8')).pages;
  const read = (f) => readFileSync(join(nextDir, f));
  return Object.entries(manifest)
    .filter(([entry]) => entry.endsWith('/page'))
    .map(([entry, files]) => {
      const kb = firstLoadKb(files, read);
      const budget = budgetFor(entry, budgets);
      return { entry, kb, budget, ok: kb <= budget };
    });
}
