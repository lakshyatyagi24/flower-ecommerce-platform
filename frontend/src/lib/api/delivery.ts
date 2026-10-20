import { apiFetch } from './client';

// A slow check must never hold the shopper up: time out after 5s (callers treat a failure as "unknown").
function defaultPincodeSignal(): AbortSignal | undefined {
  return typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(5000) : undefined;
}

export const deliveryApi = {
  checkPincode: (pincode: string, signal?: AbortSignal) =>
    apiFetch<{ serviceable: boolean; restricted?: boolean; message: string }>(
      `/delivery/check?pincode=${encodeURIComponent(pincode)}`,
      { signal: signal ?? defaultPincodeSignal() },
    ),

  /** Selectable delivery window and unavailable dates, computed server-side in India time. */
  getDeliveryOptions: () =>
    apiFetch<{ earliest: string; latest: string; blackoutDates: string[] }>('/delivery/options', { cache: 'no-store' }),
};
