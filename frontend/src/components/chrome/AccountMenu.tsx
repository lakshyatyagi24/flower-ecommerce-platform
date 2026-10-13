"use client";
import { useCallback, useId, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { UserIcon } from "./icons";
import { useDismiss } from "./use-modal";
import { useCloseOnRouteChange } from "./use-route-change";
import { focusRing, iconButton } from "./styles";

const item = `flex min-h-[44px] w-full items-center px-4 text-left text-sm text-charcoal transition-colors hover:bg-ivory-deep ${focusRing}`;

/**
 * Account control. Guests: an icon button that asks the parent to open the sign-in modal.
 * Signed in: an initial that opens a small hairline menu (My orders, Track order, Sign out).
 */
export default function AccountMenu({ onSignIn, onIntent }: { onSignIn: (trigger: HTMLElement | null) => void; onIntent?: () => void }) {
  const { user, logout } = useAuth();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const dismiss = useCallback((reason: "escape" | "outside") => {
    setOpen(false);
    if (reason === "escape") triggerRef.current?.focus();
  }, []);
  useDismiss(open, wrapRef, dismiss);

  useCloseOnRouteChange(() => setOpen(false));

  if (!user) {
    return (
      <button
        ref={triggerRef}
        type="button"
        aria-label="Sign in"
        aria-haspopup="dialog"
        onClick={() => onSignIn(triggerRef.current)}
        onPointerEnter={onIntent}
        onFocus={onIntent}
        className={iconButton}
      >
        <UserIcon />
      </button>
    );
  }

  const name = user.name?.trim() || user.email.split("@")[0];
  const initial = name.charAt(0).toUpperCase();

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Account, ${name}`}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={iconButton}
      >
        <span aria-hidden className="flex h-7 w-7 items-center justify-center border border-charcoal text-xs font-medium">
          {initial}
        </span>
      </button>
      {open && (
        <div id={menuId} className="chrome-fade absolute right-0 top-full z-50 mt-1 w-60 border border-stone-light bg-ivory">
          <p className="truncate border-b border-stone-light px-4 py-3 text-xs text-stone-dark">{user.email}</p>
          <Link href="/account/orders" className={item}>
            My orders
          </Link>
          <Link href="/track-order" className={item}>
            Track order
          </Link>
          <button
            type="button"
            className={`${item} border-t border-stone-light`}
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
