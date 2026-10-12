// MANUAL, Windows-only helper:  npm run patch:og
//
// Next 14.2.x bundles @vercel/og, whose startup does
//   fileURLToPath(join(import.meta.url, "../yoga.wasm"))
// `path.join` on win32 mangles the file: URL, so loading `next/og` throws "Invalid URL".
// That only affects PRODUCT Open Graph cards (src/app/products/[slug]/opengraph-image.tsx) when run
// locally on Windows (`next dev` / `next start`). The site build and Linux/Docker are unaffected:
// the root OG/Twitter images are committed static PNGs and no prerendered route imports next/og.
//
// This rewrites the broken calls in node_modules to `fileURLToPath(new URL("./X", import.meta.url))`.
// It is idempotent and does nothing when the broken pattern is absent. Never run it from postinstall
// (the Dockerfile runs `npm ci` before the app is copied). Undo with `npm ci` (or reinstall next).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const file = join(process.cwd(), 'node_modules', 'next', 'dist', 'compiled', '@vercel', 'og', 'index.node.js');
if (!existsSync(file)) {
  console.error(`patch-og: ${file} not found (run from the frontend directory after npm install).`);
  process.exit(1);
}
const src = readFileSync(file, 'utf8');
const broken = /fileURLToPath\(join\(import\.meta\.url, "\.\.\/([^"]+)"\)\)/g;
const hits = [...src.matchAll(broken)].map((m) => m[1]);
if (hits.length === 0) {
  console.log('patch-og: broken pattern not present (already patched or fixed upstream). Nothing to do.');
  process.exit(0);
}
writeFileSync(file, src.replace(broken, 'fileURLToPath(new URL("./$1", import.meta.url))'));
console.log(`patch-og: rewrote ${hits.length} call(s): ${hits.join(', ')}`);
console.log('patch-og: undo with `npm ci` (restores the pristine file).');
