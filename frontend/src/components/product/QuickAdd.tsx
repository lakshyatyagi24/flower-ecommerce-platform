"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import type { ApiProduct } from "@/lib/api";

type QuickAddProduct = Pick<
  ApiProduct,
  "id" | "slug" | "name" | "price" | "image" | "stock" | "saleMode" | "gstRate" | "minOrderQty"
>;

/** Small "Add" text button for catalogue cards. Rendered OUTSIDE the card's anchor (valid HTML). */
export default function QuickAdd({ product }: { product: QuickAddProduct }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const min = product.minOrderQty && product.minOrderQty > 0 ? product.minOrderQty : 1;

  return (
    <button
      type="button"
      aria-label={`Add ${product.name} to bag`}
      onClick={() => {
        add(
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image: product.image,
            saleMode: product.saleMode,
            gstRate: product.gstRate,
            minOrderQty: product.minOrderQty,
            stock: product.stock,
          },
          min,
        );
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
      }}
      className="min-h-[44px] bg-ivory/95 px-4 text-[13px] font-medium uppercase tracking-[0.12em] text-charcoal underline underline-offset-4 decoration-stone transition-opacity hover:decoration-charcoal focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-moss"
    >
      <span aria-live="polite">{added ? "Added" : "Add"}</span>
    </button>
  );
}
