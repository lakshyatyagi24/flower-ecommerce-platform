import { defineConfig, devices } from '@playwright/test';

/**
 * Storefront e2e. Runs against an already-running stack (see e2e/README.md and
 * e2e/run-local.mjs). E2E_BASE_URL selects the storefront under test; the
 * specs also talk to the backend API directly (E2E_API_BASE, default
 * http://localhost:3001). NEVER point this at production: the suite creates
 * orders, coupons and users and edits delivery settings.
 */
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts/,
  outputDir: './test-results',
  // Shared database and shared global settings: one test at a time, in file order.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  globalSetup: './e2e/support/global-setup.ts',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // The backend's date rules are in India time; keep the browser on the same clock as the shop.
    timezoneId: 'Asia/Kolkata',
    locale: 'en-IN',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile-375',
      testIgnore: /seo-smoke\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
  ],
});
