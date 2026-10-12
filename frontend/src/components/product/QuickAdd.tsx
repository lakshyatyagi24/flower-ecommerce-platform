"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { minQty, toCartItem, type CartItemInput } from "@/lib/product-helpers";

/** Small "Add" text button for catalogue cards. Rendered OUTSIDE the card's anchor (valid HTML). */
export default function QuickAdd({ product }: { product: CartItemInput }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <button
      type="button"
      aria-label={`Add ${product.name} to bag`}
      onClick={() => {
        add(toCartItem(product), minQty(product));
        setAdded(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setAdded(false), 1800);
      }}
      className="min-h-[44px] bg-ivory/95 px-4 text-[13px] font-medium uppercase tracking-[0.12em] text-charcoal underline underline-offset-4 decoration-stone transition-opacity hover:decoration-charcoal focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-moss"
    >
      <span aria-live="polite">{added ? "Added" : "Add"}</span>
    </button>
  );
}
