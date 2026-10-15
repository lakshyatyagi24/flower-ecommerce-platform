"use client";

import React from "react";
import Image from "next/image";
import { formatINR } from "@/lib/cart-context";
import type { CartItem } from "@/lib/cart-context";
import { productImage } from "@/lib/product-image";
import { formatDeliveryDate } from "@/lib/delivery-date";
import { UNCONFIRMED_NOTE } from "@/lib/use-coupon";
import type { useCoupon } from "@/lib/use-coupon";
import CouponField from "@/components/CouponField";
import { Chevron } from "./checkout-parts";

export default function CheckoutSummaryAside({
  items,
  priceOf,
  itemsLabel,
  summaryOpen,
  setSummaryOpen,
  coupon,
  submitting,
  couponFloorMessage,
  errors,
  form,
  discount,
  liveSubtotal,
  shipping,
  liveGstTotal,
  total,
}: {
  items: CartItem[];
  priceOf: (it: CartItem) => number;
  itemsLabel: string;
  summaryOpen: boolean;
  setSummaryOpen: React.Dispatch<React.SetStateAction<boolean>>;
  coupon: ReturnType<typeof useCoupon>;
  submitting: boolean;
  couponFloorMessage: string | null;
  errors: { deliveryDate?: string };
  form: { deliveryDate: string };
  discount: number;
  liveSubtotal: number;
  shipping: number;
  liveGstTotal: number;
  total: number;
}) {
  return (
      <aside aria-label="Order summary" className="lg:sticky lg:top-28 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:self-start">
        <button
          type="button"
          aria-expanded={summaryOpen}
          aria-controls="checkout-summary-panel"
          onClick={() => setSummaryOpen((o) => !o)}
          className="flex min-h-14 w-full items-center justify-between gap-4 border-y border-stone-light py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss lg:hidden"
        >
          <span className="flex items-center gap-2 text-sm text-charcoal">
            Order summary ({itemsLabel})
            <Chevron open={summaryOpen} />
          </span>
          <span className="text-base text-charcoal">{formatINR(total)}</span>
        </button>

        <div id="checkout-summary-panel" className={`${summaryOpen ? "block" : "hidden"} pt-6 lg:block lg:bg-ivory-deep lg:p-8`}>
          <h2 className="mb-6 hidden font-display text-2xl text-charcoal lg:block">Order summary</h2>
          <ul className="space-y-5 lg:max-h-80 lg:overflow-y-auto">
            {items.map((it) => (
              <li key={it.productId} className="flex gap-4">
                <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-sm bg-ivory-deep lg:bg-ivory">
                  <Image src={productImage(it)} alt="" fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-charcoal">{it.name}</div>
                  <div className="mt-1 text-sm text-stone-dark">Qty {it.quantity}</div>
                </div>
                <div className="shrink-0 whitespace-nowrap text-sm text-charcoal">{formatINR(priceOf(it) * it.quantity)}</div>
              </li>
            ))}
          </ul>
          <CouponField coupon={coupon} disabled={submitting} notice={couponFloorMessage} />
          <dl className="mt-6 space-y-3 border-t border-stone-light pt-6 text-sm text-charcoal">
            {!errors.deliveryDate && (
              <div className="flex justify-between gap-4">
                <dt>Delivery date</dt>
                <dd className="text-right">{formatDeliveryDate(form.deliveryDate)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt>Subtotal</dt>
              <dd>{formatINR(liveSubtotal)}</dd>
            </div>
            {coupon.applied && coupon.unconfirmed && (
              <div className="flex justify-between gap-4" data-testid="checkout-discount">
                <dt>Discount ({coupon.applied.code})</dt>
                <dd className="text-right text-stone-dark">{UNCONFIRMED_NOTE}</dd>
              </div>
            )}
            {discount > 0 && coupon.applied && (
              <div className="flex justify-between gap-4" data-testid="checkout-discount">
                <dt>Discount ({coupon.applied.code})</dt>
                <dd>-{formatINR(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt>Shipping</dt>
              <dd>{shipping === 0 ? "Free" : formatINR(shipping)}</dd>
            </div>
            {liveGstTotal > 0 && (
              <div className="flex justify-between gap-4">
                <dt>GST</dt>
                <dd>{formatINR(liveGstTotal)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4 border-t border-stone-light pt-4 text-base">
              <dt>Total</dt>
              <dd className="font-display text-2xl">{formatINR(total)}</dd>
            </div>
          </dl>
        </div>
      </aside>
  );
}
