import { apiFetch } from './client';
import type { ApiOrder } from './types';

type CreateOrderBody = {
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
};

type CouponPreview = {
  code: string;
  type: 'PERCENT' | 'FLAT';
  value: number;
  discount: number;
  minTotal?: number;
};

export const ordersApi = {
  createOrder: (body: CreateOrderBody) => apiFetch<ApiOrder>('/orders', { method: 'POST', body, auth: true }),
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
    apiFetch<CouponPreview>('/coupons/validate', { method: 'POST', body: { code, subtotal }, signal }),
};
