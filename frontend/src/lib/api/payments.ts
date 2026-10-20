import { apiFetch } from './client';

type RazorpayOrder = {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: 'INR';
  name: string;
  prefill: { name: string; email: string; contact: string };
};

type VerifyBody = {
  orderId: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
};

export const paymentsApi = {
  getPaymentConfig: () => apiFetch<{ enabled: boolean }>('/payments/razorpay/config'),
  createRazorpayOrder: (orderId: number, email?: string) =>
    apiFetch<RazorpayOrder>('/payments/razorpay/order', { method: 'POST', body: { orderId, email }, auth: true }),
  verifyRazorpay: (body: VerifyBody) =>
    // PAID: paid online. CANCELLED: paid after the order was cancelled. COD: paid after the order had
    // already been switched to cash on delivery. The last two both mean a refund is due.
    apiFetch<{ ok: true; status: 'PAID' | 'CANCELLED' | 'COD' }>('/payments/razorpay/verify', {
      method: 'POST',
      body,
      auth: true,
    }),
};
