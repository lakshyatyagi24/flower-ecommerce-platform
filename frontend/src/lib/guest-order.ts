// A guest's key to their own order is the email they ordered with. After placing an order it is handed to the
// pending-payment panel and the success page through sessionStorage - never through the URL (history, logs,
// Referer). It is removed once the order has been displayed in a final state.
export const LAST_ORDER_EMAIL_KEY = 'fp_last_order_email';

export function setLastOrderEmail(email: string): void {
  const v = email.trim();
  if (!v || typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(LAST_ORDER_EMAIL_KEY, v);
  } catch {
    /* storage unavailable (private mode): the success page falls back to "track your order" */
  }
}

export function getLastOrderEmail(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(LAST_ORDER_EMAIL_KEY) || null;
  } catch {
    return null;
  }
}

export function clearLastOrderEmail(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(LAST_ORDER_EMAIL_KEY);
  } catch {
    /* nothing to clear */
  }
}
