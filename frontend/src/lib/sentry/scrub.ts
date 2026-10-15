/**
 * PII / secret scrubbing for Sentry events (storefront; server + browser).
 * Pure functions with no SDK import. An identical copy lives in the admin
 * panel (src/lib/sentry/scrub.ts) because the two apps share no code.
 *
 * Policy: request bodies, cookies, auth headers, e-mail addresses and any
 * query string (order ids, e-mails and reset tokens travel there) never leave
 * the device/server.
 */

export const REDACTED = "[Filtered]";

const SENSITIVE_KEY =
  /pass(word)?|pwd|secret|token|authori[sz]ation|cookie|api[-_]?key|signature|otp|credential|card|cvv|jwt|session|email|phone|mobile|address|pincode|gstin/i;

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "proxy-authorization",
  "x-api-key",
  "x-forwarded-for",
  "x-real-ip",
]);

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const BEARER_RE = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const JWT_RE = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/g;
const QUERY_SECRET_RE = /([?&](?:[^=&#]*(?:token|key|secret|password|email|code|signature|otp)[^=&#]*)=)[^&#]*/gi;

export function redactString(value: string): string {
  return value
    .replace(JWT_RE, REDACTED)
    .replace(BEARER_RE, `Bearer ${REDACTED}`)
    .replace(EMAIL_RE, REDACTED)
    .replace(QUERY_SECRET_RE, `$1${REDACTED}`);
}

/** Drops the query string and fragment of a URL (keeps origin + path). */
export function stripQuery(url: string): string {
  return redactString(url.split(/[?#]/)[0]);
}

export function redactDeep(value: unknown, depth = 0): unknown {
  if (typeof value === "string") return redactString(value);
  if (value === null || typeof value !== "object") return value;
  if (depth > 6) return REDACTED;
  if (Array.isArray(value)) return value.map((v) => redactDeep(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SENSITIVE_KEY.test(k) ? REDACTED : redactDeep(v, depth + 1);
  }
  return out;
}

function scrubHeaders(headers: unknown): Record<string, unknown> | undefined {
  if (!headers || typeof headers !== "object") return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(headers as Record<string, unknown>)) {
    out[k] = SENSITIVE_HEADERS.has(k.toLowerCase()) || SENSITIVE_KEY.test(k) ? REDACTED : redactDeep(v);
  }
  return out;
}

/** Loose structural type: keeps this module free of SDK types. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyEvent = Record<string, any>;

export function scrubEvent<T extends AnyEvent>(event: T): T {
  const e = event as AnyEvent;

  if (e.request) {
    const r = e.request;
    delete r.data; // request bodies: never sent
    delete r.cookies;
    r.headers = scrubHeaders(r.headers);
    if (typeof r.url === "string") r.url = stripQuery(r.url);
    if (r.query_string) r.query_string = REDACTED;
  }

  if (e.user) e.user = e.user.id ? { id: String(e.user.id) } : undefined;
  delete e.server_name;

  if (typeof e.message === "string") e.message = redactString(e.message);
  if (e.logentry?.message) e.logentry.message = redactString(e.logentry.message);
  for (const ex of e.exception?.values ?? []) {
    if (typeof ex.value === "string") ex.value = redactString(ex.value);
  }
  if (typeof e.transaction === "string") e.transaction = stripQuery(e.transaction);
  if (e.extra) e.extra = redactDeep(e.extra);
  if (e.contexts) e.contexts = redactDeep(e.contexts);
  if (e.tags) e.tags = redactDeep(e.tags);
  if (Array.isArray(e.breadcrumbs)) {
    e.breadcrumbs = e.breadcrumbs.map((b: AnyEvent) => {
      const data = b.data ? (redactDeep(b.data) as AnyEvent) : b.data;
      if (data && typeof data.url === "string") data.url = stripQuery(data.url);
      if (data && typeof data.to === "string") data.to = stripQuery(data.to);
      if (data && typeof data.from === "string") data.from = stripQuery(data.from);
      return { ...b, message: typeof b.message === "string" ? redactString(b.message) : b.message, data };
    });
  }
  return event;
}

/** Framework control-flow "errors" and other known noise (matched against the message/name). */
export const IGNORED_ERRORS: Array<string | RegExp> = [
  /NEXT_REDIRECT/,
  /NEXT_NOT_FOUND/,
  /NEXT_HTTP_ERROR_FALLBACK/,
  /ResizeObserver loop/,
  /Non-Error promise rejection/,
  /AbortError/,
  /ECONNRESET/,
  /Load failed/,
  /Failed to fetch/,
  /NetworkError when attempting to fetch/,
];

/** Third-party / extension scripts whose errors are not ours. */
export const DENY_URLS: RegExp[] = [
  /extensions\//i,
  /^chrome(-extension)?:\/\//i,
  /^moz-extension:\/\//i,
  /^safari(-web)?-extension:\/\//i,
  /checkout\.razorpay\.com/i,
  /api\.razorpay\.com/i,
  /googletagmanager\.com/i,
  /google-analytics\.com/i,
];

/** Events caused by an HTTP status < 500 surfaced as an error (401/403/404/429 ...). */
export function isExpectedClientError(original: unknown): boolean {
  if (!original || typeof original !== "object") return false;
  const o = original as { status?: unknown; statusCode?: unknown };
  const status = typeof o.status === "number" ? o.status : typeof o.statusCode === "number" ? o.statusCode : undefined;
  return status !== undefined && status >= 400 && status < 500;
}
