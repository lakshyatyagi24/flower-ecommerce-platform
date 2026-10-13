// Lets any page ask the header to open the sign-in dialog without navigating away, so a half-filled form
// (checkout) keeps its state. The Navbar owns the dialog and listens for this event.
export const OPEN_SIGN_IN_EVENT = 'fp:open-sign-in';

export function requestSignIn(trigger?: HTMLElement | null): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<{ trigger: HTMLElement | null }>(OPEN_SIGN_IN_EVENT, { detail: { trigger: trigger ?? null } }),
  );
}
