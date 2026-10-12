// Razorpay Checkout loader + opener. Never log keys, signatures or payment ids.

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
// Brand olive green (same value as --color-olive-green in globals.css).
const BRAND_COLOR = '#7C835A';
// Checkout session timeout in seconds. Must stay below the server's 30 minute
// auto-cancel window so a customer can't pay an order that has just expired.
const CHECKOUT_TIMEOUT_SECONDS = 1200;

type RzpWindow = Window & { Razorpay?: new (opts: Record<string, unknown>) => RzpInstance };
type RzpInstance = { open(): void; on(event: string, cb: (e: any) => void): void };

let loading: Promise<void> | null = null;

export function loadRazorpay(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as RzpWindow).Razorpay) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      s.remove();
      reject(new Error('Could not load payment gateway'));
    };
    document.body.appendChild(s);
  });
  return loading;
}

export type RzpSuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type OpenCheckoutOptions = {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  name: string;
  prefill: { name: string; email: string; contact: string };
  onSuccess: (r: RzpSuccess) => void;
  onDismiss: () => void;
  onFailure: (message: string) => void;
};

export async function openCheckout(opts: OpenCheckoutOptions): Promise<void> {
  await loadRazorpay();
  const Ctor = (window as RzpWindow).Razorpay;
  if (!Ctor) throw new Error('Could not load payment gateway');
  const rzp = new Ctor({
    key: opts.keyId,
    order_id: opts.razorpayOrderId,
    amount: opts.amount,
    currency: 'INR',
    name: opts.name,
    prefill: opts.prefill,
    theme: { color: BRAND_COLOR },
    timeout: CHECKOUT_TIMEOUT_SECONDS,
    handler: opts.onSuccess,
    modal: { ondismiss: opts.onDismiss, confirm_close: true },
  });
  rzp.on('payment.failed', (e: any) => {
    const d = e?.error?.description;
    opts.onFailure(typeof d === 'string' && d ? d : 'Payment failed');
  });
  rzp.open();
}
