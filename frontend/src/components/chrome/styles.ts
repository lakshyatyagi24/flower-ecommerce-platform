/** Shared class strings for the site chrome. Tokens only (see scripts/check-colours.mjs). */
export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss";

export const iconButton = `inline-flex h-11 w-11 items-center justify-center text-charcoal transition-colors duration-200 hover:text-moss ${focusRing}`;

export const navLink = `inline-flex min-h-[44px] items-center aria-[current=page]:underline aria-[current=page]:decoration-1 aria-[current=page]:underline-offset-8 text-[13px] font-medium uppercase tracking-[0.12em] text-charcoal transition-colors duration-200 hover:text-moss ${focusRing}`;
