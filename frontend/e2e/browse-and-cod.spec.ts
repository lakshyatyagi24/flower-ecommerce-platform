import { expect, test } from './support/fixtures';
import { cancelOrder, uniqueEmail } from './support/api';
import {
  addToBagFromPdp,
  fillContactAndDelivery,
  goToCheckout,
  openFirstProduct,
  shopper,
  trackCreatedOrders,
} from './support/storefront';

test.describe('guest browse -> cash on delivery -> track', () => {
  let orderId: number | undefined;
  const created: number[] = [];

  test.afterEach(async () => {
    // Give the stock back so the suite is re-runnable against the same database.
    for (const id of new Set([...created, ...(orderId ? [orderId] : [])])) await cancelOrder(id);
    created.length = 0;
    orderId = undefined;
  });

  test('a guest finds flowers by occasion, orders with COD and tracks the order', async ({ page }) => {
    const email = uniqueEmail('cod');
    trackCreatedOrders(page, created);

    // Home -> occasion page
    await page.goto('/');
    await page.getByRole('link', { name: /^Flowers for Birthday/ }).click();
    await expect(page).toHaveURL(/\/occasions\/birthday$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Birthday flowers' })).toBeVisible();

    // Occasion -> product page -> bag
    const productName = await openFirstProduct(page);
    const drawer = await addToBagFromPdp(page);
    await expect(drawer.getByRole('link', { name: productName })).toBeVisible();

    // Bag -> checkout as a guest
    await goToCheckout(page);
    await expect(page.getByRole('heading', { name: 'Checkout as guest' })).toBeVisible();
    await fillContactAndDelivery(page, shopper(email));
    await page.getByRole('radio', { name: /Cash on delivery/ }).check();
    await page.getByRole('button', { name: 'Place order' }).click();

    // Success: COD wording and an order id
    await expect(page).toHaveURL(/\/checkout\/success\?.*orderId=\d+/);
    await expect(page.getByRole('heading', { name: 'Order placed — pay on delivery' })).toBeVisible();
    orderId = Number(new URL(page.url()).searchParams.get('orderId'));
    expect(orderId).toBeGreaterThan(0);
    await expect(page.getByText(`#${orderId}`).first()).toBeVisible();
    await expect(page.getByText('Cash on delivery').first()).toBeVisible();

    // Track it with the order id and the email used at checkout
    await page.goto('/track-order');
    await page.getByLabel('Order ID').fill(String(orderId));
    await page.getByLabel('Email at checkout').fill(email);
    await page.getByRole('button', { name: 'Track order' }).click();
    await expect(page.getByRole('heading', { level: 1, name: `Order #${orderId}` })).toBeVisible();
    await expect(page.getByText('PENDING', { exact: true })).toBeVisible();
    await expect(page.getByText('Cash on delivery').first()).toBeVisible();
    await expect(page.getByText(productName).first()).toBeVisible();
  });
});
