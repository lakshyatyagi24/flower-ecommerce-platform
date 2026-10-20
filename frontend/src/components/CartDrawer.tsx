"use client";

import { useRef } from "react";
import Button from "@/components/ui/Button";
import { useCart } from "@/lib/cart-context";
import { useSettings } from "@/lib/settings-context";
import CartFooter, { freeShippingThreshold } from "./cart/CartFooter";
import CartLine from "./cart/CartLine";
import { useCartNotices } from "./cart/use-cart-notices";
import { CloseIcon } from "./chrome/icons";
import { iconButton } from "./chrome/styles";
import { useModal } from "./chrome/use-modal";

function EmptyBag({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <p className="font-display text-3xl text-charcoal">Your bag is empty</p>
      <p className="mt-3 max-w-xs text-[15px] text-stone-dark">Fresh stems are a few clicks away.</p>
      <Button href="/products" onClick={onClose} className="mt-8">
        Browse flowers
      </Button>
    </div>
  );
}

function DrawerHeader({ count, onClose }: { count: number; onClose: () => void }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-light pl-5 pr-2 sm:h-16 sm:pl-6 sm:pr-3">
      <h2 id="cart-title" className="font-display text-2xl text-charcoal">
        {count > 0 ? `Your bag (${count})` : "Your bag"}
      </h2>
      <button type="button" aria-label="Close bag" data-autofocus onClick={onClose} className={iconButton}>
        <CloseIcon />
      </button>
    </header>
  );
}

type BagContentsProps = { notices: ReturnType<typeof useCartNotices>; onClose: () => void };

function BagContents({ notices, onClose }: BagContentsProps) {
  const { items, subtotal, gstTotal, setQuantity } = useCart();
  const settings = useSettings();
  const { liveNotices, noticesFor, blockedCount, answerNotices } = notices;
  const changeQuantity = (productId: number, quantity: number) => {
    answerNotices(productId);
    setQuantity(productId, quantity);
  };
  return (
    <>
      {/* Always mounted so a screen reader announces notices that arrive after the lookup finishes. */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="cart-notices-live">
        {liveNotices.map((n) => `${n.name}: ${n.message}`).join(" ")}
      </div>
      <ul className="flex-1 overflow-y-auto px-5 sm:px-6">
        {items.map((it) => (
          <CartLine key={it.productId} it={it} notices={noticesFor(it.productId)} onQuantity={changeQuantity} />
        ))}
      </ul>
      <CartFooter
        subtotal={subtotal}
        gstTotal={gstTotal}
        threshold={freeShippingThreshold(settings.raw)}
        blockedCount={blockedCount}
        onClose={onClose}
      />
    </>
  );
}

function Drawer() {
  const { items, close, count, replaceWith } = useCart();
  const ref = useRef<HTMLDivElement>(null);
  useModal(true, ref, close);
  // Runs once when the drawer opens, whether or not the bag is empty at that moment.
  const notices = useCartNotices(items, replaceWith);
  return (
    <div className="fixed inset-0 z-[60]">
      <div data-testid="cart-overlay" aria-hidden="true" onClick={close} className="chrome-fade absolute inset-0 bg-charcoal/40" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        tabIndex={-1}
        className="drawer-in absolute right-0 top-0 flex h-full w-full flex-col border-l border-stone-light bg-ivory outline-none sm:w-[440px]"
      >
        <DrawerHeader count={count} onClose={close} />
        {items.length === 0 ? <EmptyBag onClose={close} /> : <BagContents notices={notices} onClose={close} />}
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const { isOpen } = useCart();
  return isOpen ? <Drawer /> : null;
}
