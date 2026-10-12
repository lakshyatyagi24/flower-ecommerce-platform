"use client";
import { useCart } from "@/lib/cart-context";
import { BagIcon } from "./chrome/icons";
import { iconButton } from "./chrome/styles";

/** Header bag button: opens the cart drawer; the count badge is hidden at 0. */
export default function Cart() {
  const { count, open } = useCart();
  const label = count > 0 ? `Open bag, ${count} ${count === 1 ? "item" : "items"}` : "Open bag";
  return (
    <button type="button" onClick={open} aria-label={label} className={`relative ${iconButton}`}>
      <BagIcon />
      {count > 0 && (
        <span
          data-testid="cart-badge"
          aria-hidden
          className="absolute right-0.5 top-1 flex h-[18px] min-w-[18px] items-center rounded-full justify-center bg-charcoal px-1 text-[10px] font-medium leading-none text-ivory"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
