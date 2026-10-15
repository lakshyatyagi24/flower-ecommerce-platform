import { adminToken, apiFetch } from './api';
import { API_BASE, BASE_URL, assertNotProduction } from './env';
import { restoreSavedSettings } from './settings-guard';

/** Production API hosts that must never be baked into the storefront under test (NEXT_PUBLIC_API_BASE). */
const PRODUCTION_API = /(^|[^a-z0-9-])api\.freshpetalsindia\.com/i;

/**
 * The browser sends its API calls to whatever NEXT_PUBLIC_API_BASE was at build time, which the URL allowlist
 * cannot see. Read the storefront's pages and their scripts and refuse to run if they point at production.
 */
async function assertStorefrontTargetsLocalApi(): Promise<void> {
  const scripts = new Set<string>();
  const sources: Array<[string, string]> = [];
  for (const path of ['/', '/products', '/checkout']) {
    const html = await (await fetch(`${BASE_URL}${path}`)).text();
    sources.push([`${BASE_URL}${path}`, html]);
    for (const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)) {
      const src = new URL(m[1].replace(/&amp;/g, '&'), BASE_URL);
      if (src.origin === new URL(BASE_URL).origin) scripts.add(src.href);
    }
  }
  for (const href of [...scripts].slice(0, 80)) {
    sources.push([href, await (await fetch(href)).text()]);
  }
  for (const [where, text] of sources) {
    if (PRODUCTION_API.test(text)) {
      throw new Error(
        `The storefront at ${BASE_URL} references the production API (found in ${where}). It was built with ` +
          `NEXT_PUBLIC_API_BASE pointing at production; its browser would send writes there. Rebuild it with ` +
          `NEXT_PUBLIC_API_BASE=${API_BASE} (npm run e2e:local does this).`,
      );
    }
  }
}

/** Fails fast, with a pointed message, if the stack is not up or not safe; logs the admin in once for the run. */
export default async function globalSetup() {
  assertNotProduction();
  try {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    throw new Error(`Storefront not reachable at ${BASE_URL} (${(e as Error).message}). Start the stack: npm run e2e:local`);
  }
  try {
    await apiFetch('/settings');
  } catch (e) {
    throw new Error(`API not reachable at ${API_BASE} (${(e as Error).message}). Start the stack: npm run e2e:local`);
  }
  await assertStorefrontTargetsLocalApi();

  // Only the specs that seed coupons/settings need this; skip quietly if the admin is unavailable
  // so the browse/reset specs can still run against a stack without the seeded admin.
  try {
    await adminToken();
    // A previous run killed mid-spec may have left a temporary setting behind: put it back first.
    await restoreSavedSettings();
  } catch (e) {
    console.warn(`[e2e] admin login unavailable (${(e as Error).message}); admin-seeded specs will fail`);
  }
}
