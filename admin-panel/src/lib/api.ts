// Centralized API client for the admin panel.
export const API_BASE: string =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001';

const TOKEN_KEY = 'flower_admin_token';

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

interface FetchOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
}

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

export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/** Client-side pre-check mirroring the server gate. Returns an error message, or null if OK. */
export function validateImageFile(file: File): string | null {
  if (!IMAGE_UPLOAD_TYPES.includes(file.type)) return 'Only JPEG, PNG, WebP or AVIF images are allowed.';
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) return 'Image must be under 5 MB.';
  return null;
}

export async function uploadImage(
  file: File,
  folder: 'products' | 'sliders' | 'categories' = 'products',
): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append('file', file);
  const token = getStoredToken();
  const res = await fetch(`${API_BASE}/uploads?folder=${folder}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(extractErrorMessage(payload, res.status), res.status, payload);
  return payload;
}

export async function apiFetch<T = unknown>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers: Record<string, string> = { ...(opts.headers || {}) };
  if (opts.body !== undefined && !('Content-Type' in headers)) {
    headers['Content-Type'] = 'application/json';
  }
  if (opts.auth !== false) {
    const token = getStoredToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  let payload: unknown = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try { payload = await res.json(); } catch { payload = null; }
  } else {
    try { payload = await res.text(); } catch { payload = null; }
  }
  if (!res.ok) {
    // Centralized mid-session 401: clear the token and bounce the admin to
    // login from wherever the failing request originated, instead of leaving
    // them on a dashboard where every request 401s with no recovery path.
    if (res.status === 401 && opts.auth !== false && typeof window !== 'undefined') {
      setStoredToken(null);
      window.dispatchEvent(new CustomEvent('admin-auth:unauthorized'));
    }
    const message = extractErrorMessage(payload, res.status);
    throw new ApiError(message, res.status, payload);
  }
  return payload as T;
}

export type AdminUser = {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  role: 'CUSTOMER' | 'ADMIN';
};

export type AdminProductType = 'CUT_FLOWER' | 'PLANT' | 'BOUQUET' | 'ARRANGEMENT' | 'HAMPER';
export type AdminSaleMode = 'PURCHASE' | 'ENQUIRY';

export type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image: string | null;
  stock: number;
  featured: boolean;
  active: boolean;
  productType?: AdminProductType;
  saleMode?: AdminSaleMode;
  gstRate?: number;
  unit?: string;
  minOrderQty?: number;
  categoryId: number | null;
  category?: { id: number; name: string; slug: string; productType?: AdminProductType; defaultSaleMode?: AdminSaleMode } | null;
};

export type AdminEnquiryStatus = 'NEW' | 'CONTACTED' | 'QUOTED' | 'CONVERTED' | 'CLOSED';

export type AdminEnquiry = {
  id: number;
  userId: number | null;
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
  status: AdminEnquiryStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  product?: { id: number; name: string; slug: string } | null;
  user?: { id: number; email: string; name: string | null } | null;
};

export type AdminOrder = {
  id: number;
  userId: number | null;
  subtotal: number;
  shipping: number;
  gst?: number;
  total: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  paymentMethod: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  city: string | null;
  postalCode: string | null;
  notes: string | null;
  trackingNumber?: string | null;
  courierName?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  items: {
    id: number;
    productId: number | null;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
  user?: { id: number; email: string; name: string | null } | null;
};

export type AdminOrderPatch = {
  status?: string;
  trackingNumber?: string | null;
  courierName?: string | null;
  adminNotes?: string | null;
  shippingAddress?: string | null;
  city?: string | null;
  postalCode?: string | null;
  customerPhone?: string | null;
};

export type AdminCustomer = {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  createdAt: string;
  orderCount: number;
};

export type AdminSubscriber = {
  id: number;
  email: string;
  source: string;
  createdAt: string;
};

export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
  parentId?: number | null;
  productType?: AdminProductType;
  defaultSaleMode?: AdminSaleMode;
  defaultGstRate?: number;
  sortOrder?: number;
  active?: boolean;
  children?: AdminCategory[];
};

export type AdminCategoryInput = {
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
  parentId?: number | null;
  productType?: AdminProductType;
  defaultSaleMode?: AdminSaleMode;
  defaultGstRate?: number;
  sortOrder?: number;
  active?: boolean;
};

export type AdminReview = {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; name: string | null } | null;
  product?: { id: number; name: string; slug: string } | null;
};

export const adminApi = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: AdminUser }>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    }),
  me: () => apiFetch<AdminUser>('/auth/me'),
  forgotPassword: (email: string) =>
    apiFetch<{ ok: true }>('/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),
  resetPassword: (token: string, password: string) =>
    apiFetch<{ ok: true }>('/auth/reset-password', { method: 'POST', body: { token, password }, auth: false }),

  // Products — uses the admin endpoint so inactive/soft-disabled products are
  // visible (the public /products endpoint only ever returns active ones).
  listProducts: (params: { active?: boolean | 'all'; take?: number; skip?: number } = {}) => {
    const qs = new URLSearchParams();
    qs.set('active', params.active === true || params.active === false ? String(params.active) : 'all');
    if (params.take !== undefined) qs.set('take', String(params.take));
    if (params.skip !== undefined) qs.set('skip', String(params.skip));
    return apiFetch<{ items: AdminProduct[]; total: number }>(`/products/admin?${qs.toString()}`);
  },
  createProduct: (body: Partial<AdminProduct> & { name: string; price: number }) =>
    apiFetch<AdminProduct>('/products', { method: 'POST', body }),
  updateProduct: (id: number, body: Partial<AdminProduct>) =>
    apiFetch<AdminProduct>(`/products/${id}`, { method: 'PUT', body }),
  deleteProduct: (id: number) =>
    apiFetch<{ success: true } | AdminProduct>(`/products/${id}`, { method: 'DELETE' }),

  // Orders
  listOrders: (params: { status?: string; take?: number; skip?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.take !== undefined) qs.set('take', String(params.take));
    if (params.skip !== undefined) qs.set('skip', String(params.skip));
    const suffix = qs.toString();
    return apiFetch<{ items: AdminOrder[]; total: number }>(
      `/orders${suffix ? `?${suffix}` : ''}`,
    );
  },
  getOrder: (id: number) => apiFetch<AdminOrder>(`/orders/${id}`),
  updateOrderStatus: (id: number, status: string) =>
    apiFetch<AdminOrder>(`/orders/${id}/status`, { method: 'PUT', body: { status } }),
  updateOrder: (id: number, patch: AdminOrderPatch) =>
    apiFetch<AdminOrder>(`/orders/${id}`, { method: 'PUT', body: patch }),
  stats: () =>
    apiFetch<{
      orderCount: number;
      productCount: number;
      customerCount: number;
      revenue: number;
      openEnquiries: number;
      recentOrders: { id: number; customerName: string | null; total: number; status: string; createdAt: string }[];
    }>('/orders/stats'),

  // Enquiries
  listEnquiries: (params: { status?: string; take?: number; skip?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.take !== undefined) qs.set('take', String(params.take));
    if (params.skip !== undefined) qs.set('skip', String(params.skip));
    const suffix = qs.toString();
    return apiFetch<{ items: AdminEnquiry[]; total: number; take: number; skip: number; openCount: number }>(
      `/enquiries${suffix ? `?${suffix}` : ''}`,
    );
  },
  getEnquiry: (id: number) => apiFetch<AdminEnquiry>(`/enquiries/${id}`),
  updateEnquiryStatus: (id: number, status: string, adminNotes?: string) =>
    apiFetch<AdminEnquiry>(`/enquiries/${id}/status`, {
      method: 'PUT',
      body: { status, adminNotes },
    }),
  enquiryStats: () =>
    apiFetch<{
      byStatus: Record<AdminEnquiryStatus, number>;
      open: number;
      total: number;
    }>('/enquiries/stats'),

  // Customers
  listCustomers: () => apiFetch<AdminCustomer[]>('/users/customers'),

  // Newsletter subscribers
  listSubscribers: (take = 50, skip = 0) =>
    apiFetch<{ items: AdminSubscriber[]; total: number }>(`/newsletter?take=${take}&skip=${skip}`),

  // Categories
  listCategories: () => apiFetch<AdminCategory[]>('/categories/all'),
  listCategoriesPublic: () => apiFetch<AdminCategory[]>('/categories'),
  createCategory: (body: AdminCategoryInput) =>
    apiFetch<AdminCategory>('/categories', { method: 'POST', body }),
  updateCategory: (id: number, body: Partial<AdminCategoryInput>) =>
    apiFetch<AdminCategory>(`/categories/${id}`, { method: 'PUT', body }),
  deleteCategory: (id: number) =>
    apiFetch<{ success: true } | AdminCategory>(`/categories/${id}`, { method: 'DELETE' }),

  // Reviews
  listReviews: (params: { productId?: number; take?: number; skip?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.productId !== undefined) qs.set('productId', String(params.productId));
    if (params.take !== undefined) qs.set('take', String(params.take));
    if (params.skip !== undefined) qs.set('skip', String(params.skip));
    const suffix = qs.toString();
    return apiFetch<{ items: AdminReview[]; total: number; take: number; skip: number }>(
      `/reviews${suffix ? `?${suffix}` : ''}`,
    );
  },
  deleteReview: (id: number) =>
    apiFetch<{ success: true }>(`/reviews/${id}`, { method: 'DELETE' }),

  // Uploads
  uploadImage,

  // Settings
  getAdminSettings: () => apiFetch<Record<string, string>>('/settings/admin'),
  updateSettings: (values: Record<string, string>) =>
    apiFetch<Record<string, string>>('/settings', { method: 'PUT', body: values }),
};

/** Downloads the subscribers CSV with the bearer token (a plain link cannot send it). */
export async function downloadSubscribersCsv(): Promise<void> {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE}/newsletter/export.csv`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new ApiError(extractErrorMessage(payload, res.status), res.status, payload);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscribers.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
