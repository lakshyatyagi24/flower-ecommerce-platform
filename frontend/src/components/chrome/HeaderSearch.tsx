"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CloseIcon, SearchIcon } from "./icons";
import { useDismiss } from "./use-modal";
import { focusRing, iconButton } from "./styles";

/** Search icon that opens a full-width search field under the header and submits to /products?q=. */
export default function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      setOpen(false);
    }
  }, [pathname]);

  const dismiss = useCallback((reason: "escape" | "outside") => {
    setOpen(false);
    if (reason === "escape") triggerRef.current?.focus();
  }, []);
  useDismiss(open, wrapRef, dismiss);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/products?q=${encodeURIComponent(q)}`);
  };

  return (
    <div ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Search"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={iconButton}
      >
        <SearchIcon />
      </button>
      {open && (
        <div id={panelId} className="chrome-fade absolute inset-x-0 top-full border-b border-stone-light bg-ivory">
          <form role="search" onSubmit={submit} className="mx-auto flex w-full max-w-[1280px] items-center gap-2 px-5 md:px-8">
            <label htmlFor={`${panelId}-q`} className="sr-only">
              Search flowers
            </label>
            <input
              id={`${panelId}-q`}
              ref={inputRef}
              type="search"
              role="searchbox"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search flowers, plants, occasions"
              autoComplete="off"
              enterKeyHint="search"
              className={`min-h-[64px] w-full bg-transparent font-display text-2xl text-charcoal placeholder:text-stone-dark focus:outline-none md:text-3xl`}
            />
            <button type="submit" aria-label="Submit search" className={iconButton}>
              <SearchIcon />
            </button>
            <button
              type="button"
              aria-label="Close search"
              onClick={() => dismiss("escape")}
              className={`${iconButton} ${focusRing}`}
            >
              <CloseIcon />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
