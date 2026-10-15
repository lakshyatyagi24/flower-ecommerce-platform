/** Central place for the environment the suite reads. */
export const BASE_URL = (process.env.E2E_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
export const API_BASE = (process.env.E2E_API_BASE || 'http://localhost:3001').replace(/\/+$/, '');

/** A valid 6-digit Indian PIN. With an empty serviceable list every PIN is accepted. */
export const E2E_PINCODE = process.env.E2E_PINCODE || '110001';

/**
 * Admin login used to seed coupons / settings. Defaults are the LOCAL seed values from
 * flower-backend/prisma/seed.js (a dev-only fixture that the seed refuses to create in
 * production). Override with E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD for any other stack.
 */
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@flowershop.local';
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin1234';

/** Hosts the suite must never run against: it creates orders, users and coupons and edits settings. */
const PRODUCTION_HOST = /(^|\.)freshpetalsindia\.com$/i;

export function assertNotProduction(): void {
  for (const [name, url] of [['E2E_BASE_URL', BASE_URL], ['E2E_API_BASE', API_BASE]] as const) {
    let host = '';
    try {
      host = new URL(url).hostname;
    } catch {
      throw new Error(`${name} is not a valid URL: ${url}`);
    }
    if (PRODUCTION_HOST.test(host)) {
      throw new Error(
        `${name} (${url}) points at production. This suite writes data and must only run against a local/staging stack.`,
      );
    }
  }
}
