import { expect, test } from './support/fixtures';

test.describe('SEO smoke', () => {
  test('robots.txt allows the shop, hides checkout and points at the sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/^User-Agent: \*/im);
    expect(body).toMatch(/^Disallow: \/checkout/im);
    expect(body).toMatch(/^Sitemap: https?:\/\/.+\/sitemap\.xml/im);
  });

  test('sitemap.xml is served as XML and lists product pages', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/xml/);
    const body = await res.text();
    expect(body).toContain('<urlset');
    expect(body).toMatch(/<loc>[^<]*\/products\/[^<]+<\/loc>/);
  });

  test('a product page carries Product JSON-LD', async ({ page }) => {
    await page.goto('/products');
    const card = page.getByRole('article').first();
    const name = (await card.getByRole('heading').first().innerText()).trim();
    await card.getByRole('link').first().click();
    // Wait for the product page itself (the catalogue also has an h1), then read its JSON-LD.
    await expect(page).toHaveURL(/\/products\/[^/?#]+/);
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = blocks.flatMap((b) => {
      const parsed = JSON.parse(b);
      return (Array.isArray(parsed) ? parsed : [parsed]).map((d) => d['@type']);
    });
    expect(types).toContain('Product');
  });

  test('an unknown product is a real 404', async ({ page }) => {
    const res = await page.goto('/products/definitely-not-a-real-product-slug');
    expect(res?.status()).toBe(404);
  });
});
