/** Last PIN code the shopper checked, remembered across pages. Storage can throw (private mode): never let it break the UI. */
export const PINCODE_KEY = 'fp_pincode';

export function readStoredPincode(): string {
  try {
    const v = window.localStorage.getItem(PINCODE_KEY);
    return v && /^[1-9]\d{5}$/.test(v) ? v : '';
  } catch {
    return '';
  }
}

export function storePincode(pin: string): void {
  try {
    window.localStorage.setItem(PINCODE_KEY, pin);
  } catch {
    /* ignore */
  }
}
