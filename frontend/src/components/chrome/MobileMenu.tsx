"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { OCCASIONS } from "@/lib/occasions";
import { ChevronIcon, CloseIcon } from "./icons";
import { MOBILE_EXTRA_LINKS, PRIMARY_LINKS } from "./nav-data";
import { focusRing, iconButton } from "./styles";
import { useModal } from "./use-modal";
import Wordmark from "./Wordmark";

export const MOBILE_MENU_ID = "mobile-menu";

const big = `flex min-h-[56px] w-full items-center justify-between border-b border-stone-light font-display text-[32px] leading-none text-charcoal ${focusRing}`;
const small = `flex min-h-[44px] items-center text-[15px] text-charcoal ${focusRing}`;

/** Full-screen ivory menu for < lg. Focus is trapped, the page is locked, Escape closes. */
export default function MobileMenu({ onClose, onSignIn }: { onClose: () => void; onSignIn: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const [occasionsOpen, setOccasionsOpen] = useState(false);
  useModal(true, ref, onClose);

  return (
    <div
      ref={ref}
      id={MOBILE_MENU_ID}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      tabIndex={-1}
      className="chrome-fade fixed inset-0 z-50 flex flex-col overflow-y-auto bg-ivory"
    >
      <div className="mx-auto grid h-14 w-full max-w-[1280px] shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-stone-light px-5 md:px-8">
        <span aria-hidden />
        <Wordmark onClick={onClose} />
        <button type="button" aria-label="Close menu" data-autofocus onClick={onClose} className={`${iconButton} -mr-3 justify-self-end`}>
          <CloseIcon />
        </button>
      </div>

      <nav aria-label="Mobile" className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-5 pb-10 pt-4 md:px-8">
        <ul>
          <li>
            <Link href={PRIMARY_LINKS[0].href} className={big} onClick={onClose}>
              {PRIMARY_LINKS[0].label}
            </Link>
          </li>
          <li>
            <button
              type="button"
              aria-expanded={occasionsOpen}
              aria-controls="mobile-occasions"
              onClick={() => setOccasionsOpen((v) => !v)}
              className={big}
            >
              Occasions
              <ChevronIcon width={20} height={20} className={`transition-transform duration-200 ${occasionsOpen ? "rotate-180" : ""}`} />
            </button>
            {occasionsOpen && (
              <ul id="mobile-occasions" className="grid grid-cols-2 gap-x-6 border-b border-stone-light py-3">
                {OCCASIONS.map((o) => (
                  <li key={o.slug}>
                    <Link href={`/occasions/${o.slug}`} className={small} onClick={onClose}>
                      {o.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
          {PRIMARY_LINKS.slice(1).map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={big} onClick={onClose}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <ul className="mt-auto pt-8">
          {MOBILE_EXTRA_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={small} onClick={onClose}>
                {l.label}
              </Link>
            </li>
          ))}
          {user ? (
            <>
              <li>
                <Link href="/account/orders" className={small} onClick={onClose}>
                  My orders
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className={small}
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                >
                  Sign out
                </button>
              </li>
            </>
          ) : (
            <li>
              <button type="button" className={small} onClick={onSignIn}>
                Sign in
              </button>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
}
