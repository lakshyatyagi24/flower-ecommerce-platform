import {
  FALLBACK,
  FALLBACK_HERO,
  FALLBACK_USPS,
  type StoreDelivery,
  type StoreHero,
  type StorePolicies,
  type StoreSeo,
  type StoreSettings,
  type StoreSocial,
  type StoreUSP,
} from "./types";

type Raw = Record<string, string>;

/**
 * True for values that must never reach customers: empty, or leftover seed/placeholder text. The live
 * database may still hold strings seeded earlier (for example "orders@example.com"), so every settings
 * consumer treats such values as UNSET.
 */
export function isPlaceholderSetting(value: string | null | undefined): boolean {
  if (value == null) return true;
  const v = value.trim();
  return v === "" || /example\.com|please update|placeholder|lorem ipsum/i.test(v);
}

function clean(raw: Raw, key: string): string {
  const v = raw[key];
  return isPlaceholderSetting(v) ? "" : v.trim();
}

/** The trimmed value as stored (placeholder text is NOT filtered), or "". */
function trimmed(raw: Raw, key: string): string {
  return raw[key]?.trim() || "";
}

function parseFloatSafe(v: string | undefined, fallback: number): number {
  if (!v) return fallback;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function pick(raw: Raw, key: string, fallback: string): string {
  return clean(raw, key) || fallback;
}

function buildUsps(raw: Raw): StoreUSP[] {
  const items: StoreUSP[] = [];
  for (let i = 1; i <= 4; i += 1) {
    const title = clean(raw, `trust.usp${i}Title`);
    const body = clean(raw, `trust.usp${i}Body`);
    if (!title && !body) continue;
    items.push({
      title: title || FALLBACK_USPS[i - 1]?.title || "",
      body: body || FALLBACK_USPS[i - 1]?.body || "",
    });
  }
  return items.length > 0 ? items : FALLBACK_USPS;
}

function buildHero(raw: Raw): StoreHero {
  return {
    eyebrow: pick(raw, "homepage.heroEyebrow", FALLBACK_HERO.eyebrow),
    title: pick(raw, "homepage.heroTitle", FALLBACK_HERO.title),
    subtitle: pick(raw, "homepage.heroSubtitle", FALLBACK_HERO.subtitle),
    ctaLabel: pick(raw, "homepage.heroCtaLabel", FALLBACK_HERO.ctaLabel),
    ctaHref: pick(raw, "homepage.heroCtaHref", FALLBACK_HERO.ctaHref),
  };
}

function buildSocial(raw: Raw): StoreSocial {
  return {
    facebook: clean(raw, "social.facebook"),
    youtube: clean(raw, "social.youtube"),
    pinterest: clean(raw, "social.pinterest"),
  };
}

function buildDelivery(raw: Raw): StoreDelivery {
  return {
    cutoffTime: trimmed(raw, "delivery.cutoffTime"),
    supportedCities: trimmed(raw, "delivery.supportedCities"),
    supportedPincodes: trimmed(raw, "delivery.supportedPincodes"),
    businessHours: trimmed(raw, "delivery.businessHours"),
    leadTimeDays: parseFloatSafe(raw["delivery.leadTimeDays"], FALLBACK.delivery.leadTimeDays),
  };
}

function buildPolicies(raw: Raw): StorePolicies {
  return {
    returnsSummary: trimmed(raw, "policies.returnsSummary"),
    deliverySummary: trimmed(raw, "policies.deliverySummary"),
  };
}

function buildSeo(raw: Raw): StoreSeo {
  return {
    metaTitle: trimmed(raw, "seo.metaTitle"),
    metaDescription: trimmed(raw, "seo.metaDescription"),
    ogImage: trimmed(raw, "seo.ogImage"),
  };
}

export function fromRaw(raw: Raw): StoreSettings {
  return {
    raw,
    name: clean(raw, "store.name") || FALLBACK.name,
    email: clean(raw, "store.email"),
    phone: clean(raw, "store.phone"),
    whatsapp: clean(raw, "store.whatsapp") || clean(raw, "store.phone"),
    address: clean(raw, "store.address"),
    instagram: clean(raw, "store.instagram"),
    gstin: clean(raw, "store.gstin"),
    shippingFlatRate: parseFloatSafe(raw["shipping.flatRate"], FALLBACK.shippingFlatRate),
    shippingFreeThreshold: parseFloatSafe(raw["shipping.freeThreshold"], FALLBACK.shippingFreeThreshold),
    hero: buildHero(raw),
    usps: buildUsps(raw),
    social: buildSocial(raw),
    delivery: buildDelivery(raw),
    policies: buildPolicies(raw),
    seo: buildSeo(raw),
  };
}
