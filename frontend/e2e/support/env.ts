import { assertAllowedUrl } from './host-guard';

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

/** Throws unless both targets are allowlisted hosts (see host-guard.ts). Also runs when this module is imported. */
export function assertNotProduction(): void {
  assertAllowedUrl('E2E_BASE_URL', BASE_URL);
  assertAllowedUrl('E2E_API_BASE', API_BASE);
}

assertNotProduction();
