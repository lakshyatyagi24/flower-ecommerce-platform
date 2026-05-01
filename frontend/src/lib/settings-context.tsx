"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { api } from "./api";

export type StoreSettings = {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  instagram: string;
  gstin: string;
  shippingFlatRate: number;
  shippingFreeThreshold: number;
};

const FALLBACK: StoreSettings = {
  name: "Fresh Petals India",
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  instagram: "",
  gstin: "",
  shippingFlatRate: 99,
  shippingFreeThreshold: 1499,
};

function parseFloatSafe(v: string | undefined, fallback: number): number {
  if (!v) return fallback;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function fromRaw(raw: Record<string, string>): StoreSettings {
  return {
    name: raw["store.name"]?.trim() || FALLBACK.name,
    email: raw["store.email"]?.trim() || "",
    phone: raw["store.phone"]?.trim() || "",
    whatsapp: raw["store.whatsapp"]?.trim() || raw["store.phone"]?.trim() || "",
    address: raw["store.address"]?.trim() || "",
    instagram: raw["store.instagram"]?.trim() || "",
    gstin: raw["store.gstin"]?.trim() || "",
    shippingFlatRate: parseFloatSafe(raw["shipping.flatRate"], FALLBACK.shippingFlatRate),
    shippingFreeThreshold: parseFloatSafe(raw["shipping.freeThreshold"], FALLBACK.shippingFreeThreshold),
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
