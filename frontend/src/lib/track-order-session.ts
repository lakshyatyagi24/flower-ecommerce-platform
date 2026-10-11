// The order-tracking email is handed from the form / orders list to the results
// page via sessionStorage so it never appears in a URL (history, logs, Referer).
const KEY = 'track_order_email';

export function setTrackEmail(email: string): void {
  try {
    sessionStorage.setItem(KEY, email);
  } catch {
    /* storage unavailable (private mode) — the results page will ask again */
  }
}

export function getTrackEmail(): string {
  try {
    return sessionStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
}
