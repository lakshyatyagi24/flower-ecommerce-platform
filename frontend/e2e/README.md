# Storefront end-to-end tests (Playwright)

Real-browser tests of the storefront against a real backend and database.

| Spec | What it proves |
| --- | --- |
| `browse-and-cod.spec.ts` | home -> occasion -> product -> bag drawer -> guest checkout (earliest delivery date, cash on delivery) -> success page with order id -> track the order by id + email (PENDING, Cash on delivery) |
| `forgot-reset.spec.ts` | register a throwaway user (API) -> request a reset (UI) -> read the token from the test endpoint -> reset (UI) -> old password rejected, sign in with the new one (UI), link is single use |
| `coupon-and-pincode.spec.ts` | with a restricted serviceable-PIN list: an unserviceable PIN shows the inline error and blocks the order, a serviceable one passes; invalid coupon shows an inline error, a valid coupon adds a discount line and lowers the total, and the order records the discount |
| `seo-smoke.spec.ts` | `robots.txt`, `sitemap.xml`, `Product` JSON-LD on a product page, unknown product is a real 404 |

Projects: `chromium` (desktop) and `mobile-375` (375 px viewport, touch). `workers: 1`, because the specs share one
database and one set of global settings. The mobile project skips the SEO spec (viewport-independent).

## One command (local)

```bash
cd flower-ecommerce-platform/frontend
npm run e2e:local                                   # everything
npm run e2e:local -- e2e/forgot-reset.spec.ts       # one spec (extra args go to `playwright test`)
npm run e2e:local -- --project=chromium
npm run e2e:local -- --skip-build                   # reuse the existing backend dist/ and frontend .next/
```

`e2e/run-local.mjs` (Node only, works on Windows, macOS and Linux) does, in order:

1. Checks ports 3000 and 3001 are free (it never adopts a server it did not start) and that the database URL is local.
2. Database: reuses Postgres if the port is open; otherwise starts the embedded Postgres in `E2E_PG_EMBED_DIR`
   (a folder with a `start.mjs`, see below).
3. Backend: `nest build`, `prisma migrate deploy`, `node prisma/seed.js` (idempotent), then starts it with
   `NODE_ENV=test ENABLE_TEST_ENDPOINTS=1`, a random `JWT_SECRET`, `PORT=3001`, and mail, Razorpay and Cloudinary
   switched off. It probes `GET /auth/_test/last-reset-token` to confirm the test endpoint is mounted.
4. Storefront: `next build` (with `NEXT_PUBLIC_API_BASE` and `API_BASE_INTERNAL` pointing at the backend), `next start` on 3000.
5. `playwright test`, with `E2E_BASE_URL` / `E2E_API_BASE` set.
6. Stops everything it started (also on failure, Ctrl+C or crash) and exits with the test result. It only ever stops
   the process trees of children it spawned itself (never by name or command-line match); the embedded Postgres is
   stopped with `pg_ctl stop -m fast` first, and on POSIX services get SIGTERM then SIGKILL. A database that was
   already running is left running. Service logs are in `e2e/.run/*.log` (git-ignored).

### Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `E2E_DATABASE_URL` | `postgresql://postgres:pw@localhost:5433/flower` | local database only; the script refuses non-local hosts |
| `E2E_PG_EMBED_DIR` | unset | folder with `start.mjs` booting an embedded Postgres on the URL's port (not a drive root or your home folder) |
| `E2E_PG_DATA_DIR` | `<E2E_PG_EMBED_DIR>/pgdata` | that Postgres' data directory (graceful stop) |
| `E2E_ALLOW_DB_PORT` | unset | `1` allows a local database on port 5432 (refused by default) |
| `E2E_ALLOW_HOST` | unset | exact non-local host to allow as a target (see below) |
| `E2E_BACKEND_DIR` | `../../flower-backend` | backend checkout |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | the local seed admin (`prisma/seed.js` dev defaults) | admin login used by the specs to create coupons and edit settings |
| `E2E_JWT_SECRET` | random per run | backend JWT secret (>= 32 chars) |
| `E2E_PINCODE` | `110001` | PIN used by the browse spec (any valid 6-digit PIN works while the serviceable list is empty) |

The embedded Postgres used on the development machine is a tiny `embedded-postgres` wrapper:

```js
// start.mjs  (npm i embedded-postgres in the same folder)
import EmbeddedPostgres from 'embedded-postgres';
import fs from 'fs';
const dir = './pgdata';
const pg = new EmbeddedPostgres({ databaseDir: dir, user: 'postgres', password: 'pw', port: 5433, persistent: true });
const fresh = !fs.existsSync(dir + '/PG_VERSION');
if (fresh) await pg.initialise();
await pg.start();
if (fresh) await pg.createDatabase('flower');
console.log('PG READY on 5433');
setInterval(() => {}, 1 << 30);
```

Any Postgres 14+ works: start one on 5433 with a database named `flower` (or point `E2E_DATABASE_URL` anywhere local).
Do not point the suite at a database you care about: it creates and cancels orders, users and coupons.

## Running the pieces yourself

```bash
# backend (flower-backend)
NODE_ENV=test ENABLE_TEST_ENDPOINTS=1 JWT_SECRET=<32+ chars> DATABASE_URL=... PORT=3001 node dist/src/main.js
# storefront (frontend): the API base is baked in at build time
NEXT_PUBLIC_API_BASE=http://localhost:3001 API_BASE_INTERNAL=http://localhost:3001 npm run build && npm run start
# tests
npm run e2e
```

`npm run e2e` expects the stack to be up and fails fast with a clear message if it is not.

## Targets, `E2E_BASE_URL` and the safety guards (Task 5.8)

`playwright.config.ts` takes the storefront URL from `E2E_BASE_URL` (default `http://localhost:3000`) and the specs call
the backend directly at `E2E_API_BASE` (default `http://localhost:3001`).

**The suite writes data** (guest orders, users, coupons, test products, and a temporary change to
`delivery.supportedPincodes`) and cleans up after itself. It is for a local stack only:

- Allowed hosts (an allowlist, checked for both URLs by `support/host-guard.ts`): `localhost`, `127.0.0.1`, `[::1]`,
  `*.localhost`, `*.test`. Hostnames are lower-cased and trailing dots stripped; percent-encoded hosts, credentials in
  the URL, non-http(s) schemes and every other IP literal are refused.
- Anything else needs an explicit opt-in naming the exact host, e.g. `E2E_ALLOW_HOST=qa.internal.example`, and is for
  a disposable QA stack you own. **`freshpetalsindia.com` (any subdomain) and the production VPS IP are refused
  even with `E2E_ALLOW_HOST`.** Task 5.8 will use a separate read-only smoke spec for production.
- Browser guard: every spec uses the `test` from `support/fixtures.ts`, which aborts any browser request to a
  non-allowlisted host (and anything matching `freshpetalsindia.com`) and fails the test if one was attempted.
- Build guard: `global-setup.ts` reads the storefront's pages and scripts and refuses to run if they reference
  `api.freshpetalsindia.com` (a build made with the production `NEXT_PUBLIC_API_BASE`, whose browser would send its
  writes there).
- `npm run e2e:local` additionally refuses a database on port 5432 (unless `E2E_ALLOW_DB_PORT=1`) or on a non-local host.

Example for a disposable QA stack that is not on localhost:

```bash
E2E_ALLOW_HOST=qa.internal.example E2E_BASE_URL=https://qa.internal.example E2E_API_BASE=https://qa.internal.example:3001 E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... npm run e2e
```

The `E2E_ALLOW_HOST` opt-in matches ONE exact host, so a storefront and API on different hosts cannot both be allowed
that way: keep them on one host (different ports) or run the stack locally.

- `forgot-reset.spec.ts` needs the backend test endpoint, which exists only with `NODE_ENV=test` and
  `ENABLE_TEST_ENDPOINTS=1`. Any stack not started that way fails that spec by design (`--grep-invert "forgot password"`).
- The coupon spec needs an admin login and a backend whose delivery settings it may edit.

### CI artifacts contain secrets (Task 5.6)

Playwright traces and `e2e/.run/backend.log` contain reset tokens, the session JWTs and the admin password the run used.
Never upload `test-results/`, `playwright-report/` or `e2e/.run/` from a CI job that uses real credentials; in CI they
are only acceptable because the stack, database and credentials are throwaway and discarded with the job.

## Test-only backend endpoint (why it is safe)

`GET /auth/_test/last-reset-token?email=` returns the plaintext token of the most recent reset requested for that email
(404 otherwise). It lives in `TestSupportModule`, which `AppModule` imports **only** when `NODE_ENV=test` and
`ENABLE_TEST_ENDPOINTS=1`; otherwise the route does not exist. The API refuses to boot when `NODE_ENV=production` and
`ENABLE_TEST_ENDPOINTS` is set at all. The token is captured in memory at generation time through an optional hook;
the stored token is still the SHA-256 hash only.

## Notes on how the specs stay stable

- Accessible locators (`getByRole`, `getByLabel`) throughout; the only test ids are the app's own `checkout-discount`
  and `order-discount`.
- Delivery date: the earliest date is read from the date input's `min`, so the cut-off time cannot flip a run.
- Re-runnable: every run uses fresh emails, coupon codes and test products (exact prices 799 and 1233, so money
  assertions do not depend on the seed). Order ids are recorded the moment `POST /orders` answers. Orders are cancelled
  through the admin API (this restocks and returns the coupon use), then the coupon is deleted (deactivated if the
  delete is refused) and the test products removed (deactivated by the API if an order references them). The original
  PIN setting is saved to `e2e/.run/settings-original.json` BEFORE it is changed and restored in `afterAll`, in
  Playwright's global teardown, and at the start of the next run if a run was killed.
- Rate limits: the API throttles `login` to 10/min, `forgot-password` to 5/min and `register` to 10/min per IP
  (in memory, reset when the backend restarts). A full run uses about 5 logins, 2 reset requests and 2 registrations.
  Repeated runs against one long-lived backend within a minute can trip them; `npm run e2e:local` restarts the backend
  every run.
