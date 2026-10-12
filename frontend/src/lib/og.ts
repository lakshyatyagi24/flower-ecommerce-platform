import { formatINR } from './format';

/** Open Graph / Twitter card size (1.91:1). */
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = 'image/png';

const PHOTO_TIMEOUT_MS = 2500;
const PHOTO_MAX_BYTES = 2 * 1024 * 1024;
const NAME_MAX = 80;

/**
 * Cloudinary delivery URL for the left half of the card (600x630, cropped, forced to JPEG
 * because satori cannot decode webp/avif). Returns null for anything that is not an https
 * res.cloudinary.com URL, so nothing else is ever fetched server-side.
 */
export function cloudinaryOgPhotoUrl(src: string | null | undefined): string | null {
  if (!src) return null;
  let u: URL;
  try {
    u = new URL(src);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || u.hostname !== 'res.cloudinary.com') return null;
  const marker = '/upload/';
  const i = u.pathname.indexOf(marker);
  if (i === -1) return u.toString();
  u.pathname = `${u.pathname.slice(0, i + marker.length)}f_jpg,c_fill,w_600,h_630/${u.pathname.slice(i + marker.length)}`;
  return u.toString();
}

function sniff(bytes: Uint8Array): 'image/jpeg' | 'image/png' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  return null;
}

/** Fetches the product photo as a data URI, or null on ANY problem (host, timeout, size, type). */
export async function fetchOgPhoto(src: string | null | undefined): Promise<string | null> {
  const url = cloudinaryOgPhotoUrl(src);
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(PHOTO_TIMEOUT_MS) });
    if (!res.ok) return null;
    const declared = Number(res.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > PHOTO_MAX_BYTES) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > PHOTO_MAX_BYTES) return null;
    const mime = sniff(buf);
    if (!mime) return null;
    return `data:${mime};base64,${Buffer.from(buf).toString('base64')}`;
  } catch {
    return null;
  }
}

/** Keeps very long names from overflowing the card; cuts on a word boundary with an ellipsis. */
export function clampProductName(name: string): string {
  const clean = name.replace(/\s+/g, ' ').trim();
  if (clean.length <= NAME_MAX) return clean;
  const room = clean.slice(0, NAME_MAX - 1);
  const sp = room.lastIndexOf(' ');
  return `${(sp > NAME_MAX * 0.5 ? room.slice(0, sp) : room).replace(/[\s,;:.\-–—]+$/, '')}…`;
}

/** Formatted INR price, or null when the product is enquiry-only / the price is unusable. */
export function ogPrice(p: { price: number | string; saleMode?: string }): string | null {
  if (p.saleMode === 'ENQUIRY') return null;
  const n = Number(p.price);
  if (!Number.isFinite(n) || n <= 0) return null;
  return formatINR(n);
}

const NAME_COLUMN_PX = 468; // right panel width minus padding

/** Display font size for the product name: tiered by length, then shrunk so the longest word fits the column. */
export function nameFontSize(name: string): number {
  const base = name.length <= 18 ? 96 : name.length <= 34 ? 78 : name.length <= 56 ? 62 : 52;
  const longest = Math.max(1, ...name.split(/\s+/).map((w) => w.length));
  const fit = Math.floor(NAME_COLUMN_PX / (longest * 0.58));
  return Math.max(36, Math.min(base, fit));
}
