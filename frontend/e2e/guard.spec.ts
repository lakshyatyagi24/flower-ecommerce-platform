import { test } from './support/fixtures';

// Proves the request firewall in support/fixtures.ts works: a browser request to the production domain is aborted
// (nothing leaves the machine) AND fails the test. `test.fail()` makes this spec pass only if that failure happens.
test('the browser firewall blocks and flags requests to production', async ({ page }) => {
  test.fail();
  await page.goto('https://freshpetalsindia.com/', { timeout: 5_000 }).catch(() => undefined);
});
