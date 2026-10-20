"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { formatINR } from "@/lib/cart-context";

/** Free-shipping threshold from settings (`shipping.freeThreshold`); null when it is not configured. */
export function freeShippingThreshold(raw: Record<string, string> | undefined): number | null {
  const v = raw?.["shipping.freeThreshold"]?.trim();
  if (!v) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function ShippingProgress({ threshold, subtotal }: { threshold: number; subtotal: number }) {
  const remaining = Math.max(0, threshold - subtotal);
  return (
    <div className="mb-4">
      <p className="text-[13px] text-stone-dark">
        {remaining > 0 ? `Add ${formatINR(remaining)} more for free shipping` : "Your order qualifies for free shipping"}
      </p>
      <div aria-hidden className="mt-2 h-1 w-full bg-stone-light">
        <div data-testid="shipping-progress-fill" className="h-full bg-moss" style={{ width: `${Math.min(100, (subtotal / threshold) * 100)}%` }} />
      </div>
    </div>
  );
}

function BlockedNotice({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <p className="mt-2 text-[13px] text-charcoal">
      {count === 1 ? "One item in your bag" : `${count} items in your bag`} can&apos;t be ordered right now. Remove {count === 1 ? "it" : "them"} to check out.
    </p>
  );
}

type CartFooterProps = {
  subtotal: number;
  gstTotal: number;
  threshold: number | null;
  blockedCount: number;
  onClose: () => void;
};

export default function CartFooter({ subtotal, gstTotal, threshold, blockedCount, onClose }: CartFooterProps) {
  return (
    <div data-testid="cart-footer" className="shrink-0 border-t border-stone-light bg-ivory px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-6">
      {threshold !== null && <ShippingProgress threshold={threshold} subtotal={subtotal} />}
      <dl className="space-y-1.5 text-[15px] text-charcoal">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatINR(subtotal)}</dd>
        </div>
        {gstTotal > 0 && (
          <div className="flex justify-between text-stone-dark">
            <dt>GST</dt>
            <dd>{formatINR(gstTotal)}</dd>
          </div>
        )}
      </dl>
      <p className="mt-2 text-[13px] text-stone-dark">Shipping is calculated at checkout.</p>
      <BlockedNotice count={blockedCount} />
      <Button href="/checkout" onClick={onClose} size="lg" className="mt-5 w-full">
        Checkout
      </Button>
      <Button href="/products" onClick={onClose} variant="ghost" className="mt-1 w-full">
        Continue shopping
      </Button>
    </div>
  );
}
