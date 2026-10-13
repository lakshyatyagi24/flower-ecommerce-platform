"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { api } from "./api";

export type StoreUSP = {
  title: string;
  body: string;
};

export type StoreHero = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

export type StoreSocial = {
  facebook: string;
  youtube: string;
  pinterest: string;
};

export type StoreDelivery = {
  cutoffTime: string;
  supportedCities: string;
  supportedPincodes: string;
  businessHours: string;
  leadTimeDays: number;
};

export type StorePolicies = {
  returnsSummary: string;
  deliverySummary: string;
};

export type StoreSeo = {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
};

export type StoreSettings = {
  raw: Record<string, string>;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  instagram: string;
  gstin: string;
  shippingFlatRate: number;
  shippingFreeThreshold: number;
  hero: StoreHero;
  usps: StoreUSP[];
  social: StoreSocial;
  delivery: StoreDelivery;
  policies: StorePolicies;
  seo: StoreSeo;
};

const FALLBACK_HERO: StoreHero = {
  eyebrow: "Fresh cut flowers",
  title: "Fresh-cut flowers, arranged with care.",
  subtitle: "Fresh-cut stems for gifting, for your home and for events in Delhi NCR.",
  ctaLabel: "Shop flowers",
  ctaHref: "/products",
};

const FALLBACK_USPS: StoreUSP[] = [
  { title: "Chosen with care", body: "Stems are selected and prepared for your vase." },
  { title: "Fresh-cut stems", body: "Prepared for your vase." },
  { title: "Careful packing", body: "Wrapped so your flowers arrive in good condition." },
  { title: "Made for occasions", body: "Birthdays, anniversaries, weddings or sympathy: we arrange for every moment." },
];

const FALLBACK: StoreSettings = {
  raw: {},
  name: "Fresh Petals India",
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  instagram: "",
  gstin: "",
  shippingFlatRate: 99,
  shippingFreeThreshold: 1499,
  hero: FALLBACK_HERO,
  usps: FALLBACK_USPS,
  social: { facebook: "", youtube: "", pinterest: "" },
  delivery: { cutoffTime: "", supportedCities: "", supportedPincodes: "", businessHours: "", leadTimeDays: 1 },
  policies: { returnsSummary: "", deliverySummary: "" },
  seo: { metaTitle: "", metaDescription: "", ogImage: "" },
};

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

function clean(raw: Record<string, string>, key: string): string {
  const v = raw[key];
  return isPlaceholderSetting(v) ? "" : v.trim();
}

function parseFloatSafe(v: string | undefined, fallback: number): number {
  if (!v) return fallback;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function pick(raw: Record<string, string>, key: string, fallback: string): string {
  const v = clean(raw, key);
  return v ? v : fallback;
}

function buildUsps(raw: Record<string, string>): StoreUSP[] {
  const items: StoreUSP[] = [];
  for (let i = 1; i <= 4; i += 1) {
    const title = clean(raw, `trust.usp${i}Title`);
    const body = clean(raw, `trust.usp${i}Body`);
    if (title || body) {
      items.push({
        title: title || FALLBACK_USPS[i - 1]?.title || "",
        body: body || FALLBACK_USPS[i - 1]?.body || "",
      });
    }
  }
  return items.length > 0 ? items : FALLBACK_USPS;
}

function fromRaw(raw: Record<string, string>): StoreSettings {
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
    hero: {
      eyebrow: pick(raw, "homepage.heroEyebrow", FALLBACK_HERO.eyebrow),
      title: pick(raw, "homepage.heroTitle", FALLBACK_HERO.title),
      subtitle: pick(raw, "homepage.heroSubtitle", FALLBACK_HERO.subtitle),
      ctaLabel: pick(raw, "homepage.heroCtaLabel", FALLBACK_HERO.ctaLabel),
      ctaHref: pick(raw, "homepage.heroCtaHref", FALLBACK_HERO.ctaHref),
    },
    usps: buildUsps(raw),
    social: {
      facebook: clean(raw, "social.facebook"),
      youtube: clean(raw, "social.youtube"),
      pinterest: clean(raw, "social.pinterest"),
    },
    delivery: {
      cutoffTime: raw["delivery.cutoffTime"]?.trim() || "",
      supportedCities: raw["delivery.supportedCities"]?.trim() || "",
      supportedPincodes: raw["delivery.supportedPincodes"]?.trim() || "",
      businessHours: raw["delivery.businessHours"]?.trim() || "",
      leadTimeDays: parseFloatSafe(raw["delivery.leadTimeDays"], FALLBACK.delivery.leadTimeDays),
    },
    policies: {
      returnsSummary: raw["policies.returnsSummary"]?.trim() || "",
      deliverySummary: raw["policies.deliverySummary"]?.trim() || "",
    },
    seo: {
      metaTitle: raw["seo.metaTitle"]?.trim() || "",
      metaDescription: raw["seo.metaDescription"]?.trim() || "",
      ogImage: raw["seo.ogImage"]?.trim() || "",
    },
  };
}

const SettingsContext = createContext<StoreSettings>(FALLBACK);

/**
 * `initialRaw` is the settings map fetched on the server (root layout). When present the first paint already
 * has the real announcement bar and footer (no layout shift) and the client does not refetch; when null/absent
 * the client loads them after mount as before.
 */
export function SettingsProvider({ children, initialRaw }: { children: ReactNode; initialRaw?: Record<string, string> | null }) {
  const [settings, setSettings] = useState<StoreSettings>(() => (initialRaw ? fromRaw(initialRaw) : FALLBACK));

  // A new server payload (layout re-rendered with fresher settings) replaces the state; the first render already used it.
  const seeded = useRef(initialRaw);
  useEffect(() => {
    if (initialRaw && initialRaw !== seeded.current) {
      seeded.current = initialRaw;
      setSettings(fromRaw(initialRaw));
    }
  }, [initialRaw]);

  useEffect(() => {
    if (initialRaw) return;
    let cancelled = false;
    api.getSettings()
      .then((raw) => {
        if (!cancelled) setSettings(fromRaw(raw));
      })
      .catch((err) => {
        // Fall back to built-in defaults; surface the failure in dev only.
        if (process.env.NODE_ENV !== 'production') console.warn('[settings] failed to load store settings, using fallback', err);
      });
    return () => {
      cancelled = true;
    };
  }, [initialRaw]);

  const value = useMemo(() => settings, [settings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): StoreSettings {
  return useContext(SettingsContext);
}

export function whatsappLink(phoneOrUrl: string, message?: string): string | null {
  if (!phoneOrUrl) return null;
  const trimmed = phoneOrUrl.trim();
  // A full URL is accepted only when it is exactly a wa.me link; anything else is not trusted.
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      return u.protocol === "https:" && u.hostname === "wa.me" ? trimmed : null;
    } catch {
      return null;
    }
  }
  const digits = trimmed.replace(/\D+/g, "");
  if (digits.length < 8) return null;
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

const SOCIAL_HOSTS = {
  facebook: /^((www|m|web)\.)?(facebook\.com|fb\.com|fb\.me)$/,
  youtube: /^((www|m)\.)?(youtube\.com|youtu\.be)$/,
  pinterest: /^([a-z]{2,3}\.|www\.)?pinterest\.[a-z.]{2,6}$/,
} as const;

/** Facebook / YouTube / Pinterest profile link: only an https URL on the platform's own host, else null. */
export function socialLink(kind: keyof typeof SOCIAL_HOSTS, value: string | null | undefined): string | null {
  const v = value?.trim();
  if (!v || isPlaceholderSetting(v)) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" || u.username || u.password) return null;
    return SOCIAL_HOSTS[kind].test(u.hostname.toLowerCase()) ? u.toString() : null;
  } catch {
    return null;
  }
}

export function instagramLink(value: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      return u.protocol === "https:" && /^(www\.)?instagram\.com$/.test(u.hostname) ? trimmed : null;
    } catch {
      return null;
    }
  }
  const handle = trimmed.replace(/^@+/, "");
  if (!handle) return null;
  return `https://www.instagram.com/${encodeURIComponent(handle)}`;
}

export function telLink(phone: string): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return null;
  return `tel:${trimmed.startsWith("+") ? "+" : ""}${digits}`;
}

export function mailtoLink(email: string): string | null {
  if (!email) return null;
  const address = email.replace(/[?#\s]/g, "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return null;
  return `mailto:${address}`;
}
