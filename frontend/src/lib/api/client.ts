// Low-level API client: base URL, token storage, error type and the fetch wrapper.
// Uses NEXT_PUBLIC_API_BASE (or NEXT_PUBLIC_API_URL) and falls back to localhost:3001 in dev.

export const API_BASE: string =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' ? 'http://localhost:3001' : 'http://localhost:3001');

const TOKEN_KEY = 'flower_auth_token';

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

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export type ApiOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  cache?: RequestCache;
};

// Nest's ValidationPipe returns `message` as string[]; join those so users see
// the actual hint (e.g. "Enter a valid 10-digit Indian mobile number").
export function extractErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const m = (payload as { message: unknown }).message;
    if (typeof m === 'string') return m;
    if (Array.isArray(m) && m.length > 0 && m.every((x) => typeof x === 'string')) {
      return (m as string[]).join('. ');
    }
  }
  return `Request failed (${status})`;
}

function buildHeaders(opts: ApiOptions): Record<string, string> {
  const headers: Record<string, string> = { ...(opts.headers || {}) };
  if (opts.body !== undefined && !('Content-Type' in headers)) {
    headers['Content-Type'] = 'application/json';
  }
  if (opts.auth) {
    const token = getStoredToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function readPayload(res: Response): Promise<unknown> {
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  try {
    return isJson ? await res.json() : await res.text();
  } catch {
    return null;
  }
}

// Centralized mid-session 401 handling: an authed request whose token has
// expired/been revoked clears the stored token and notifies the app so it
// can drop the stale user and redirect to login, instead of stranding the
// user on a broken page that keeps 401-ing.
function handleUnauthorized(res: Response, opts: ApiOptions): void {
  if (res.status === 401 && opts.auth && typeof window !== 'undefined') {
    setStoredToken(null);
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }
}

export async function apiFetch<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: buildHeaders(opts),
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: opts.cache,
    signal: opts.signal,
  });
  const payload = await readPayload(res);
  if (!res.ok) {
    handleUnauthorized(res, opts);
    throw new ApiError(extractErrorMessage(payload, res.status), res.status, payload);
  }
  return payload as T;
}

/** Builds `?a=1&b=2` from the defined params ('' when none), so list calls share one query-string rule. */
export function queryString(params: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') qs.set(key, String(value));
  }
  const suffix = qs.toString();
  return suffix ? `?${suffix}` : '';
}
