import { formatINR } from './format';

/** Open Graph / Twitter card size (1.91:1). */
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = 'image/png';

const NAME_MAX = 80;
const PHOTO_TRANSFORM = 'c_fill,w_1200,h_630,g_auto,f_jpg,q_auto';

/**
 * Social-preview photo for a product that has a REAL Cloudinary image: a 1200x630 JPEG served by
 * Cloudinary itself (small, so WhatsApp/Facebook accept it). Returns null for anything that is not
 * an https res.cloudinary.com image/upload URL (placeholders, other hosts, fetch/remote URLs...).
 * The result is only ever used as a URL in metadata or a redirect; this server never fetches it.
 */
export function ogPhotoUrl(src: string | null | undefined): string | null {
  if (!src) return null;
  let u: URL;
  try {
    u = new URL(src);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || u.hostname !== 'res.cloudinary.com' || u.username || u.password || u.port) return null;
  const m = u.pathname.match(/^(\/[^/]+\/image\/upload\/)(.+)$/);
  if (!m) return null;
  u.pathname = `${m[1]}${PHOTO_TRANSFORM}/${m[2]}`;
  return u.toString();
}

/**
 * The bundled font covers Basic Latin, Latin-1, a few typographic marks and the rupee sign.
 * Anything else (emoji, Devanagari...) would make @vercel/og fetch fallback fonts from Google/jsDelivr
 * at request time, so it is removed up front.
 */
export function sanitizeOgText(text: string): string {
  return text
    .replace(/[^ -~ -ÿ–—‘-”…₹]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Keeps very long names from overflowing the card; cuts on a word boundary with an ellipsis. */
export function clampProductName(name: string): string {
  const clean = sanitizeOgText(name);
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
