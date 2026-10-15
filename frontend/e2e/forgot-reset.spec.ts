import { expect, test } from '@playwright/test';
import { ApiError, apiFetch, lastResetToken, login, registerUser, uniqueEmail } from './support/api';

const OLD_PASSWORD = 'old-password-123';
const NEW_PASSWORD = 'brand-new-password-456';

test('forgot password -> reset with emailed token -> sign in with the new password', async ({ page }) => {
  const email = uniqueEmail('reset');
  await registerUser(email, OLD_PASSWORD);

  // Request the reset link through the UI
  await page.goto('/account/forgot-password');
  await expect(page.getByRole('heading', { name: 'Forgot your password?' })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByText('If an account exists for that email, a reset link is on its way.')).toBeVisible();

  // The email is not sent in the test stack; the token comes from the test-only endpoint.
  let token = '';
  await expect
    .poll(async () => (token = await lastResetToken(email).catch(() => '')), { timeout: 10_000 })
    .toMatch(/^[0-9a-f]{64}$/);

  // Use the link exactly as the email would carry it
  await page.goto(`/account/reset-password?token=${token}`);
  await page.getByLabel(/^New password/).fill(NEW_PASSWORD);
  await page.getByLabel(/^Confirm new password/).fill(NEW_PASSWORD);
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page.getByText('Your password has been updated.')).toBeVisible();

  // The old password is dead, the new one signs in through the UI
  await expect(login(email, OLD_PASSWORD)).rejects.toMatchObject({ status: 401 });
  await page.getByRole('link', { name: 'Go to sign in' }).click();
  await expect(page).toHaveURL(/\/account\/login/);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel(/^Password/).fill(NEW_PASSWORD);
  await page.getByRole('main').getByRole('button', { name: 'Sign in' }).click();
  // A successful sign-in lands on the signed-in area (the account menu itself sits in the mobile drawer).
  await expect(page).toHaveURL(/\/account\/orders/);
  await expect(page.getByRole('heading', { level: 1, name: 'My orders' })).toBeVisible();

  // A reset link is single use
  const reuse = await apiFetch('/auth/reset-password', { body: { token, password: 'another-password-789' } }).catch((e) => e);
  expect(reuse).toBeInstanceOf(ApiError);
  expect((reuse as ApiError).status).toBe(400);
});
