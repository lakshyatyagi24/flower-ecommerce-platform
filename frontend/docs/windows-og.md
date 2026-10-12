# Open Graph images and Windows development

The storefront's social cards work like this:

- `src/app/opengraph-image.png` / `twitter-image.png`: committed, static 1200x630 brand card. Regenerate with `npm run render:og` (needs the Windows patch below on Windows) only if `BrandCard` in `src/lib/og-cards.tsx` changes.
- Products with a real Cloudinary photo: the product page sets `og:image`/`twitter:image` to a Cloudinary-transformed 1200x630 JPEG.
- Products without a photo: `src/app/products/[slug]/opengraph-image.tsx` renders a text card at request time with `next/og`.

## Windows caveat

Next 14.2.x (including 14.2.35) bundles `@vercel/og`, which loads its wasm/font assets with `fileURLToPath(join(import.meta.url, "../yoga.wasm"))`. `path.join` on win32 breaks the `file:` URL, so any code that loads `next/og` throws `Invalid URL` on Windows. Linux (Docker/production) is unaffected.

- `npm run build` is unaffected on Windows: no prerendered route imports `next/og`.
- Previewing a product's generated text card on a Windows dev machine needs a manual patch of `node_modules`:

  ```
  npm run patch:og
  ```

  It rewrites the three broken calls only when present and is idempotent. It is never run automatically (the Dockerfile runs `npm ci` before the app is copied). Undo with `npm ci`.
- Without the patch, on Windows the product text-card route returns the error response (500) instead of an image; pages are not affected (the page metadata only references the URL).
