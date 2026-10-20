"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart, formatINR, type CartItem } from "@/lib/cart-context";
import { minOrderCopy, stepDown, stepUp } from "@/lib/product-helpers";
import { productImage } from "@/lib/product-image";
import type { CartNotice } from "@/lib/reconcile-cart";
import { focusRing } from "../chrome/styles";

const stepButton = `flex h-11 w-11 items-center justify-center text-lg leading-none text-charcoal transition-colors hover:bg-ivory-deep aria-disabled:cursor-not-allowed aria-disabled:text-stone aria-disabled:hover:bg-transparent sm:h-9 sm:w-9 ${focusRing}`;

type OnQuantity = (productId: number, quantity: number) => void;

/**
 * The focused Remove button is about to unmount: hand focus to the next line's Remove button, else the
 * previous one, else the Close button.
 */
function handOffFocus(button: HTMLElement) {
  const dialog = button.closest("[role=dialog]");
  const all = Array.from((dialog ?? document).querySelectorAll<HTMLElement>("[data-remove]"));
  const i = all.indexOf(button);
  const fallback = dialog?.querySelector("[data-autofocus]") as HTMLElement | null | undefined;
  (all[i + 1] ?? all[i - 1] ?? fallback)?.focus();
}

function LineNotices({ id, notices }: { id: string; notices: CartNotice[] }) {
  if (notices.length === 0) return null;
  return (
    <div id={id} data-testid="line-notice">
      {notices.map((n) => (
        <p key={n.kind} className="mt-1 text-[13px] text-charcoal">
          {n.message}
          {n.blocking ? " Remove it to check out." : ""}
        </p>
      ))}
    </div>
  );
}

function QuantityStepper({ it, onQuantity }: { it: CartItem; onQuantity: OnQuantity }) {
  const min = it.minOrderQty && it.minOrderQty > 0 ? it.minOrderQty : 1;
  // Steps by the minimum order; the last step up lands exactly on stock (the server enforces only min..stock).
  const stock = typeof it.stock === "number" && it.stock > 0 ? it.stock : 0;
  const atMin = it.quantity <= min;
  const atMax = stock > 0 && it.quantity >= stock;
  return (
    <div className="flex items-center border border-stone-light">
      <button
        type="button"
        className={stepButton}
        aria-disabled={atMin ? "true" : undefined}
        aria-label={`Decrease quantity of ${it.name}`}
        onClick={() => !atMin && onQuantity(it.productId, stepDown(it.quantity, min))}
      >
        −
      </button>
      <span aria-live="polite" aria-atomic="true" className="min-w-8 text-center text-sm tabular-nums text-charcoal">
        {it.quantity}
      </span>
      <button
        type="button"
        className={stepButton}
        aria-disabled={atMax ? "true" : undefined}
        aria-label={`Increase quantity of ${it.name}`}
        onClick={() => !atMax && onQuantity(it.productId, stepUp(it.quantity, min, stock))}
      >
        +
      </button>
    </div>
  );
}

type RemoveButtonProps = { it: CartItem; describedBy: string | undefined; blocked: boolean };

function RemoveButton({ it, describedBy, blocked }: RemoveButtonProps) {
  const { remove } = useCart();
  return (
    <button
      type="button"
      aria-label={`Remove ${it.name}`}
      aria-describedby={describedBy}
      data-remove
      onClick={(e) => {
        handOffFocus(e.currentTarget);
        remove(it.productId);
      }}
      className={`min-h-[44px] px-1 text-[13px] underline underline-offset-4 hover:text-charcoal ${blocked ? "font-medium text-charcoal" : "text-stone-dark"} ${focusRing}`}
    >
      Remove
    </button>
  );
}

type LineProps = { it: CartItem; notices: CartNotice[]; onQuantity: OnQuantity };

export default function CartLine({ it, notices, onQuantity }: LineProps) {
  const { close } = useCart();
  const min = it.minOrderQty && it.minOrderQty > 0 ? it.minOrderQty : 1;
  const bunch = minOrderCopy(min, it.unit);
  const noticeId = `cart-notice-${it.productId}`;
  const href = `/products/${it.slug}`;
  return (
    <li className="flex gap-4 border-b border-stone-light py-5">
      <Link href={href} onClick={close} className={`relative block aspect-[4/5] w-[72px] shrink-0 overflow-hidden border border-stone-light bg-ivory-deep ${focusRing}`} tabIndex={-1} aria-hidden>
        <Image src={productImage(it)} alt="" fill sizes="72px" className="object-cover" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link href={href} onClick={close} className={`font-display text-xl leading-snug text-charcoal hover:text-moss ${focusRing}`}>
            {it.name}
          </Link>
          <span className="shrink-0 pt-0.5 text-[15px] text-charcoal">{formatINR(it.price * it.quantity)}</span>
        </div>
        <p className="mt-1 text-[13px] text-stone-dark">
          {formatINR(it.price)} each{bunch ? ` · ${bunch}` : ""}
        </p>
        <LineNotices id={noticeId} notices={notices} />
        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantityStepper it={it} onQuantity={onQuantity} />
          <RemoveButton
            it={it}
            describedBy={notices.length > 0 ? noticeId : undefined}
            blocked={notices.some((n) => n.blocking)}
          />
        </div>
      </div>
    </li>
  );
}
