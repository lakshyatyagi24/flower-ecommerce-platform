"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import EnquiryModal from "@/components/EnquiryModal";
import PincodeCheck from "@/components/PincodeCheck";
import { useCart } from "@/lib/cart-context";
import { availability, minQty, toCartItem } from "@/lib/product-helpers";
import type { ApiProduct } from "@/lib/api";

type BuyBoxProduct = Pick<
  ApiProduct,
  "id" | "slug" | "name" | "price" | "image" | "stock" | "saleMode" | "gstRate" | "minOrderQty" | "unit"
>;

const stepBtn =
  "flex h-11 w-11 items-center justify-center text-lg text-charcoal transition-colors hover:bg-ivory-deep " +
  "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-moss " +
  "disabled:cursor-not-allowed disabled:text-stone disabled:hover:bg-transparent";

export default function ProductBuyBox({ product }: { product: BuyBoxProduct }) {
  const { add } = useCart();
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  const min = minQty(product);
  const [quantity, setQuantity] = useState(min);

  const status = availability(product);
  const isEnquiry = status === "enquiry";
  const outOfStock = status === "out-of-stock";
  // Quantity runs from the minimum order up to stock, one at a time (same rule as the cart drawer).
  const max = product.stock > 0 ? product.stock : Infinity;
  const canDecrease = quantity > min;
  const canIncrease = quantity < max;

  if (isEnquiry) {
    return (
      <div>
        <p className="mb-5 text-sm leading-relaxed text-stone-dark">
          Made to order. Tell us the quantity, date and budget and we will call you back to confirm pricing and availability.
        </p>
        <Button size="lg" className="w-full" onClick={() => setEnquiryOpen(true)}>
          Enquire
        </Button>
        <EnquiryModal
          open={enquiryOpen}
          onClose={() => setEnquiryOpen(false)}
          productId={product.id}
          productName={product.name}
          source={`product:${product.slug}`}
          heading={`Enquire about ${product.name}`}
        />
      </div>
    );
  }

  if (outOfStock) {
    return (
      <div>
        <Button size="lg" className="w-full" disabled>
          Out of stock
        </Button>
        <p className="mt-3 text-sm text-stone-dark">This bloom is currently unavailable. Please check back soon.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-stretch gap-3">
        <div className="inline-flex items-center border border-stone-light rounded-sm" role="group" aria-label="Quantity">
          <button
            type="button"
            className={stepBtn}
            aria-label="Decrease quantity"
            disabled={!canDecrease}
            onClick={() => setQuantity((q) => Math.max(min, q - 1))}
          >
            −
          </button>
          <span data-testid="qty" aria-live="polite" className="min-w-10 text-center text-sm tabular-nums text-charcoal">
            {quantity}
          </span>
          <button
            type="button"
            className={stepBtn}
            aria-label="Increase quantity"
            disabled={!canIncrease}
            onClick={() => setQuantity((q) => Math.min(max, q + 1))}
          >
            +
          </button>
        </div>
        <Button
          size="lg"
          className="flex-1"
          onClick={() =>
            add(toCartItem(product), quantity)
          }
        >
          Add to bag
        </Button>
      </div>
      {(min > 1 || product.stock <= 10) && (
        <p className="mt-3 text-sm text-stone-dark">
          {min > 1 && (
            <span>
              Minimum order: {min} {product.unit || "units"}.{" "}
            </span>
          )}
          {product.stock <= 10 && <span>Only {product.stock} left.</span>}
        </p>
      )}
      <PincodeCheck className="mt-6 border-t border-stone-light pt-6" />
    </div>
  );
}
