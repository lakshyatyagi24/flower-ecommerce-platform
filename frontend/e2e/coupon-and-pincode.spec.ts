import { expect, test } from '@playwright/test';
import {
  cancelOrder,
  createCoupon,
  getAdminSettings,
  putSettings,
  removeCoupon,
  uniqueCode,
  uniqueEmail,
} from './support/api';
import {
  bagFirstProductAndCheckout,
  fillContactAndDelivery,
  openOrderSummary,
  rupees,
  shopper,
  summaryValue,
} from './support/storefront';

const PIN_SETTING = 'delivery.supportedPincodes';
const SERVICEABLE_PIN = '110001';
const UNSERVICEABLE_PIN = '999999';
const DISCOUNT_PERCENT = 10;

// Serial: the tests share one coupon and one temporary delivery-area setting.
test.describe.configure({ mode: 'serial' });

test.describe('serviceable PIN codes and coupons', () => {
  let originalPins: string | undefined;
  let couponId: number | undefined;
  let couponCode = '';
  const orderIds: number[] = [];

  test.beforeAll(async () => {
    // Remember the live value FIRST so afterAll can always put it back.
    originalPins = (await getAdminSettings())[PIN_SETTING] ?? '';
    await putSettings({ [PIN_SETTING]: `${SERVICEABLE_PIN}, 400001` });
    couponCode = uniqueCode('E2E');
    ({ id: couponId } = await createCoupon({ code: couponCode, type: 'PERCENT', value: DISCOUNT_PERCENT }));
  });

  test.afterAll(async () => {
    try {
      // Cancelling gives stock and the coupon use back, which also lets the coupon be deleted.
      for (const id of orderIds.splice(0)) await cancelOrder(id).catch(() => undefined);
      if (couponId) await removeCoupon(couponId).catch(() => undefined);
    } finally {
      if (originalPins !== undefined) await putSettings({ [PIN_SETTING]: originalPins });
    }
  });

  test('an unserviceable PIN blocks checkout with an inline error; a serviceable PIN goes through', async ({ page }) => {
    await bagFirstProductAndCheckout(page);
    await fillContactAndDelivery(page, shopper(uniqueEmail('pin'), UNSERVICEABLE_PIN));
    await page.getByLabel('PIN code').blur();

    const pinField = page.getByLabel('PIN code');
    await expect(page.getByText('We do not deliver to this PIN code yet.')).toBeVisible();
    await expect(pinField).toHaveAttribute('aria-invalid', 'true');

    // Submitting does not place an order: we stay on checkout and the error remains.
    await page.getByRole('button', { name: 'Place order' }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByText('We do not deliver to this PIN code yet.').first()).toBeVisible();

    // Fixing the PIN clears the error and the order is placed.
    await pinField.fill(SERVICEABLE_PIN);
    await pinField.blur();
    await expect(page.getByText('We do not deliver to this PIN code yet.')).toHaveCount(0);
    await page.getByRole('button', { name: 'Place order' }).click();
    await expect(page).toHaveURL(/\/checkout\/success\?.*orderId=\d+/);
    orderIds.push(Number(new URL(page.url()).searchParams.get('orderId')));
    await expect(page.getByRole('heading', { name: 'Order placed — pay on delivery' })).toBeVisible();
  });

  test('a valid coupon reduces the total; an invalid one shows an inline error', async ({ page }) => {
    await bagFirstProductAndCheckout(page);
    await fillContactAndDelivery(page, shopper(uniqueEmail('coupon'), SERVICEABLE_PIN));
    await openOrderSummary(page);

    const totalBefore = rupees(await summaryValue(page, /^Total$/).innerText());
    const subtotal = rupees(await summaryValue(page, /^Subtotal$/).innerText());
    await expect(page.getByTestId('checkout-discount')).toHaveCount(0);

    // Invalid code: inline error, total untouched
    await page.getByRole('button', { name: 'Have a coupon code?' }).click();
    await page.getByLabel('Coupon code').fill('NOSUCHCODE');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText(/not found|invalid/i).first()).toBeVisible();
    await expect(page.getByTestId('checkout-discount')).toHaveCount(0);
    expect(rupees(await summaryValue(page, /^Total$/).innerText())).toBe(totalBefore);

    // Valid code: discount line appears and the total drops by exactly that discount
    await page.getByLabel('Coupon code').fill(couponCode);
    await page.getByRole('button', { name: 'Apply' }).click();
    const discountRow = page.getByTestId('checkout-discount');
    await expect(discountRow).toContainText(`Discount (${couponCode})`);
    const discount = rupees(await summaryValue(page, /^Discount/).innerText());
    expect(discount).toBeGreaterThan(0);
    expect(discount).toBeCloseTo((subtotal * DISCOUNT_PERCENT) / 100, 1);
    // Total = subtotal - discount + shipping + GST (GST is charged on the discounted value, so it can drop too).
    const readRow = async (label: RegExp) => {
      const row = summaryValue(page, label);
      if ((await row.count()) === 0) return 0;
      const text = (await row.innerText()).trim();
      return text === 'Free' ? 0 : rupees(text);
    };
    const shipping = await readRow(/^Shipping$/);
    const gst = await readRow(/^GST$/);
    const totalAfter = rupees(await summaryValue(page, /^Total$/).innerText());
    expect(totalAfter).toBeCloseTo(subtotal - discount + shipping + gst, 1);
    expect(totalAfter).toBeLessThan(totalBefore);
    expect(totalBefore - totalAfter).toBeGreaterThanOrEqual(discount - 0.01);

    // The discount is honoured by the real order
    await page.getByRole('button', { name: 'Place order' }).click();
    await expect(page).toHaveURL(/\/checkout\/success\?.*orderId=\d+/);
    orderIds.push(Number(new URL(page.url()).searchParams.get('orderId')));
    await expect(page.getByTestId('order-discount')).toContainText(couponCode);
  });
});
