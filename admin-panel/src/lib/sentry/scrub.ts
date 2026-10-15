/**
 * PII / secret scrubbing for Sentry events (storefront; server + browser).
 * Pure functions with no SDK import. An identical copy lives in the admin
 * panel (src/lib/sentry/scrub.ts) because the two apps share no code.
 *
 * Policy: request bodies, cookies, auth headers, e-mail addresses, Indian mobile
 * numbers and any query string (order ids, e-mails and reset tokens travel there)
 * never leave the device/server.
 */

export const REDACTED = "[Filtered]";

const SENSITIVE_KEY =
  /pass(word)?|pwd|secret|token|authori[sz]ation|cookie|api[-_]?key|signature|otp|credential|card|cvv|jwt|session|email|phone|mobile|address|pincode|gstin/i;

/** Keys whose value is a query string / SQL text: always dropped. */
const QUERY_KEY = /(^|[._-])(query|search|statement|sql|body)([._-]|$)/i;
/** Keys whose string value is a URL / path that may carry a query string. */
const URL_KEY = /url|href|target|origin|route|path/i;

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

/** Indian mobile numbers: optional +91/91/0 prefix, optionally grouped 5+5 (98765 43210). */
const PHONE_RE = /(?<!\d)(?:\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}(?!\d)/g;

const MAX_EXCEPTION_VALUE = 500;

export function redactString(value: string): string {
  return value
    .replace(JWT_RE, REDACTED)
    .replace(BEARER_RE, `Bearer ${REDACTED}`)
    .replace(EMAIL_RE, REDACTED)
    .replace(PHONE_RE, REDACTED)
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
    if (SENSITIVE_KEY.test(k) || QUERY_KEY.test(k)) out[k] = REDACTED;
    else if (typeof v === "string" && URL_KEY.test(k)) out[k] = stripQuery(v);
    else out[k] = redactDeep(v, depth + 1);
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

/** Prisma-style errors embed call arguments after "invocation:"; also cap very long values. */
export function scrubExceptionValue(value: string): string {
  const cut = value.search(/invocation:/i);
  let v = cut >= 0 ? `${value.slice(0, cut)}invocation: ${REDACTED}` : value;
  v = redactString(v);
  return v.length > MAX_EXCEPTION_VALUE ? `${v.slice(0, MAX_EXCEPTION_VALUE)}...` : v;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function scrubSpan(span: Record<string, any>): Record<string, any> {
  const s = { ...span };
  if (typeof s.description === "string") s.description = stripQuery(s.description);
  if (typeof s.name === "string") s.name = stripQuery(s.name);
  if (s.data) s.data = redactDeep(s.data);
  if (s.attributes) s.attributes = redactDeep(s.attributes);
  return s;
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
    if (typeof ex.value === "string") ex.value = scrubExceptionValue(ex.value);
  }
  if (typeof e.transaction === "string") e.transaction = stripQuery(e.transaction);
  if (e.extra) e.extra = redactDeep(e.extra);
  if (e.contexts) e.contexts = redactDeep(e.contexts);
  if (e.tags) e.tags = redactDeep(e.tags);
  if (Array.isArray(e.spans)) e.spans = e.spans.map(scrubSpan);
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
