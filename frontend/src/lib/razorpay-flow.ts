import { ApiError, api } from '@/lib/api';
import { openCheckout } from '@/lib/razorpay';

export type PayHandlers = {
  onPaid(): void;
  /** 'expired': paid after the order was cancelled. 'switched': paid after it was switched to cash on delivery. */
  onRefundDue(kind: 'expired' | 'switched'): void;
  onDismiss(): void;
  onFailure(msg: string): void;
  onVerifyError(msg: string): void;
  onError(msg: string): void;
};

export const VERIFY_ERROR_COPY =
  'We could not confirm your payment yet. If money was deducted your order will update automatically within a few minutes — check My Orders.';
export const UNAVAILABLE_COPY =
  'Online payment is temporarily unavailable. You can switch to cash on delivery.';

// Module-level guard: only one payment modal / verification may be active at a
// time, so a double click can never open two checkouts for the same customer.
// It is released when the modal is dismissed, verification finishes, or setup fails.
// (A payment.failed event keeps the modal open for retry, so it does NOT release.)
let inFlight = false;

/** `guestEmail`: the email on a guest's order (omitted for a signed-in customer, who is identified by the token). */
export async function payForOrder(orderId: number, h: PayHandlers, guestEmail?: string): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  let settled = false; // a payment succeeded; ignore the modal's trailing dismiss
  const release = () => {
    inFlight = false;
  };
  try {
    const o = guestEmail ? await api.createRazorpayOrder(orderId, guestEmail) : await api.createRazorpayOrder(orderId);
    await openCheckout({
      keyId: o.keyId,
      razorpayOrderId: o.razorpayOrderId,
      amount: o.amount,
      name: o.name,
      prefill: o.prefill,
      onFailure: (msg) => {
        if (!settled) h.onFailure(msg);
      },
      onDismiss: () => {
        if (settled) return;
        release();
        h.onDismiss();
      },
      onSuccess: (r) => {
        settled = true;
        void (async () => {
          try {
            const res = await api.verifyRazorpay({
              orderId,
              razorpayOrderId: r.razorpay_order_id,
              razorpayPaymentId: r.razorpay_payment_id,
              signature: r.razorpay_signature,
            });
            release();
            if (res.status === 'PAID') h.onPaid();
            else h.onRefundDue(res.status === 'COD' ? 'switched' : 'expired');
          } catch {
            release();
            h.onVerifyError(VERIFY_ERROR_COPY);
          }
        })();
      },
    });
  } catch (e) {
    release();
    if (e instanceof ApiError) {
      h.onError(e.status === 503 ? UNAVAILABLE_COPY : e.message);
    } else {
      h.onError(e instanceof Error && e.message ? e.message : 'Could not start payment. Please try again.');
    }
  }
}
