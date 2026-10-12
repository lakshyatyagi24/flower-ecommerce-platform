// Fails when hardcoded colours are found in src/app and src/components
// (globals.css is exempt: it is where tokens are defined).
//
// Usage:
//   npm run lint:colours                         scan everything
//   node scripts/check-colours.mjs --files a.tsx b.tsx   scan only those files
//   node scripts/check-colours.mjs a.tsx b.tsx           (same; bare args work too)
//
// Prints per-file offenders (first 5 each), the first 10 files, and totals.
// Exit code 1 if anything is found. Expected to FAIL until Task 3.9.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { findColourHits } from './colour-patterns.mjs';

const roots = ['src/app', 'src/components'];
const args = process.argv.slice(2).filter((a) => a !== '--files');
const SCAN = /\.(tsx|ts|css)$/;

const files = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
};
if (args.length) files.push(...args);
else roots.forEach(walk);

const bad = [];
let scanned = 0;
for (const p of files) {
  const norm = p.split('\\').join('/');
  if (!SCAN.test(norm) || norm.endsWith('globals.css')) continue;
  if (/(^|\/)__tests__\/|\.test\.tsx?$/.test(norm)) continue;
  scanned++;
  let text;
  try {
    text = readFileSync(p, 'utf8');
  } catch (err) {
    const why = err.code === 'ENOENT' ? 'no such file' : err.code === 'EISDIR' ? 'is a directory (pass files, not folders)' : err.message;
    console.error(`check-colours: cannot read ${p}: ${why}`);
    process.exit(1);
  }
  const hits = findColourHits(text);
  if (hits.length) bad.push({ p: norm, hits });
}

if (scanned === 0) {
  console.error('check-colours: no scannable files (.tsx/.ts/.css, excluding globals.css and tests) matched.');
  process.exit(1);
}

if (bad.length) {
  console.error(`Hardcoded colours: ${bad.length} of ${scanned} files offend. First ${Math.min(10, bad.length)}:`);
  for (const { p, hits } of bad.slice(0, 10)) {
    console.error(`  ${p}: ${hits.slice(0, 5).join(', ')}${hits.length > 5 ? ` (+${hits.length - 5})` : ''}`);
  }
  if (bad.length > 10) console.error(`  ... and ${bad.length - 10} more files`);
  process.exit(1);
}
console.log(`No hardcoded colours (${scanned} files scanned).`);
