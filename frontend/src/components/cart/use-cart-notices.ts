"use client";

import { useEffect, useRef, useState } from "react";
import type { CartItem } from "@/lib/cart-context";
import { fetchFreshProducts } from "@/lib/fresh-products";
import { applyReconciled, linesChanged, reconcileCart, type CartNotice } from "@/lib/reconcile-cart";

type ReplaceWith = (update: (prev: CartItem[]) => CartItem[]) => void;

/**
 * Revalidates the bag against current product data when the drawer opens (it mounts on open). This also runs
 * when cart.add opens the drawer; that re-fetch is cheap because fetchFreshProducts dedupes slugs, limits
 * parallelism to 3 and serves answers younger than 15s from a cache. A failed lookup never blocks anything:
 * that line just stays as it is.
 */
export function useCartNotices(items: CartItem[], replaceWith: ReplaceWith) {
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const [notices, setNotices] = useState<CartNotice[]>([]);
  useEffect(() => {
    const started = itemsRef.current;
    if (started.length === 0) return;
    let cancelled = false;
    fetchFreshProducts(started)
      .then(({ fresh, unverified }) => {
        if (cancelled) return;
        const latest = itemsRef.current;
        const asked = new Set(started.map((l) => l.productId));
        // A line added while the lookup was running was never asked about: leave it alone.
        const skip = [...unverified, ...latest.filter((l) => !asked.has(l.productId)).map((l) => l.productId)];
        const result = reconcileCart(latest, fresh, { unverified: skip });
        if (linesChanged(latest, result.lines)) replaceWith((prev) => applyReconciled(prev, latest, result.lines));
        setNotices(result.notices);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Changing a quantity answers the adjustment notice for that line (it described the old quantity).
  const answerNotices = (productId: number) =>
    setNotices((prev) => prev.filter((n) => n.productId !== productId || n.blocking));
  const liveNotices = notices.filter((n) => items.some((i) => i.productId === n.productId));
  const noticesFor = (id: number) => liveNotices.filter((n) => n.productId === id);
  const blockedCount = new Set(liveNotices.filter((n) => n.blocking).map((n) => n.productId)).size;
  return { liveNotices, noticesFor, blockedCount, answerNotices };
}
