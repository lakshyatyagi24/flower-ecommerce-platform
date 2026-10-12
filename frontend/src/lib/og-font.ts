import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

let cached: Promise<ArrayBuffer> | undefined;

/**
 * Cormorant Garamond Medium (SIL OFL, see src/app/fonts/OFL.txt), read from the repo.
 * Read via fs relative to cwd (not fetch(new URL(...))): under Next 14.2 + the nodejs runtime
 * the URL form is rewritten to /_next/static/media/... and fails. next.config.mjs
 * (outputFileTracingIncludes) makes sure the file is copied into .next/standalone.
 */
export function ogFont(): Promise<ArrayBuffer> {
  cached ??= readFile(path.join(process.cwd(), 'src', 'app', 'fonts', 'CormorantGaramond-Medium.ttf')).then((b) =>
    b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer,
  );
  cached.catch(() => {
    cached = undefined; // retry next request rather than caching a failure
  });
  return cached;
}
