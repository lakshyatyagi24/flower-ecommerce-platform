"use client";

import { useSettings, whatsappLink } from "@/lib/settings-context";

export default function WhatsAppButton() {
  const settings = useSettings();
  const href = whatsappLink(
    settings.whatsapp || settings.phone,
    `Hi ${settings.name || "Fresh Petals India"}, I'd like to enquire about your flowers.`,
  );

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 sm:bottom-7 sm:right-7"
    >
      <svg
        viewBox="0 0 32 32"
        fill="currentColor"
        className="h-7 w-7"
        aria-hidden="true"
      >
        <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39-.158 0-.347-.083-.521-.176-.881-.444-1.654-.953-2.359-1.658-.705-.704-1.214-1.477-1.658-2.359-.093-.174-.176-.363-.176-.521 0-.43 1.39-1.146 1.39-1.518 0-.175-.137-.35-.205-.522-.144-.42-.498-1.255-.7-1.687-.144-.314-.354-.382-.665-.382-.175 0-.349-.07-.523-.07-.314 0-.821.07-1.255.523-.6.628-1.039 1.481-1.039 2.736 0 1.359.97 2.687 1.107 2.871.137.184 1.913 3.046 4.737 4.213 2.36.974 2.846.802 3.358.751.616-.06 1.987-.808 2.265-1.59.279-.78.279-1.451.205-1.59-.07-.137-.245-.21-.523-.349z" />
        <path d="M16 .029c-8.836 0-16 7.163-16 16 0 2.793.733 5.515 2.135 7.93l-2.135 7.741 7.93-2.057c2.291 1.282 4.886 1.948 7.535 1.948h.007c8.836 0 16-7.163 16-16s-7.163-15.999-15.972-15.999zm0 29.323h-.005c-2.34 0-4.633-.628-6.629-1.815l-.475-.282-4.927 1.275 1.317-4.794-.314-.495c-1.305-2.077-1.997-4.476-1.997-6.94 0-7.18 5.842-13.024 13.026-13.024 3.482 0 6.751 1.354 9.213 3.815 2.461 2.461 3.811 5.731 3.81 9.213 0 7.181-5.844 13.024-13.029 13.024z" />
      </svg>
    </a>
  );
}
