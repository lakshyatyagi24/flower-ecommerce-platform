import type { SVGProps } from "react";

const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

type P = SVGProps<SVGSVGElement>;

export const SearchIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </svg>
);
export const UserIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8.5" r="3.7" />
    <path d="M4.8 20c.7-3.6 3.7-5.6 7.2-5.6s6.5 2 7.2 5.6" />
  </svg>
);
export const BagIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 8h14l-1 12H6L5 8z" />
    <path d="M9 8V6.5a3 3 0 016 0V8" />
  </svg>
);
export const MenuIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 8h16M4 16h16" />
  </svg>
);
export const CloseIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const ChevronIcon = (p: P) => (
  <svg {...base} width={14} height={14} {...p}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
export const WhatsAppIcon = (p: P) => (
  <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden focusable={false} width={26} height={26} {...p}>
    <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39-.158 0-.347-.083-.521-.176-.881-.444-1.654-.953-2.359-1.658-.705-.704-1.214-1.477-1.658-2.359-.093-.174-.176-.363-.176-.521 0-.43 1.39-1.146 1.39-1.518 0-.175-.137-.35-.205-.522-.144-.42-.498-1.255-.7-1.687-.144-.314-.354-.382-.665-.382-.175 0-.349-.07-.523-.07-.314 0-.821.07-1.255.523-.6.628-1.039 1.481-1.039 2.736 0 1.359.97 2.687 1.107 2.871.137.184 1.913 3.046 4.737 4.213 2.36.974 2.846.802 3.358.751.616-.06 1.987-.808 2.265-1.59.279-.78.279-1.451.205-1.59-.07-.137-.245-.21-.523-.349z" />
    <path d="M16 .029c-8.836 0-16 7.163-16 16 0 2.793.733 5.515 2.135 7.93l-2.135 7.741 7.93-2.057c2.291 1.282 4.886 1.948 7.535 1.948h.007c8.836 0 16-7.163 16-16s-7.163-15.999-15.972-15.999zm0 29.323h-.005c-2.34 0-4.633-.628-6.629-1.815l-.475-.282-4.927 1.275 1.317-4.794-.314-.495c-1.305-2.077-1.997-4.476-1.997-6.94 0-7.18 5.842-13.024 13.026-13.024 3.482 0 6.751 1.354 9.213 3.815 2.461 2.461 3.811 5.731 3.81 9.213 0 7.181-5.844 13.024-13.029 13.024z" />
  </svg>
);
export const InstagramIcon = (p: P) => (
  <svg {...base} width={20} height={20} {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17" cy="7" r="0.6" fill="currentColor" />
  </svg>
);
