"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { focusRing } from "@/components/ui/form-styles";
import type { CartNotice } from "@/lib/reconcile-cart";

export default function ChangesPanel({
  blocking,
  shownAdjustments,
  remove,
  setAdjustments,
}: {
  blocking: CartNotice[];
  shownAdjustments: CartNotice[];
  remove: (productId: number) => void;
  setAdjustments: (a: CartNotice[]) => void;
}) {
  return (
    <>
                        <section data-testid="checkout-changes" aria-labelledby="checkout-changes-title" className="border border-charcoal px-5 py-4 text-sm text-charcoal">
              <h2 id="checkout-changes-title" className="font-display text-xl">
                {blocking.length > 0 ? "Some items need attention" : "Your order changed"}
              </h2>
              <ul className="mt-3 space-y-3">
                {blocking.map((n) => (
                  <li key={`${n.productId}-${n.kind}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <span>
                      <strong className="font-medium">{n.name}</strong>: {n.message}
                    </span>
                    <button
                      type="button"
                      data-checkout-remove
                      aria-label={`Remove ${n.name} from your bag`}
                      onClick={(e) => {
                        const all = Array.from(document.querySelectorAll<HTMLElement>("[data-checkout-remove]"));
                        const i = all.indexOf(e.currentTarget);
                        (all[i + 1] ?? all[i - 1] ?? document.getElementById("checkout-heading"))?.focus();
                        remove(n.productId);
                      }}
                      className={`min-h-[44px] px-1 underline underline-offset-4 hover:text-moss ${focusRing}`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
                {shownAdjustments.map((n) => (
                  <li key={`${n.productId}-${n.kind}`}>
                    <strong className="font-medium">{n.name}</strong>: {n.message}
                  </li>
                ))}
              </ul>
              {blocking.length === 0 && (
                <Button type="button" variant="outline" className="mt-4" onClick={() => setAdjustments([])}>
                  Accept changes
                </Button>
              )}
            </section>
    </>
  );
}
