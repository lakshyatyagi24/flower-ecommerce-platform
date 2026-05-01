"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
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
  eyebrow: "Mandi-fresh every morning",
  title: "Fresh-cut flowers, delivered the same day.",
  subtitle:
    "Roses, orchids, lilies, carnations, sunflowers and more — sourced directly from the mandi. Bulk pricing for corporates, custom bouquets and arrangements on enquiry.",
  ctaLabel: "Shop bouquets",
  ctaHref: "/products",
};

const FALLBACK_USPS: StoreUSP[] = [
  { title: "Freshness guarantee", body: "Farm-fresh blooms dispatched within 24–48 hrs of harvest — vibrant, fragrant, and long-lasting." },
  { title: "Same-day delivery", body: "Order before 3 PM for same-day delivery across 8+ major Indian cities." },
  { title: "Easy replacement", body: "Flowers arrived damaged? Contact us within 48 hours for a free replacement or full refund." },
  { title: "Made for occasions", body: "Birthdays, anniversaries, weddings or sympathy — we craft for every moment." },
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

function parseFloatSafe(v: string | undefined, fallback: number): number {
  if (!v) return fallback;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function pick(raw: Record<string, string>, key: string, fallback: string): string {
  const v = raw[key]?.trim();
  return v ? v : fallback;
}

function buildUsps(raw: Record<string, string>): StoreUSP[] {
  const items: StoreUSP[] = [];
  for (let i = 1; i <= 4; i += 1) {
    const title = raw[`trust.usp${i}Title`]?.trim();
    const body = raw[`trust.usp${i}Body`]?.trim();
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
    name: raw["store.name"]?.trim() || FALLBACK.name,
    email: raw["store.email"]?.trim() || "",
    phone: raw["store.phone"]?.trim() || "",
    whatsapp: raw["store.whatsapp"]?.trim() || raw["store.phone"]?.trim() || "",
    address: raw["store.address"]?.trim() || "",
    instagram: raw["store.instagram"]?.trim() || "",
    gstin: raw["store.gstin"]?.trim() || "",
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
      facebook: raw["social.facebook"]?.trim() || "",
      youtube: raw["social.youtube"]?.trim() || "",
      pinterest: raw["social.pinterest"]?.trim() || "",
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

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    api.getSettings()
      .then((raw) => {
        if (!cancelled) setSettings(fromRaw(raw));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => settings, [settings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): StoreSettings {
  return useContext(SettingsContext);
}

export function whatsappLink(phoneOrUrl: string, message?: string): string | null {
  if (!phoneOrUrl) return null;
  const trimmed = phoneOrUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D+/g, "");
  if (digits.length < 8) return null;
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function instagramLink(value: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, "");
  return `https://www.instagram.com/${handle}`;
}

export function telLink(phone: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : null;
}

export function mailtoLink(email: string): string | null {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return `mailto:${email}`;
}
