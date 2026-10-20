"use client";

import { useMemo } from "react";
import type { CartItem } from "@/lib/cart-context";
import { belowFloorMessage, gstAfterDiscount, totalAfterDiscount } from "@/lib/coupon";
import { parseFlatRate, parseFreeThreshold, shippingFor } from "@/lib/shipping";
import type { useCoupon } from "@/lib/use-coupon";

type Coupon = ReturnType<typeof useCoupon>;

type TotalsInput = {
  items: CartItem[];
  count: number;
  liveSubtotal: number;
  freshPrices: unknown;
  priceOf: (it: CartItem) => number;
  gstRateOf: (it: CartItem) => number;
  settings: Record<string, string>;
  coupon: Coupon;
  gateMessage: string | null;
};

/** Shipping, GST, total and the order gate, mirroring the backend rules (see lib/shipping.ts and lib/coupon.ts). */
export function useCheckoutTotals(input: TotalsInput) {
  const { items, count, liveSubtotal, freshPrices, priceOf, gstRateOf, settings, coupon, gateMessage } = input;
  const discount = coupon.discount;
  // GST is charged on the value AFTER the discount, spread over the lines exactly as the server does it.
  const liveGstTotal = useMemo(
    () => gstAfterDiscount(items.map((it) => ({ lineTotal: priceOf(it) * it.quantity, gstRate: gstRateOf(it) })), discount),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, freshPrices, discount],
  );
  // Threshold "0" => every order ships free.
  const flatRate = parseFlatRate(settings["shipping.flatRate"]);
  const freeThreshold = parseFreeThreshold(settings["shipping.freeThreshold"]);
  const shipping = useMemo(
    () => (count === 0 ? 0 : shippingFor(liveSubtotal, flatRate, freeThreshold)),
    [liveSubtotal, count, flatRate, freeThreshold],
  );
  // Shipping is judged on the pre-discount subtotal; the discount reduces the items and their GST.
  const total = totalAfterDiscount(liveSubtotal, discount, shipping, liveGstTotal);
  // The server refuses a discounted order whose total is below the floor. Say so and hold the order, but keep
  // the coupon: the shopper can add items or remove it.
  const belowFloor = coupon.applied && discount > 0 && total < coupon.applied.minTotal;
  const couponFloorMessage = belowFloor && coupon.applied ? belowFloorMessage(coupon.applied.minTotal) : null;
  return { discount, liveGstTotal, shipping, total, couponFloorMessage, blockMessage: gateMessage ?? couponFloorMessage };
}
