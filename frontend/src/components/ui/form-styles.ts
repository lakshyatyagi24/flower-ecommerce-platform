/** Shared class strings for form controls. Tokens only (see scripts/check-colours.mjs). */
export const controlBase =
  'block w-full min-h-12 rounded-sm border bg-ivory px-4 text-base text-charcoal placeholder:text-stone ' +
  'transition-colors duration-200 hover:border-stone ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss ' +
  'disabled:cursor-not-allowed disabled:bg-ivory-deep disabled:text-stone-dark disabled:hover:border-stone-light';

export const controlBorder = (invalid: boolean) => (invalid ? 'border-danger hover:border-danger' : 'border-stone-light');

export const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss';
