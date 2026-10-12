// Re-creates the optimised home-page images in public/images/ from the original PNGs in src/assets/.
// The originals are ~2MB; the web copies are 4:5 WebP crops under ~250KB.
//
// sharp is deliberately NOT a project dependency. Install it in a scratch directory and run with
// NODE_PATH pointing at it, e.g.:
//   mkdir %TEMP%\sharp && cd %TEMP%\sharp && npm init -y && npm i sharp
//   set NODE_PATH=%TEMP%\sharp\node_modules && node scripts/optimise-images.mjs
//
// Hero (slider4.png, autumn bouquet, no baked-in text): crop the left 4:5 slice, 960x1200.
// Corporate (gallery2.png, table centrepiece): crop 4:5 from the top, 960x1200.
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(path.join(process.env.NODE_PATH || '.', 'x.js'));
const sharp = require('sharp');

const jobs = [
  { src: 'src/assets/slider4.png', out: 'public/images/home-hero.webp', crop: { left: 0, top: 0, width: 819, height: 1024 } },
  { src: 'src/assets/gallery2.png', out: 'public/images/home-corporate.webp', crop: { left: 0, top: 130, width: 1024, height: 1280 } },
];

for (const j of jobs) {
  const info = await sharp(j.src).extract(j.crop).resize(960, 1200).webp({ quality: 84 }).toFile(j.out);
  console.log(j.out, info.width + 'x' + info.height, Math.round(info.size / 1024) + 'KB');
}
