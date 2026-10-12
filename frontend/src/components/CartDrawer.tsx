"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { useCart, formatINR, type CartItem } from "@/lib/cart-context";
import { productImage } from "@/lib/product-image";
import { useSettings } from "@/lib/settings-context";
import { CloseIcon } from "./chrome/icons";
import { focusRing, iconButton } from "./chrome/styles";
import { useModal } from "./chrome/use-modal";

const stepButton = `flex h-11 w-11 items-center justify-center text-lg leading-none text-charcoal transition-colors hover:bg-ivory-deep disabled:cursor-not-allowed disabled:text-stone disabled:hover:bg-transparent sm:h-9 sm:w-9 ${focusRing}`;

/** Free-shipping threshold from settings (`shipping.freeThreshold`); null when it is not configured. */
function freeShippingThreshold(raw: Record<string, string> | undefined): number | null {
  const v = raw?.["shipping.freeThreshold"]?.trim();
  if (!v) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function Line({ it }: { it: CartItem }) {
  const { setQuantity, remove, close } = useCart();
  const min = it.minOrderQty && it.minOrderQty > 0 ? it.minOrderQty : 1;
  const atMin = it.quantity <= min;
  const atMax = typeof it.stock === "number" && it.stock > 0 && it.quantity >= it.stock;
  return (
    <li className="flex gap-4 border-b border-stone-light py-5">
      <Link href={`/products/${it.slug}`} onClick={close} className={`relative block aspect-[4/5] w-[72px] shrink-0 overflow-hidden border border-stone-light bg-ivory-deep ${focusRing}`} tabIndex={-1} aria-hidden>
        <Image src={productImage(it)} alt="" fill sizes="72px" className="object-cover" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/products/${it.slug}`} onClick={close} className={`font-display text-xl leading-snug text-charcoal hover:text-moss ${focusRing}`}>
            {it.name}
          </Link>
          <span className="shrink-0 pt-0.5 text-[15px] text-charcoal">{formatINR(it.price * it.quantity)}</span>
        </div>
        <p className="mt-1 text-[13px] text-stone-dark">
          {formatINR(it.price)} each{min > 1 ? ` · minimum order ${min}` : ""}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center border border-stone-light">
            <button
              type="button"
              className={stepButton}
              disabled={atMin}
              aria-label={`Decrease quantity of ${it.name}`}
              onClick={() => setQuantity(it.productId, it.quantity - 1)}
            >
              −
            </button>
            <span aria-live="polite" aria-atomic="true" className="min-w-8 text-center text-sm tabular-nums text-charcoal">
              {it.quantity}
            </span>
            <button
              type="button"
              className={stepButton}
              disabled={atMax}
              aria-label={`Increase quantity of ${it.name}`}
              onClick={() => setQuantity(it.productId, it.quantity + 1)}
            >
              +
            </button>
          </div>
          <button
            type="button"
            aria-label={`Remove ${it.name}`}
            onClick={() => remove(it.productId)}
            className={`min-h-[44px] px-1 text-[13px] text-stone-dark underline underline-offset-4 hover:text-charcoal ${focusRing}`}
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

function Drawer() {
  const { items, close, count, subtotal, gstTotal } = useCart();
  const settings = useSettings();
  const ref = useRef<HTMLDivElement>(null);
  useModal(true, ref, close);

  const threshold = freeShippingThreshold(settings.raw);
  const remaining = threshold !== null ? Math.max(0, threshold - subtotal) : 0;

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
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-light pl-5 pr-2 sm:h-16 sm:pl-6 sm:pr-3">
          <h2 id="cart-title" className="font-display text-2xl text-charcoal">
            {count > 0 ? `Your bag (${count})` : "Your bag"}
          </h2>
          <button type="button" aria-label="Close bag" data-autofocus onClick={close} className={iconButton}>
            <CloseIcon />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <p className="font-display text-3xl text-charcoal">Your bag is empty</p>
            <p className="mt-3 max-w-xs text-[15px] text-stone-dark">Fresh stems are a few clicks away.</p>
            <Button href="/products" onClick={close} className="mt-8">
              Browse flowers
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-5 sm:px-6">
              {items.map((it) => (
                <Line key={it.productId} it={it} />
              ))}
            </ul>

            <div data-testid="cart-footer" className="shrink-0 border-t border-stone-light bg-ivory px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-6">
              {threshold !== null && (
                <div className="mb-4">
                  <p className="text-[13px] text-stone-dark">
                    {remaining > 0
                      ? `Add ${formatINR(remaining)} more for free shipping`
                      : "Your order qualifies for free shipping"}
                  </p>
                  <div aria-hidden className="mt-2 h-0.5 w-full bg-stone-light">
                    <div className="h-full bg-charcoal" style={{ width: `${Math.min(100, (subtotal / threshold) * 100)}%` }} />
                  </div>
                </div>
              )}
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
              <Button href="/checkout" onClick={close} size="lg" className="mt-5 w-full">
                Checkout
              </Button>
              <Button href="/products" onClick={close} variant="ghost" className="mt-1 w-full">
                Continue shopping
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const { isOpen } = useCart();
  return isOpen ? <Drawer /> : null;
}
