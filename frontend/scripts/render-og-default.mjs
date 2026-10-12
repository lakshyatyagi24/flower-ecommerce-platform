// Renders the committed static default social card:
//   src/app/opengraph-image.png  and  src/app/twitter-image.png  (1200x630)
// from the BrandCard in src/lib/og-cards.tsx. Run only when the brand card design changes:
//   npm run render:og
//
// Why static: next/og (@vercel/og) cannot load on Windows in Next 14.2.x (see patch-og-windows.mjs), so
// prerendered routes must never evaluate it. The product route (dynamic) still uses next/og at request time.
// On Windows run `npm run patch:og` first, render, then restore node_modules with `npm ci`.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const outDir = join(root, 'node_modules', '.cache', 'og-render');
mkdirSync(outDir, { recursive: true });
const bundle = join(outDir, 'cards.mjs');
await build({
  entryPoints: [join(root, 'src', 'lib', 'og-cards.tsx')],
  outfile: bundle,
  bundle: true,
  format: 'esm',
  platform: 'node',
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'],
  logLevel: 'error',
});
const { BrandCard, OG_FONT_FAMILY } = await import(pathToFileURL(bundle).href);
const { ImageResponse } = await import(
  pathToFileURL(join(root, 'node_modules', 'next', 'dist', 'compiled', '@vercel', 'og', 'index.node.js')).href
);
const { createElement } = await import(pathToFileURL(join(root, 'node_modules', 'react', 'index.js')).href);
const font = readFileSync(join(root, 'src', 'app', 'fonts', 'CormorantGaramond-Medium.ttf'));
const res = new ImageResponse(createElement(BrandCard), {
  width: 1200,
  height: 630,
  fonts: [{ name: OG_FONT_FAMILY, data: font, weight: 500, style: 'normal' }],
});
const png = Buffer.from(await res.arrayBuffer());
for (const name of ['opengraph-image.png', 'twitter-image.png']) {
  writeFileSync(join(root, 'src', 'app', name), png);
}
console.log(`render-og: wrote ${png.length} bytes to src/app/{opengraph,twitter}-image.png`);
