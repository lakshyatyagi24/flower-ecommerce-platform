"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Client-side pending UI for the catalogue. There is deliberately no loading.tsx (it would stream a 200
 * shell before an API error or 404 is known), so while a filter/sort/page navigation is in flight we dim
 * the grid (`[data-grid]`) and set aria-busy. Cleared when the query string changes.
 */
export default function ListingBusy({ children, basePath = "/products" }: { children: ReactNode; basePath?: string }) {
  const search = useSearchParams()?.toString() ?? "";
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setBusy(false);
  }, [search]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function start() {
    setBusy(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setBusy(false), 8000); // never stay dimmed if a navigation is cancelled
  }

  return (
    <div
      aria-busy={busy}
      className="[&_[data-grid]]:transition-opacity [&[aria-busy=true]_[data-grid]]:opacity-50"
      onClickCapture={(e) => {
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        const a = (e.target as HTMLElement).closest("a");
        if (!a || a.target === "_blank") return;
        const url = new URL(a.href, window.location.href);
        if (url.pathname === basePath && url.search !== window.location.search) start();
      }}
      onChangeCapture={() => start()}
    >
      {children}
    </div>
  );
}
