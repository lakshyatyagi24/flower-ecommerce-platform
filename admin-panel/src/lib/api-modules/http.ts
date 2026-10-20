import { API_BASE, bearerHeaders, notifyUnauthorized } from './token';

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

interface FetchOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
}

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

/** Throws an ApiError for a non-OK response (clearing the session on 401 when `clearOn401` is set). */
export function throwApiError(res: Response, payload: unknown, clearOn401 = true): never {
  if (res.status === 401 && clearOn401) notifyUnauthorized();
  throw new ApiError(extractErrorMessage(payload, res.status), res.status, payload);
}

function buildHeaders(opts: FetchOptions): Record<string, string> {
  const headers: Record<string, string> = { ...(opts.headers || {}) };
  if (opts.body !== undefined && !('Content-Type' in headers)) {
    headers['Content-Type'] = 'application/json';
  }
  if (opts.auth !== false) Object.assign(headers, bearerHeaders());
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

export async function apiFetch<T = unknown>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: buildHeaders(opts),
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const payload = await readPayload(res);
  // Centralized mid-session 401: clear the token and bounce the admin to
  // login from wherever the failing request originated, instead of leaving
  // them on a dashboard where every request 401s with no recovery path.
  if (!res.ok) throwApiError(res, payload, opts.auth !== false);
  return payload as T;
}

/** Appends `key=value` for each defined (non-undefined) value, as a query-string suffix ('' or '?a=b'). */
export function queryString(values: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) qs.set(key, String(value));
  }
  const suffix = qs.toString();
  return suffix ? `?${suffix}` : '';
}
