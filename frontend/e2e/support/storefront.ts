import { expect, type Page } from '@playwright/test';
import { E2E_PINCODE } from './env';

export interface ShopperDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pin: string;
}

export function shopper(email: string, pin = E2E_PINCODE): ShopperDetails {
  return {
    name: 'E2E Shopper',
    email,
    phone: '9876543210',
    address: '12 Test Lane, Connaught Place',
    city: 'New Delhi',
    pin,
  };
}

/** Opens the first product on a catalogue page (an occasion or collection) and returns its name. */
export async function openFirstProduct(page: Page): Promise<string> {
  const card = page.getByRole('article').first();
  await expect(card).toBeVisible();
  const name = (await card.getByRole('heading').first().innerText()).trim();
  await card.getByRole('link').first().click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
  return name;
}

/** Adds the product on the current PDP to the bag; the bag drawer opens by itself. */
export async function addToBagFromPdp(page: Page) {
  await page.getByRole('button', { name: 'Add to bag' }).click();
  const drawer = page.getByRole('dialog', { name: /Your bag/ });
  await expect(drawer).toBeVisible();
  return drawer;
}

/** Moves from the open bag drawer to the checkout page. */
export async function goToCheckout(page: Page) {
  await page.getByRole('dialog', { name: /Your bag/ }).getByRole('link', { name: 'Checkout' }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Checkout' })).toBeVisible();
}

/**
 * Fills the contact and delivery section. The delivery date is set to the EARLIEST date the date input
 * allows (its `min`), read from the page rather than computed, so the cut-off time never makes this flaky.
 * Returns the chosen date (YYYY-MM-DD).
 */
export async function fillContactAndDelivery(page: Page, who: ShopperDetails): Promise<string> {
  await page.getByLabel('Full name').fill(who.name);
  await page.getByLabel('Email').first().fill(who.email);
  await page.getByLabel('Phone').fill(who.phone);
  await page.getByLabel('Address').fill(who.address);
  await page.getByLabel('City').fill(who.city);
  await page.getByLabel('PIN code').fill(who.pin);
  const date = page.getByLabel('Delivery date');
  const min = await date.getAttribute('min');
  expect(min, 'delivery date input has a min').toMatch(/^\d{4}-\d{2}-\d{2}$/);
  await date.fill(min!);
  await expect(date).toHaveValue(min!);
  return min!;
}

/** On small screens the order summary is a collapsed disclosure; open it so its lines are visible. */
export async function openOrderSummary(page: Page) {
  const toggle = page.getByRole('button', { name: /^Order summary/ });
  if (await toggle.isVisible()) {
    if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  }
}

/** The <dd> value of the order-summary row whose <dt> matches `label` (use an anchored RegExp for exact labels). */
export function summaryValue(page: Page, label: RegExp) {
  return page
    .getByRole('complementary', { name: 'Order summary' })
    .locator('dt', { hasText: label })
    .locator('xpath=following-sibling::dd[1]');
}

/** Rupee text such as "Rs 1,234.50" or "-Rs 95" -> 1234.5 / 95 (sign dropped: callers compare magnitudes). */
export function rupees(text: string): number {
  const n = Number(text.replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n)) throw new Error(`Not a rupee amount: "${text}"`);
  return n;
}

/** Opens the catalogue, picks the first product, adds it to the bag and proceeds to checkout. */
export async function bagFirstProductAndCheckout(page: Page): Promise<string> {
  await page.goto('/products');
  const name = await openFirstProduct(page);
  await addToBagFromPdp(page);
  await goToCheckout(page);
  return name;
}
