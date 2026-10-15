import { adminToken, apiFetch } from './api';
import { API_BASE, BASE_URL, assertNotProduction } from './env';

/** Fails fast, with a pointed message, if the stack is not up; logs the admin in once for the whole run. */
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
  // Only the specs that seed coupons/settings need this; skip quietly if the admin is unavailable
  // so the browse/reset specs can still run against a stack without the seeded admin.
  try {
    await adminToken();
  } catch (e) {
    console.warn(`[e2e] admin login unavailable (${(e as Error).message}); admin-seeded specs will fail`);
  }
}
