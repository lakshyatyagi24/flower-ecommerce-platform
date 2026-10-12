// Mirrors flower-backend/src/orders/refund-note.ts. refundNote mixes the owner's free text with
// system-written trace lines (the server preserves those on save; never send them back).
// Keep this regex identical to the backend's SYSTEM_LINE.
const SYSTEM_LINE =
  /^(Switched to COD; abandoned Razorpay order |PAYMENT \S+ CAPTURED AFTER SWITCH TO COD|AMOUNT MISMATCH)/;

// System lines that mean a payment was captured and may need a manual refund.
const CAPTURE_TRACE = /CAPTURED AFTER SWITCH|AMOUNT MISMATCH/;

export function splitRefundNote(note: string | null | undefined): { admin: string; system: string[] } {
  const admin: string[] = [];
  const system: string[] = [];
  for (const line of (note ?? '').split(/\r?\n/)) {
    if (SYSTEM_LINE.test(line)) system.push(line);
    else admin.push(line);
  }
  return { admin: admin.join('\n').trim(), system };
}

/**
 * Must agree with the server: matches the marker ANYWHERE in the raw note, exactly like
 * ATTENTION_WHERE.mismatch (refundNote contains ...) and adminUpdate's REFUNDED eligibility in
 * flower-backend/src/orders/orders.service.ts. (The read-only box uses the anchored splitRefundNote,
 * which is a different rule: what the server strips from admin edits.)
 */
export function hasCaptureTrace(note: string | null | undefined): boolean {
  return CAPTURE_TRACE.test(note ?? '');
}

export type PaymentBadge = {
  label: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
  hint?: string;
  attention?: boolean;
};

type PaymentFields = {
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  refundNote?: string | null;
};

export function paymentBadge(order: PaymentFields): PaymentBadge {
  const { paymentMethod, paymentStatus, status, refundNote } = order;
  if (paymentStatus === 'PAID' && status === 'CANCELLED') {
    return {
      label: 'Refund owed',
      tone: 'danger',
      attention: true,
      hint: 'Customer paid but the order is cancelled. Refund them in Razorpay, then mark it refunded.',
    };
  }
  if (paymentStatus !== 'REFUNDED' && hasCaptureTrace(refundNote)) {
    return {
      label: 'Check payment',
      tone: 'danger',
      attention: true,
      hint: 'A payment was captured that does not match this order. See the payment notes.',
    };
  }
  if (paymentStatus === 'REFUNDED') return { label: 'Refunded', tone: 'neutral' };
  if (paymentStatus === 'PAID') {
    return { label: paymentMethod === 'RAZORPAY' ? 'Paid online' : 'Paid', tone: 'success' };
  }
  if (paymentStatus === 'FAILED') return { label: 'Payment failed', tone: 'warning' };
  if (paymentMethod === 'COD') return { label: 'Cash on delivery', tone: 'neutral' };
  if (paymentMethod === 'RAZORPAY' && status === 'PENDING') {
    return { label: 'Awaiting payment', tone: 'warning', hint: 'Online order not paid yet.' };
  }
  return { label: 'Not paid', tone: 'neutral' };
}
