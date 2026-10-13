"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Cart from "./Cart";
const loadSignIn = () => import("./SignInModal");
const SignInModal = dynamic(loadSignIn, { ssr: false });
import AccountMenu from "./chrome/AccountMenu";
import HeaderSearch from "./chrome/HeaderSearch";
import { MenuIcon } from "./chrome/icons";
import MobileMenu, { MOBILE_MENU_ID } from "./chrome/MobileMenu";
import { PRIMARY_LINKS } from "./chrome/nav-data";
import OccasionsMenu from "./chrome/OccasionsMenu";
import { iconButton, navLink } from "./chrome/styles";
import { useCloseOnRouteChange } from "./chrome/use-route-change";
import Wordmark from "./chrome/Wordmark";

/**
 * Sticky site header: 56px on mobile, 64px from lg. A normal sticky element, so there is no spacer and no
 * band above the page. The link lists are static markup and are server-rendered (R15).
 */
export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const signInFrom = useRef<HTMLElement | null>(null);

  useCloseOnRouteChange(() => setMenuOpen(false));

  // The mobile menu has no meaning from lg up (the desktop nav takes over): close it when the viewport crosses.
  useEffect(() => {
    if (!menuOpen || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: { matches: boolean }) => e.matches && setMenuOpen(false);
    if (mql.matches) setMenuOpen(false);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [menuOpen]);

  const openSignIn = (trigger: HTMLElement | null) => {
    signInFrom.current = trigger;
    setSignInOpen(true);
  };

  const [first, ...rest] = PRIMARY_LINKS;
  const current = (href: string) => (pathname === href || pathname?.startsWith(`${href}/`) ? "page" : undefined);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-stone-light bg-ivory">
        <div className="mx-auto grid h-14 w-full max-w-[1280px] grid-cols-[1fr_auto_1fr] items-center px-5 md:px-8 lg:h-16">
          <button
            ref={burgerRef}
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? MOBILE_MENU_ID : undefined}
            onClick={() => setMenuOpen(true)}
            className={`${iconButton} col-start-1 row-start-1 -ml-3 justify-self-start lg:hidden`}
          >
            <MenuIcon />
          </button>

          <Wordmark className="col-start-2 row-start-1 justify-self-center lg:col-start-1 lg:justify-self-start" />

          <nav aria-label="Primary" className="col-start-2 row-start-1 hidden lg:block">
            <ul className="flex items-center gap-10">
              <li>
                <Link href={first.href} aria-current={current(first.href)} className={navLink}>
                  {first.label}
                </Link>
              </li>
              <li>
                <OccasionsMenu />
              </li>
              {rest.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} aria-current={current(l.href)} className={navLink}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="col-start-3 row-start-1 flex items-center justify-self-end lg:-mr-3">
            <HeaderSearch />
            <div className="hidden lg:block">
              <AccountMenu onSignIn={openSignIn} onIntent={() => void loadSignIn()} />
            </div>
            <Cart />
          </div>
        </div>
      </header>

      {menuOpen && (
        <MobileMenu
          onClose={() => setMenuOpen(false)}
          onSignIn={() => {
            signInFrom.current = burgerRef.current;
            setMenuOpen(false);
            setSignInOpen(true);
          }}
        />
      )}

      {signInOpen && (
        <SignInModal
          onClose={() => {
            setSignInOpen(false);
            const back = signInFrom.current;
            setTimeout(() => back?.focus(), 0);
          }}
        />
      )}
    </>
  );
}
