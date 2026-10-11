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

export function getTrackEmail(): string | null {
  try {
    return sessionStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
}

// Remove the email as soon as it has been consumed so it doesn't linger for the
// rest of the tab session or get reused by a later, unrelated lookup.
export function clearTrackEmail(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable — nothing to clear */
  }
}
