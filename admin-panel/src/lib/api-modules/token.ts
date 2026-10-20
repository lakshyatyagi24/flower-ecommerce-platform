export const API_BASE: string =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001';

const TOKEN_KEY = 'flower_admin_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

/**
 * The session is gone (expired 12h admin token, revoked, or invalid): drop the stored token and tell the auth
 * provider, which shows a toast and returns to /login. The event carries no data (nothing sensitive is kept).
 */
export function notifyUnauthorized(): void {
  if (typeof window === 'undefined') return;
  setStoredToken(null);
  window.dispatchEvent(new CustomEvent('admin-auth:unauthorized'));
}

export function bearerHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
