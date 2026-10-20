"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ApiProduct } from "@/lib/api";
import type { CartItem } from "@/lib/cart-context";
import { fetchFreshProducts } from "@/lib/fresh-products";
import {
  adjustmentNotices,
  applyReconciled,
  blockingNotices,
  linesChanged,
  reconcileCart,
  type CartNotice,
} from "@/lib/reconcile-cart";
import { useApi } from "@/lib/use-api";
import { mergeNotices, summarizeChanges } from "./checkout-logic";

type ReplaceWith = (fn: (prev: CartItem[]) => CartItem[]) => void;
type PriceMap = Record<number, { price: number; gstRate: number }>;

async function loadLivePrices(items: CartItem[]) {
  const res = await fetchFreshProducts(items, { maxAgeMs: 0 });
  if (res.failed) throw new Error("Could not load current prices");
  const map: PriceMap = {};
  for (const p of res.fresh) map[p.id] = { price: p.price, gstRate: p.gstRate ?? 0 };
  return { map, fresh: res.fresh };
}

/** Same reconcile as the cart drawer: fixable differences are applied to the bag and listed for the shopper. */
function useAdjustments(items: CartItem[], replaceWith: ReplaceWith) {
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const [adjustments, setAdjustments] = useState<CartNotice[]>([]);
  const noteAdjustments = (found: CartNotice[]) => {
    if (found.length > 0) setAdjustments((prev) => mergeNotices(prev, found));
  };
  const applyFresh = (fresh: ApiProduct[]) => {
    const latest = itemsRef.current;
    const result = reconcileCart(latest, fresh);
    if (linesChanged(latest, result.lines)) replaceWith((prev) => applyReconciled(prev, latest, result.lines));
    noteAdjustments(adjustmentNotices(result.notices));
  };
  return { adjustments, setAdjustments, noteAdjustments, applyFresh };
}

/**
 * Live prices re-fetched at checkout time. The backend charges the current DB price, so these (not the prices
 * cached in the cart at add-time) are displayed, and any change is surfaced for the shopper to accept.
 * A product that no longer exists is simply absent from `fresh` (reconcileCart flags it); any other failure
 * aborts, so an order can never be submitted against stale prices.
 */
export function useCheckoutPricing(items: CartItem[], replaceWith: ReplaceWith) {
  const productKey = items.map((i) => i.productId).sort((a, b) => a - b).join(",");
  const { data: pricing, error: pricesError, loading: pricesLoading, reload: reloadPrices } = useApi(
    () => loadLivePrices(items),
    [productKey],
  );
  const freshPrices: PriceMap = pricing?.map ?? {};
  const { adjustments, setAdjustments, noteAdjustments, applyFresh } = useAdjustments(items, replaceWith);
  useEffect(() => {
    if (pricing) applyFresh(pricing.fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricing]);
  const blocking = useMemo(
    () => (pricing ? blockingNotices(reconcileCart(items, pricing.fresh).notices) : []),
    [items, pricing],
  );
  const shownAdjustments = adjustments.filter((a) => items.some((i) => i.productId === a.productId));
  const { changesSummary, gateMessage } = summarizeChanges(blocking.length, shownAdjustments.length);

  const priceOf = (it: CartItem) => freshPrices[it.productId]?.price ?? it.price;
  const gstRateOf = (it: CartItem) => freshPrices[it.productId]?.gstRate ?? it.gstRate ?? 0;
  const liveSubtotal = useMemo(
    () => items.reduce((s, it) => s + priceOf(it) * it.quantity, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, freshPrices],
  );

  return {
    pricing,
    pricesError,
    pricesLoading,
    reloadPrices,
    freshPrices,
    blocking,
    shownAdjustments,
    setAdjustments,
    noteAdjustments,
    changesSummary,
    gateMessage,
    priceOf,
    gstRateOf,
    liveSubtotal,
  };
}
