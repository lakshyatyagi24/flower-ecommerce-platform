import { ADMIN_EMAIL, ADMIN_PASSWORD, API_BASE } from './env';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
  }
}

type Opts = { method?: string; body?: unknown; token?: string };

/** Minimal JSON client for the backend API. Throws ApiError on any non-2xx response. */
export async function apiFetch<T = any>(path: string, opts: Opts = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? (opts.body === undefined ? 'GET' : 'POST'),
    headers: {
      ...(opts.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    /* keep raw text */
  }
  if (!res.ok) {
    throw new ApiError(res.status, parsed, `${opts.method ?? 'GET'} ${path} -> ${res.status} ${text.slice(0, 300)}`);
  }
  return parsed as T;
}

/** Unique per call, so every run (and every retry) gets a fresh throwaway identity. */
export function uniqueEmail(prefix: string): string {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  return `e2e-${prefix}-${stamp}@e2e.example.com`;
}

export function uniqueCode(prefix = 'E2E'): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase().slice(0, 32);
}

export async function registerUser(email: string, password: string, name = 'E2E Throwaway') {
  return apiFetch<{ token: string; user: { id: number; email: string } }>('/auth/register', {
    body: { email, password, name },
  });
}

export async function login(email: string, password: string) {
  return apiFetch<{ token: string; user: { id: number; role: string } }>('/auth/login', { body: { email, password } });
}

/** Admin JWT: global-setup logs in once and shares it, so the suite stays under the login rate limit. */
export async function adminToken(): Promise<string> {
  if (process.env.E2E_ADMIN_TOKEN) return process.env.E2E_ADMIN_TOKEN;
  const { token, user } = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  if (user.role !== 'ADMIN') throw new Error(`${ADMIN_EMAIL} is not an ADMIN`);
  process.env.E2E_ADMIN_TOKEN = token;
  return token;
}

// ---- admin operations used for seeding and cleanup -------------------------------------------------------

export interface CouponInput {
  code: string;
  type: 'PERCENT' | 'FLAT';
  value: number;
  minSubtotal?: number;
  maxUses?: number | null;
}

export async function createCoupon(input: CouponInput) {
  return apiFetch<{ id: number; code: string }>('/coupons', { token: await adminToken(), body: { active: true, ...input } });
}

/** Removes a coupon; a coupon that has been used cannot be deleted (409), so it is deactivated instead. */
export async function removeCoupon(id: number): Promise<void> {
  const token = await adminToken();
  try {
    await apiFetch(`/coupons/${id}`, { method: 'DELETE', token });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return;
    await apiFetch(`/coupons/${id}`, { method: 'PUT', token, body: { active: false } });
  }
}

/** Cancels an order as admin (restocks and gives the coupon use back). Already-cancelled orders are fine. */
export async function cancelOrder(id: number): Promise<void> {
  try {
    await apiFetch(`/orders/${id}/status`, { method: 'PUT', token: await adminToken(), body: { status: 'CANCELLED' } });
  } catch (e) {
    if (e instanceof ApiError && e.status === 400) return; // illegal transition: already terminal
    throw e;
  }
}

export async function getAdminSettings(): Promise<Record<string, string>> {
  return apiFetch('/settings/admin', { token: await adminToken() });
}

export async function putSettings(values: Record<string, string>): Promise<void> {
  await apiFetch('/settings', { method: 'PUT', token: await adminToken(), body: values });
}

export async function deliveryOptions(): Promise<{ earliest: string; latest: string; blackoutDates: string[] }> {
  return apiFetch('/delivery/options');
}

/**
 * Reads the plaintext reset token for an email from the backend's test-only endpoint. That route exists only when
 * the API runs with NODE_ENV=test and ENABLE_TEST_ENDPOINTS=1 (it is impossible in production by construction).
 */
export async function lastResetToken(email: string): Promise<string> {
  const { token } = await apiFetch<{ token: string }>(`/auth/_test/last-reset-token?email=${encodeURIComponent(email)}`);
  return token;
}

/** Orders for an email, newest first (admin list; the most recent 100 are scanned). */
export async function findOrdersByEmail(email: string): Promise<Array<{ id: number; status: string }>> {
  const res = await apiFetch<any>('/orders?take=100', { token: await adminToken() });
  const rows: Array<{ id: number; status: string; customerEmail: string | null }> = Array.isArray(res) ? res : res.items ?? [];
  return rows.filter((o) => o.customerEmail?.toLowerCase() === email.toLowerCase());
}

/** A purchasable product with an exact price (e.g. 799), so money assertions do not depend on the seed catalogue. */
export async function createTestProduct(price: number): Promise<{ id: number; slug: string; name: string }> {
  const token = await adminToken();
  const categories = await apiFetch<Array<{ id: number }>>('/categories');
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  const name = `E2E Test Bloom ${price} ${stamp}`;
  return apiFetch('/products', {
    token,
    body: {
      name,
      slug: `e2e-bloom-${String(price).replace('.', '-')}-${stamp}`,
      price,
      stock: 50,
      gstRate: 0,
      active: true,
      saleMode: 'PURCHASE',
      productType: 'CUT_FLOWER',
      unit: 'stem',
      minOrderQty: 1,
      ...(categories[0] ? { categoryId: categories[0].id } : {}),
    },
  });
}

/** Deletes the product, or (when orders reference it) the API deactivates it so it disappears from the shop. */
export async function removeProduct(id: number): Promise<void> {
  try {
    await apiFetch(`/products/${id}`, { method: 'DELETE', token: await adminToken() });
  } catch (e) {
    if (!(e instanceof ApiError && e.status === 404)) throw e;
  }
}
