import { isPlaceholderSetting } from "./parse";

const HTTP_URL = /^https?:\/\//i;

/** The URL when it parses as https on an accepted host, else null. */
function httpsUrlOnHost(value: string, hostOk: (hostname: string) => boolean): string | null {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && hostOk(u.hostname) ? value : null;
  } catch {
    return null;
  }
}

export function whatsappLink(phoneOrUrl: string, message?: string): string | null {
  if (!phoneOrUrl) return null;
  const trimmed = phoneOrUrl.trim();
  // A full URL is accepted only when it is exactly a wa.me link; anything else is not trusted.
  if (HTTP_URL.test(trimmed)) return httpsUrlOnHost(trimmed, (h) => h === "wa.me");
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
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (HTTP_URL.test(trimmed)) return httpsUrlOnHost(trimmed, (h) => /^(www\.)?instagram\.com$/.test(h));
  const handle = trimmed.replace(/^@+/, "");
  return handle ? `https://www.instagram.com/${encodeURIComponent(handle)}` : null;
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
