/**
 * Home hero content. Pure (no server-only) so it is unit-testable. The hero never depends on the API:
 * `pickHero` returns the first usable admin slider, otherwise the static fallback below.
 */
export type HeroContent = {
  source: 'slider' | 'fallback';
  title: string;
  eyebrow?: string;
  subtitle?: string;
  alt: string;
  image: string;
  href: string;
  ctaLabel: string;
};

/** Neutral copy: only claims the owner's site already makes; no delivery promises. */
export const HERO_FALLBACK: HeroContent = {
  source: 'fallback',
  eyebrow: 'Fresh Petals India',
  title: 'Fresh flowers, arranged with care.',
  subtitle: 'Fresh-cut stems and bouquets, arranged by our florists in Delhi NCR.',
  alt: 'An autumn bouquet of burnt-orange blooms and berries against a deep blue backdrop',
  image: '/images/home-hero.webp',
  href: '/products',
  ctaLabel: 'Shop flowers',
};

export const HERO_IMAGE_SIZE = { width: 960, height: 1200 } as const;

const LIMITS = { title: 80, subtitle: 200, eyebrow: 40, alt: 140, cta: 24 } as const;

function clean(v: unknown, max: number): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.replace(/\s+/g, ' ').trim();
  if (!t) return undefined;
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}\u2026` : t;
}

// Browsers strip tabs/newlines from URLs and treat backslashes as slashes, so "/	/evil.com" would become "//evil.com".
const hasUnsafeChar = (v: string) => Array.from(v).some((ch) => ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127 || ch === String.fromCharCode(92));

/** Relative paths only (or same-site absolute URLs, reduced to a path); anything else becomes /products. */
export function safeHref(href: unknown, siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''): string {
  if (typeof href !== 'string') return '/products';
  const h = href.trim();
  if (hasUnsafeChar(href)) return '/products';
  if (h.startsWith('/') && !h.startsWith('//') && !h.startsWith('/\\')) return h;
  if (siteUrl && /^https?:\/\//i.test(h)) {
    try {
      const u = new URL(h);
      if (u.origin === new URL(siteUrl).origin) return `${u.pathname}${u.search}` || '/';
    } catch {
      /* fall through */
    }
  }
  return '/products';
}

export function pickHero(raw: unknown): HeroContent {
  if (!Array.isArray(raw)) return HERO_FALLBACK;
  for (const s of raw) {
    if (!s || typeof s !== 'object') continue;
    const r = s as Record<string, unknown>;
    if (r.active === false) continue;
    const image = typeof r.image === 'string' ? r.image.trim() : '';
    if (!image.startsWith('https://res.cloudinary.com/')) continue;
    const title = clean(r.title, LIMITS.title);
    if (!title) continue;
    const cfg = (r.config && typeof r.config === 'object' ? r.config : {}) as { overlay?: { cta?: { label?: unknown } } };
    return {
      source: 'slider',
      title,
      eyebrow: clean(r.eyebrow, LIMITS.eyebrow),
      subtitle: clean(r.subtitle, LIMITS.subtitle),
      alt: clean(r.alt, LIMITS.alt) ?? title,
      image,
      href: safeHref(r.href),
      ctaLabel: clean(cfg.overlay?.cta?.label, LIMITS.cta) ?? 'Shop now',
    };
  }
  return HERO_FALLBACK;
}
