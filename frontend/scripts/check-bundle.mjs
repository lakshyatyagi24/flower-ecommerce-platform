// Fails when a route's first-load JS (gzip) exceeds its budget in scripts/bundle-budget.mjs.
// Run after `npm run build`:   npm run check:bundle
// Reads .next/app-build-manifest.json; no browser, no network.
import { existsSync } from 'node:fs';
import { measureBuild } from './bundle-budget.mjs';

if (!existsSync('.next/app-build-manifest.json')) {
  console.error('No .next build output found. Run `npm run build` first.');
  process.exit(2);
}
const rows = measureBuild().sort((a, b) => b.kb - a.kb);
for (const r of rows) {
  console.log(`${r.ok ? 'ok  ' : 'OVER'} ${r.entry.padEnd(34)} ${r.kb.toFixed(1).padStart(6)} kB / ${r.budget} kB`);
}
const over = rows.filter((r) => !r.ok);
if (over.length) {
  console.error(`\n${over.length} route(s) over budget. Lazy-load the new code or raise the budget deliberately.`);
  process.exit(1);
}
console.log(`\nAll ${rows.length} routes within budget.`);
