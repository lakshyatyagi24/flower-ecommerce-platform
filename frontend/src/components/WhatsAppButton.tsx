"use client";

import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useSettings, whatsappLink } from "@/lib/settings-context";
import { WhatsAppIcon } from "./chrome/icons";

/** 48px round chat button, bottom right. Hidden without a configured number, on checkout, and behind the cart drawer. */
export default function WhatsAppButton() {
  const settings = useSettings();
  const pathname = usePathname();
  const { isOpen } = useCart();
  const href = whatsappLink(
    settings.whatsapp || settings.phone,
    `Hi ${settings.name || "Fresh Petals India"}, I'd like to enquire about your flowers.`,
  );

  if (!href || isOpen || pathname?.startsWith("/checkout")) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-30 flex h-12 w-12 items-center justify-center rounded-full bg-moss text-ivory transition-colors duration-200 hover:bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss md:bottom-6 md:right-6"
    >
      <WhatsAppIcon width={24} height={24} />
    </a>
  );
}
