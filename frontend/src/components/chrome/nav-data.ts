/** Static primary navigation: rendered as plain markup so crawlers see it in the server HTML (R15). */
export const PRIMARY_LINKS = [
  { href: "/products", label: "Flowers" },
  { href: "/corporate", label: "Corporate" },
  { href: "/about", label: "About" },
] as const;

export const MOBILE_EXTRA_LINKS = [
  { href: "/track-order", label: "Track order" },
  { href: "/contact", label: "Contact" },
] as const;
