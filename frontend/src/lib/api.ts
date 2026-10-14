// Centralized API client for the storefront.
// Uses NEXT_PUBLIC_API_BASE (or NEXT_PUBLIC_API_URL) and falls back to localhost:3001 in dev.

export const API_BASE: string =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' ? 'http://localhost:3001' : 'http://localhost:3001');

const TOKEN_KEY = 'flower_auth_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export type ApiOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  cache?: RequestCache;
};

// Nest's ValidationPipe returns `message` as string[]; join those so users see
// the actual hint (e.g. "Enter a valid 10-digit Indian mobile number").
export function extractErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const m = (payload as { message: unknown }).message;
    if (typeof m === 'string') return m;
    if (Array.isArray(m) && m.length > 0 && m.every((x) => typeof x === 'string')) {
      return (m as string[]).join('. ');
    }
  }
  return `Request failed (${status})`;
}

export async function apiFetch<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers: Record<string, string> = { ...(opts.headers || {}) };
  if (opts.body !== undefined && !('Content-Type' in headers)) {
    headers['Content-Type'] = 'application/json';
  }
  if (opts.auth) {
    const token = getStoredToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: opts.cache,
    signal: opts.signal,
  });
  let payload: unknown = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
  } else {
    try {
      payload = await res.text();
    } catch {
      payload = null;
    }
  }
  if (!res.ok) {
    // Centralized mid-session 401 handling: an authed request whose token has
    // expired/been revoked clears the stored token and notifies the app so it
    // can drop the stale user and redirect to login, instead of stranding the
    // user on a broken page that keeps 401-ing.
    if (res.status === 401 && opts.auth && typeof window !== 'undefined') {
      setStoredToken(null);
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    const message = extractErrorMessage(payload, res.status);
    throw new ApiError(message, res.status, payload);
  }
  return payload as T;
}

// ---------- Domain types ----------

export type AuthUser = {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  role: 'CUSTOMER' | 'ADMIN';
};

export type AuthResponse = { token: string; user: AuthUser };

export type ProductType = 'CUT_FLOWER' | 'PLANT' | 'BOUQUET' | 'ARRANGEMENT' | 'HAMPER';
export type SaleMode = 'PURCHASE' | 'ENQUIRY';

export type ApiCategory = {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
  parentId?: number | null;
  productType?: ProductType;
  defaultSaleMode?: SaleMode;
  defaultGstRate?: number;
  sortOrder?: number;
  active?: boolean;
  /** Number of ACTIVE products in this category (own products, not children). Undefined from older backends. */
  productCount?: number;
  children?: ApiCategory[];
};

export type ApiProduct = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image: string | null;
  stock: number;
  featured: boolean;
  active: boolean;
  productType?: ProductType;
  saleMode?: SaleMode;
  gstRate?: number;
  unit?: string;
  minOrderQty?: number;
  categoryId: number | null;
  category?: {
    id: number;
    name: string;
    slug: string;
    productType?: ProductType;
    defaultSaleMode?: SaleMode;
  } | null;
  averageRating?: number;
  reviewCount?: number;
  tags?: string[];
};

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'popular';

export type ApiProductList = {
  items: ApiProduct[];
  total: number;
  take?: number;
  skip?: number;
  page?: number;
  pages?: number;
};

export type ApiEnquiry = {
  id: number;
  productId: number | null;
  productName: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  quantity: number | null;
  eventDate: string | null;
  occasion: string | null;
  budget: number | null;
  address: string | null;
  city: string | null;
  message: string | null;
  source: string;
  status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'CONVERTED' | 'CLOSED';
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  product?: { id: number; name: string; slug: string } | null;
};

export type ApiReview = {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; name: string | null } | null;
};

export type ApiReviewList = {
  items: ApiReview[];
  total: number;
  take: number;
  skip: number;
  averageRating: number;
};

export type ApiOrderItem = {
  id: number;
  productId: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  product?: { id: number; slug: string; image: string | null } | null;
};

export type ApiOrderItem2 = ApiOrderItem & { gstRate?: number; gstAmount?: number };

export type ApiOrder = {
  id: number;
  userId: number | null;
  subtotal: number;
  shipping: number;
  gst?: number;
  /** Coupon applied at checkout and the rupees it took off the subtotal (absent / 0 on older orders). */
  couponCode?: string | null;
  discount?: number;
  total: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  paymentMethod: string;
  paymentStatus?: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
  paidAt?: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  city: string | null;
  postalCode: string | null;
  notes: string | null;
  trackingNumber?: string | null;
  courierName?: string | null;
  /** Chosen delivery date: UTC midnight of the IST calendar date (null for orders placed before dates existed). */
  deliveryDate?: string | null;
  createdAt: string;
  updatedAt: string;
  items: ApiOrderItem2[];
  user?: { id: number; email: string; name: string | null } | null;
};

// ---------- Convenience calls ----------

export const api = {
  // Auth
  register: (body: { email: string; password: string; name?: string; phone?: string }) =>
    apiFetch<AuthResponse>('/auth/register', { method: 'POST', body }),
  login: (body: { email: string; password: string }) =>
    apiFetch<AuthResponse>('/auth/login', { method: 'POST', body }),
  me: () => apiFetch<AuthUser>('/auth/me', { auth: true }),
  forgotPassword: (email: string) =>
    apiFetch<{ ok: true }>('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token: string, password: string) =>
    apiFetch<{ ok: true }>('/auth/reset-password', { method: 'POST', body: { token, password } }),

  // Catalog
  listCategories: () => apiFetch<ApiCategory[]>('/categories'),
  listProducts: (
    params: {
      category?: string;
      tag?: string;
      sort?: ProductSort;
      q?: string;
      featured?: boolean;
      page?: number;
      take?: number;
    } = {},
  ) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set('category', params.category);
    if (params.tag) qs.set('tag', params.tag);
    if (params.sort) qs.set('sort', params.sort);
    if (params.q) qs.set('q', params.q);
    if (params.featured !== undefined) qs.set('featured', String(params.featured));
    if (params.page !== undefined) qs.set('page', String(params.page));
    if (params.take !== undefined) qs.set('take', String(params.take));
    const suffix = qs.toString();
    return apiFetch<ApiProductList>(`/products${suffix ? `?${suffix}` : ''}`);
  },
  getProductBySlug: (slug: string) => apiFetch<ApiProduct>(`/products/slug/${encodeURIComponent(slug)}`),

  // Orders
  createOrder: (body: {
    items: { productId: number; quantity: number }[];
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    city: string;
    postalCode: string;
    notes?: string;
    paymentMethod?: 'COD' | 'RAZORPAY';
    /** `YYYY-MM-DD` (India calendar date), required by the backend. */
    deliveryDate: string;
    /** Optional; the server re-validates it and recomputes the discount. */
    couponCode?: string;
  }) => apiFetch<ApiOrder>('/orders', { method: 'POST', body, auth: true }),
  listMyOrders: () => apiFetch<ApiOrder[]>('/orders/mine', { auth: true }),
  getMyOrder: (id: number) => apiFetch<ApiOrder>(`/orders/mine/${id}`, { auth: true }),
  setOrderPaymentMethod: (orderId: number, email?: string) =>
    apiFetch<ApiOrder>(`/orders/${orderId}/payment-method`, {
      method: 'PUT',
      body: { paymentMethod: 'COD', email },
      auth: true,
    }),
  // The email goes in the POST body, never the query string, so it stays out of access logs and history.
  trackOrder: (id: number, email: string) =>
    apiFetch<ApiOrder>(`/orders/track/${id}`, { method: 'POST', body: { email } }),

  // Coupons: a preview only. The server recomputes the discount from its own prices when the order is created.
  validateCoupon: (code: string, subtotal: number, signal?: AbortSignal) =>
    apiFetch<{ code: string; type: 'PERCENT' | 'FLAT'; value: number; discount: number }>('/coupons/validate', {
      method: 'POST',
      body: { code, subtotal },
      signal,
    }),

  // Delivery
  checkPincode: (pincode: string, signal?: AbortSignal) =>
    apiFetch<{ serviceable: boolean; restricted?: boolean; message: string }>(
      `/delivery/check?pincode=${encodeURIComponent(pincode)}`,
      {
        // A slow check must never hold the shopper up: time out after 5s (callers treat a failure as "unknown").
        signal: signal ?? (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(5000) : undefined),
      },
    ),

  /** Selectable delivery window and unavailable dates, computed server-side in India time. */
  getDeliveryOptions: () =>
    apiFetch<{ earliest: string; latest: string; blackoutDates: string[] }>('/delivery/options', { cache: 'no-store' }),

  // Payments (Razorpay)
  getPaymentConfig: () => apiFetch<{ enabled: boolean }>('/payments/razorpay/config'),
  createRazorpayOrder: (orderId: number, email?: string) =>
    apiFetch<{
      keyId: string;
      razorpayOrderId: string;
      amount: number;
      currency: 'INR';
      name: string;
      prefill: { name: string; email: string; contact: string };
    }>('/payments/razorpay/order', { method: 'POST', body: { orderId, email }, auth: true }),
  verifyRazorpay: (body: {
    orderId: number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    signature: string;
  }) =>
    // PAID: paid online. CANCELLED: paid after the order was cancelled. COD: paid after the order had
    // already been switched to cash on delivery. The last two both mean a refund is due.
    apiFetch<{ ok: true; status: 'PAID' | 'CANCELLED' | 'COD' }>('/payments/razorpay/verify', {
      method: 'POST',
      body,
      auth: true,
    }),

  // Reviews
  listProductReviews: (productId: number, params: { take?: number; skip?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.take !== undefined) qs.set('take', String(params.take));
    if (params.skip !== undefined) qs.set('skip', String(params.skip));
    const suffix = qs.toString();
    return apiFetch<ApiReviewList>(
      `/products/${productId}/reviews${suffix ? `?${suffix}` : ''}`,
    );
  },
  upsertProductReview: (
    productId: number,
    body: { rating: number; title?: string | null; body: string },
  ) => apiFetch<ApiReview>(`/products/${productId}/reviews`, { method: 'POST', body, auth: true }),
  deleteReview: (reviewId: number) =>
    apiFetch<{ success: true }>(`/reviews/${reviewId}`, { method: 'DELETE', auth: true }),

  // Enquiries (public POST)
  createEnquiry: (body: {
    productId?: number | null;
    productName?: string;
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    quantity?: number;
    eventDate?: string;
    occasion?: string;
    budget?: number;
    address?: string;
    city?: string;
    message?: string;
    source?: string;
  }) => apiFetch<ApiEnquiry>('/enquiries', { method: 'POST', body }),

  // Newsletter
  subscribeNewsletter: (email: string) =>
    apiFetch<{ ok: true }>('/newsletter', { method: 'POST', body: { email, source: 'footer' } }),

  // Settings
  getSettings: () => apiFetch<Record<string, string>>('/settings'),
};
