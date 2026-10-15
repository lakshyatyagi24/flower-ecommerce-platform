import { expect, test } from './support/fixtures';
import {
  cancelOrder,
  createCoupon,
  createTestProduct,
  findOrdersByEmail,
  removeCoupon,
  removeProduct,
  uniqueCode,
  uniqueEmail,
} from './support/api';
import { overrideSettings, restoreSavedSettings } from './support/settings-guard';
import {
  addToBagFromPdp,
  countOrderPosts,
  fillContactAndDelivery,
  goToCheckout,
  openOrderSummary,
  rupees,
  shopper,
  summaryValue,
  trackCreatedOrders,
} from './support/storefront';

const PIN_SETTING = 'delivery.supportedPincodes';
const SERVICEABLE_PIN = '110001';
const UNSERVICEABLE_PIN = '999999';
const DISCOUNT_PERCENT = 10;
// Deliberately not multiples of 10: the display rounds to whole rupees, the server works in paise.
const PRICES = [799, 1233];

// Serial: the tests share one coupon, two products and one temporary delivery-area setting.
test.describe.configure({ mode: 'serial' });

test.describe('serviceable PIN codes and coupons', () => {
  let couponId: number | undefined;
  let couponCode = '';
  const products: Record<number, { id: number; slug: string; name: string }> = {};
  const orderIds: number[] = [];
  const emails: string[] = [];

  test.beforeAll(async () => {
    // Original value is written to e2e/.run BEFORE the change (restored by afterAll, global-teardown, or the next run).
    await overrideSettings({ [PIN_SETTING]: `${SERVICEABLE_PIN}, 400001` });
    couponCode = uniqueCode('E2E');
    ({ id: couponId } = await createCoupon({ code: couponCode, type: 'PERCENT', value: DISCOUNT_PERCENT }));
    for (const price of PRICES) products[price] = await createTestProduct(price);
  });

  test.afterAll(async () => {
    try {
      // Safety net: any order placed with one of our emails, even if its id was never captured.
      for (const email of emails) for (const o of await findOrdersByEmail(email).catch(() => [])) orderIds.push(o.id);
      // Cancelling gives stock and the coupon use back, which also lets the coupon be deleted.
      for (const id of new Set(orderIds)) await cancelOrder(id).catch(() => undefined);
      if (couponId) await removeCoupon(couponId).catch(() => undefined);
      for (const p of Object.values(products)) await removeProduct(p.id).catch(() => undefined);
    } finally {
      await restoreSavedSettings();
    }
  });

  /** Opens the test product's page, adds it to the bag and goes to checkout. */
  async function checkoutWith(page: import('@playwright/test').Page, price: number) {
    await page.goto(`/products/${products[price].slug}`);
    await expect(page.getByRole('heading', { level: 1, name: products[price].name })).toBeVisible();
    await addToBagFromPdp(page);
    await goToCheckout(page);
  }

  test('an unserviceable PIN blocks checkout with an inline error and sends no order; a serviceable PIN goes through', async ({ page }) => {
    const email = uniqueEmail('pin');
    emails.push(email);
    trackCreatedOrders(page, orderIds);
    const posts = countOrderPosts(page);

    await checkoutWith(page, PRICES[0]);
    await fillContactAndDelivery(page, shopper(email, UNSERVICEABLE_PIN));
    await page.getByLabel('PIN code').blur();

    const pinField = page.getByLabel('PIN code');
    await expect(page.getByText('We do not deliver to this PIN code yet.')).toBeVisible();
    await expect(pinField).toHaveAttribute('aria-invalid', 'true');

    // Submitting does not place an order: we stay on checkout, the error remains, nothing was sent, none exists.
    await page.getByRole('button', { name: 'Place order' }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByText('We do not deliver to this PIN code yet.').first()).toBeVisible();
    expect(posts.count(), 'no POST /orders was attempted').toBe(0);
    expect(await findOrdersByEmail(email), 'no order exists for this email').toEqual([]);

    // Fixing the PIN clears the error and the order is placed.
    await pinField.fill(SERVICEABLE_PIN);
    await pinField.blur();
    await expect(page.getByText('We do not deliver to this PIN code yet.')).toHaveCount(0);
    await page.getByRole('button', { name: 'Place order' }).click();
    await expect(page).toHaveURL(/\/checkout\/success\?.*orderId=\d+/);
    await expect(page.getByRole('heading', { name: 'Order placed — pay on delivery' })).toBeVisible();
    expect(posts.count()).toBe(1);
    expect(await findOrdersByEmail(email)).toHaveLength(1);
  });

  test('an invalid coupon shows an inline error and leaves the total alone', async ({ page }) => {
    await checkoutWith(page, PRICES[0]);
    await fillContactAndDelivery(page, shopper(uniqueEmail('badcoupon'), SERVICEABLE_PIN));
    await openOrderSummary(page);
    const totalBefore = rupees(await summaryValue(page, /^Total$/).innerText());

    await page.getByRole('button', { name: 'Have a coupon code?' }).click();
    await page.getByLabel('Coupon code').fill('NOSUCHCODE');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText(/not found|invalid/i).first()).toBeVisible();
    await expect(page.getByTestId('checkout-discount')).toHaveCount(0);
    expect(rupees(await summaryValue(page, /^Total$/).innerText())).toBe(totalBefore);
  });

  for (const price of PRICES) {
    test(`a valid coupon reduces the total of a Rs ${price} item and the order keeps the discount`, async ({ page }) => {
      const email = uniqueEmail('coupon');
      emails.push(email);
      trackCreatedOrders(page, orderIds);

      await checkoutWith(page, price);
      await fillContactAndDelivery(page, shopper(email, SERVICEABLE_PIN));
      await openOrderSummary(page);

      const totalBefore = rupees(await summaryValue(page, /^Total$/).innerText());
      const subtotal = rupees(await summaryValue(page, /^Subtotal$/).innerText());
      expect(subtotal).toBe(price);
      await expect(page.getByTestId('checkout-discount')).toHaveCount(0);

      await page.getByRole('button', { name: 'Have a coupon code?' }).click();
      await page.getByLabel('Coupon code').fill(couponCode);
      await page.getByRole('button', { name: 'Apply' }).click();
      await expect(page.getByTestId('checkout-discount')).toContainText(`Discount (${couponCode})`);

      // The summary shows whole rupees while the server works in paise, so each displayed term may be off by up to
      // half a rupee. Compare against exact paise maths with that tolerance (never with decimal-place precision).
      const exactDiscount = Math.round(price * DISCOUNT_PERCENT) / 100; // e.g. 799 -> 79.9
      const discount = rupees(await summaryValue(page, /^Discount/).innerText());
      expect(Math.abs(discount - exactDiscount)).toBeLessThanOrEqual(0.5);

      // Total = subtotal - discount + shipping + GST (GST is on the discounted value, so it can fall too).
      const readRow = async (label: RegExp) => {
        const row = summaryValue(page, label);
        if ((await row.count()) === 0) return 0;
        const text = (await row.innerText()).trim();
        return text === 'Free' ? 0 : rupees(text);
      };
      const shipping = await readRow(/^Shipping$/);
      const gst = await readRow(/^GST$/);
      const totalAfter = rupees(await summaryValue(page, /^Total$/).innerText());
      const terms = 4; // subtotal, discount, shipping, GST; plus the displayed total itself
      expect(Math.abs(totalAfter - (subtotal - discount + shipping + gst))).toBeLessThanOrEqual(0.5 * (terms + 1));
      expect(totalAfter).toBeLessThan(totalBefore);
      expect(totalBefore - totalAfter).toBeGreaterThanOrEqual(exactDiscount - 1);

      // The discount is honoured by the real order
      await page.getByRole('button', { name: 'Place order' }).click();
      await expect(page).toHaveURL(/\/checkout\/success\?.*orderId=\d+/);
      await expect(page.getByTestId('order-discount')).toContainText(couponCode);
    });
  }
});
