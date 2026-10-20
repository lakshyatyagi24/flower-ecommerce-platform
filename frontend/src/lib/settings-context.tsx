"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { api } from "./api";
import { fromRaw } from "./settings/parse";
import { FALLBACK, type StoreSettings } from "./settings/types";

// The types, parsing and link helpers live in ./settings/*; they are re-exported here so every existing
// `@/lib/settings-context` import keeps working.
export type {
  StoreDelivery,
  StoreHero,
  StorePolicies,
  StoreSeo,
  StoreSettings,
  StoreSocial,
  StoreUSP,
} from "./settings/types";
export { isPlaceholderSetting } from "./settings/parse";
export { instagramLink, mailtoLink, socialLink, telLink, whatsappLink } from "./settings/links";

const SettingsContext = createContext<StoreSettings>(FALLBACK);

/** A new server payload (layout re-rendered with fresher settings) replaces the state; the first render already used it. */
function useServerSettings(initialRaw: Record<string, string> | null | undefined) {
  const [settings, setSettings] = useState<StoreSettings>(() => (initialRaw ? fromRaw(initialRaw) : FALLBACK));
  const seeded = useRef(initialRaw);
  useEffect(() => {
    if (initialRaw && initialRaw !== seeded.current) {
      seeded.current = initialRaw;
      setSettings(fromRaw(initialRaw));
    }
  }, [initialRaw]);

  // Without a server payload, load the settings after mount.
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
  return settings;
}

/**
 * `initialRaw` is the settings map fetched on the server (root layout). When present the first paint already
 * has the real announcement bar and footer (no layout shift) and the client does not refetch; when null/absent
 * the client loads them after mount as before.
 */
export function SettingsProvider({ children, initialRaw }: { children: ReactNode; initialRaw?: Record<string, string> | null }) {
  const settings = useServerSettings(initialRaw);
  const value = useMemo(() => settings, [settings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): StoreSettings {
  return useContext(SettingsContext);
}
