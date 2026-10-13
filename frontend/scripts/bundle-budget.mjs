// Pure helpers for the first-load JS budget check (see check-bundle.mjs).
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * First-load JS budgets in kB (gzip), per app-router entry. These include the root layout and any nested
 * layouts (they load on every navigation to the route), exactly like Next's "First Load JS" column plus the
 * layout chunks. Measured on 2026-10-13 (Next 14.2.35), budgets ~6% above:
 *   /            ~121 kB   /products ~119   /products/[slug] ~127   /checkout ~130   (shared floor 87 kB)
 * Raise a budget deliberately (in the same commit that adds the weight), never silently. `default` applies to
 * every route not listed.
 */
export const BUDGETS_KB = {
  '/page': 129,
  '/products/page': 127,
  '/products/[slug]/page': 135,
  '/checkout/page': 139,
  default: 135,
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

/** Entries whose files also load for `/a/b/page`: `/layout`, `/a/layout`, `/a/b/layout` (when present). */
export function layoutEntries(entry) {
  const segs = entry.split('/').filter(Boolean).slice(0, -1); // drop "page"
  const out = ['/layout'];
  for (let i = 1; i <= segs.length; i += 1) out.push(`/${segs.slice(0, i).join('/')}/layout`);
  return out;
}

/** Returns [{ entry, kb, budget, ok }] for every page entry in .next/app-build-manifest.json. */
export function measureBuild(nextDir = '.next', budgets = BUDGETS_KB) {
  const manifest = JSON.parse(readFileSync(join(nextDir, 'app-build-manifest.json'), 'utf8')).pages;
  const read = (f) => readFileSync(join(nextDir, f));
  return Object.entries(manifest)
    .filter(([entry]) => entry.endsWith('/page'))
    .map(([entry, files]) => {
      const all = [...files, ...layoutEntries(entry).flatMap((l) => manifest[l] ?? [])];
      const kb = firstLoadKb(all, read);
      const budget = budgetFor(entry, budgets);
      return { entry, kb, budget, ok: kb <= budget };
    });
}
