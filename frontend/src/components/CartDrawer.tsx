"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useCart, formatINR } from "@/lib/cart-context";

export default function CartDrawer() {
  const { items, isOpen, close, count, subtotal, setQuantity, remove } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex" role="dialog" aria-modal="true" aria-labelledby="cart-title">
      <button
        type="button"
        onClick={close}
        aria-label="Close cart"
        className="absolute inset-0 bg-black/40"
      />
      <aside className="ml-auto relative h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        <header className="flex items-center justify-between px-5 py-4 border-b border-olive-green/10">
          <h2 id="cart-title" className="text-lg font-semibold text-olive-green">
            Your cart {count > 0 && <span className="text-sm text-olive-green/70">({count})</span>}
          </h2>
          <button
            onClick={close}
            aria-label="Close"
            className="text-olive-green/70 hover:text-olive-green text-2xl leading-none"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-700">Your cart is empty.</p>
              <Link
                href="/products"
                onClick={close}
                className="mt-4 inline-block text-olive-green font-semibold underline-offset-4 hover:underline"
              >
                Browse our florals
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((it) => (
                <li key={it.productId} className="flex gap-4 border-b border-olive-green/10 pb-4">
                  <div className="relative w-20 h-20 flex-shrink-0 bg-slate-100 rounded-md overflow-hidden">
                    {it.image ? (
                      <Image src={it.image} alt={it.name} fill sizes="80px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🌸</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${it.slug}`}
                      onClick={close}
                      className="font-medium text-slate-900 hover:text-olive-green truncate block"
                    >
                      {it.name}
                    </Link>
                    <div className="text-sm text-olive-green font-semibold mt-1">{formatINR(it.price)}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(it.productId, it.quantity - 1)}
                        className="w-7 h-7 rounded border border-olive-green/20 hover:bg-olive-green/5 text-olive-green"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{it.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(it.productId, it.quantity + 1)}
                        className="w-7 h-7 rounded border border-olive-green/20 hover:bg-olive-green/5 text-olive-green"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(it.productId)}
                        className="ml-auto text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-olive-green/10 p-5 space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-700">
              <span>Subtotal</span>
              <span className="text-base font-semibold text-olive-green">{formatINR(subtotal)}</span>
            </div>
            <p className="text-xs text-olive-green/70">Shipping calculated at checkout.</p>
            <Link
              href="/checkout"
              onClick={close}
              className="block w-full text-center bg-olive-green text-white px-6 py-3 rounded-full font-semibold hover:opacity-95"
            >
              Checkout
            </Link>
            <Link
              href="/products"
              onClick={close}
              className="block text-center text-sm text-olive-green underline-offset-4 hover:underline"
            >
              Continue shopping
            </Link>
          </footer>
        )}
      </aside>
    </div>
  );
}
