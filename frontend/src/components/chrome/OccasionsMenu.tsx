"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { api, type ApiCategory } from "@/lib/api";
import { shownCategories } from "@/lib/categories";
import { OCCASIONS } from "@/lib/occasions";
import { ChevronIcon } from "./icons";
import { useDismiss } from "./use-modal";
import { useCloseOnRouteChange } from "./use-route-change";
import { focusRing, navLink } from "./styles";

const OPEN_DELAY = 120;
const CLOSE_DELAY = 200;

const canHover = () => typeof window.matchMedia !== "function" || window.matchMedia("(hover: hover)").matches;

const panelLink = `inline-block py-1.5 text-charcoal transition-colors duration-200 hover:text-moss ${focusRing}`;

/**
 * Desktop "Occasions" dropdown: a full-width hairline panel under the header with two columns.
 * The occasion links are static (always in the DOM, hidden while closed, so crawlers see them); the
 * categories are fetched lazily the first time the menu opens and fail silently to a static link.
 */
export default function OccasionsMenu() {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<ApiCategory[] | null>(null);
  const requested = useRef(false);
  // True while the menu is open because of hover intent: the click that follows must not close it.
  const openedByHover = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const schedule = (next: boolean, delay: number) => {
    clearTimer();
    timer.current = setTimeout(() => {
      openedByHover.current = next;
      setOpen(next);
    }, delay);
  };

  useEffect(() => clearTimer, []);

  // Lazy, once: the first open fetches the categories. Failure leaves the static link in place.
  useEffect(() => {
    if (!open || requested.current) return;
    requested.current = true;
    api
      .listCategories()
      .then((list) => setCategories(shownCategories(list)))
      .catch(() => setCategories([]));
  }, [open]);

  useCloseOnRouteChange(() => {
    clearTimer();
    openedByHover.current = false;
    setOpen(false);
  });

  const dismiss = useCallback((reason: "escape" | "outside") => {
    clearTimer();
    openedByHover.current = false;
    setOpen(false);
    if (reason === "escape") triggerRef.current?.focus();
  }, []);
  useDismiss(open, wrapRef, dismiss);

  return (
    <div
      ref={wrapRef}
      onMouseEnter={() => canHover() && schedule(true, OPEN_DELAY)}
      onMouseLeave={() => canHover() && schedule(false, CLOSE_DELAY)}
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        if (next && wrapRef.current && !wrapRef.current.contains(next)) {
          clearTimer();
          openedByHover.current = false;
          setOpen(false);
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={(e) => {
          clearTimer();
          // A mouse click right after a hover-open confirms the menu instead of closing it. A keyboard
          // activation (detail 0) always toggles.
          if (openedByHover.current && open && e.detail > 0) {
            openedByHover.current = false;
            return;
          }
          openedByHover.current = false;
          setOpen((v) => !v);
        }}
        className={`${navLink} gap-1.5`}
      >
        Occasions
        <ChevronIcon className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="chrome-fade absolute inset-x-0 top-full border-b border-stone-light bg-ivory"
      >
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-4 gap-x-10 px-8 pb-12 pt-10">
          <div className="col-span-2">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-dark">Shop by occasion</p>
            <ul className="mt-5 columns-2 gap-x-10 font-display text-[22px] leading-tight">
              {OCCASIONS.map((o) => (
                <li key={o.slug} className="break-inside-avoid">
                  <Link href={`/occasions/${o.slug}`} className={panelLink}>
                    {o.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-dark">Shop by flower</p>
            <ul className="mt-5 text-[15px]">
              <li>
                <Link href="/products" className={panelLink}>
                  All flowers
                </Link>
              </li>
              {(categories ?? []).map((c) => (
                <li key={c.id}>
                  <Link href={`/collections/${c.slug}`} className={panelLink}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
