/**
 * Hostname ALLOWLIST for the e2e suite. The suite creates orders, users and coupons and edits delivery settings,
 * so it may only talk to a local stack. Pure functions (no Playwright imports) so they can be unit-tested by vitest.
 */

/** Hosts that are never acceptable, even with E2E_ALLOW_HOST: production domain and the production VPS. */
const FORBIDDEN_HOSTS = ['freshpetalsindia.com', '162.35.27.175'];

/** Lower-cases and strips trailing dots ("Example.COM." -> "example.com"). Returns null for anything unusable. */
export function normaliseHost(raw: string): string | null {
  let h = raw.trim().toLowerCase();
  while (h.endsWith('.')) h = h.slice(0, -1);
  if (!h || h.includes('%') || /\s/.test(h)) return null;
  return h;
}

function isForbidden(host: string): boolean {
  return FORBIDDEN_HOSTS.some((f) => host === f || host.endsWith(`.${f}`));
}

/**
 * True when `url` (absolute http/https URL) points at an allowed host:
 *   localhost, 127.0.0.1, [::1], *.localhost, *.test, or exactly the host in `allowHost` (E2E_ALLOW_HOST).
 * Rejects percent-encoded hosts (`freshpetalsindia%2ecom`), credentials in the URL, non-http(s) schemes,
 * every IP literal other than loopback, and the production domain/VPS no matter what `allowHost` says.
 */
export function isAllowedUrl(url: string, allowHost?: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  if (parsed.username || parsed.password) return false;
  // The URL parser decodes %2e in the host, which would hide a lookalike: judge the raw authority too.
  const authority = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]*)/i.exec(url.trim())?.[1] ?? '';
  if (authority.includes('%')) return false;

  const host = normaliseHost(parsed.hostname);
  if (!host || isForbidden(host)) return false;

  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return true;
  if (/^\[.*\]$/.test(host)) return false; // other IPv6 literals
  if (/^\d+(\.\d+){0,3}$/.test(host)) return allowHostMatches(host, allowHost); // other IPv4 literals
  if (host.endsWith('.localhost') || host.endsWith('.test')) return true;
  return allowHostMatches(host, allowHost);
}

function allowHostMatches(host: string, allowHost?: string): boolean {
  if (!allowHost) return false;
  const want = normaliseHost(allowHost);
  return want !== null && !isForbidden(want) && want === host;
}

export function assertAllowedUrl(name: string, url: string, allowHost = process.env.E2E_ALLOW_HOST): void {
  if (!isAllowedUrl(url, allowHost)) {
    throw new Error(
      `${name} (${url}) is not an allowed e2e target. The suite writes data and only runs against localhost, 127.0.0.1, ` +
        `[::1], *.localhost or *.test. A non-local staging host needs an explicit E2E_ALLOW_HOST=<exact host>; ` +
        `production (freshpetalsindia.com) is always refused.`,
    );
  }
}
