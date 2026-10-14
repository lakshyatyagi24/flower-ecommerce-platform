"use client";
import { useEffect, useId, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { focusRing } from "@/components/ui/form-styles";
import { normalizeCouponInput } from "@/lib/coupon";
import type { useCoupon } from "@/lib/use-coupon";

type CouponState = ReturnType<typeof useCoupon>;

/**
 * "Have a coupon code?" disclosure for the order summary. Collapsed by default; it opens by itself when there is
 * an error to show. Errors are inline (Field), never role=alert; applied / removed changes are announced through
 * one polite live region.
 */
export default function CouponField({ coupon, disabled = false }: { coupon: CouponState; disabled?: boolean }) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { applied, error, busy, input, setInput, apply, remove, announcement } = coupon;
  const expanded = open || Boolean(error);

  // After a rejected code the field is where the shopper needs to be.
  const lastError = useRef<string | null>(null);
  useEffect(() => {
    if (error && error !== lastError.current && !applied) inputRef.current?.focus();
    lastError.current = error;
  }, [error, applied]);

  return (
    <div className="mt-6 border-t border-stone-light pt-4" data-testid="coupon-field">
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="coupon-live">
        {announcement}
      </div>
      {applied ? (
        <div className="flex items-center justify-between gap-4 text-sm text-charcoal">
          <span>
            Coupon <strong className="font-medium">{applied.code}</strong> applied
          </span>
          <button
            type="button"
            onClick={remove}
            disabled={disabled}
            aria-label={`Remove coupon ${applied.code}`}
            className={`min-h-[44px] px-2 underline underline-offset-4 decoration-stone hover:decoration-charcoal ${focusRing}`}
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={() => setOpen((o) => !o)}
            className={`flex min-h-[44px] w-full items-center text-left text-sm text-charcoal ${focusRing}`}
          >
            <span className="underline underline-offset-4 decoration-stone">Have a coupon code?</span>
          </button>
          <div id={panelId} hidden={!expanded} className="mt-3">
            <Field label="Coupon code" id="checkout-coupon" error={error} quiet>
              <div className="flex gap-3">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(normalizeCouponInput(e.target.value).slice(0, 32))}
                  onKeyDown={(e) => {
                    // Enter here applies the coupon; it must not submit the checkout form.
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (!busy && !disabled) void apply();
                    }
                  }}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  disabled={disabled}
                />
                <Button type="button" variant="outline" onClick={() => void apply()} disabled={busy || disabled || !input} className="shrink-0">
                  {busy ? "Checking…" : "Apply"}
                </Button>
              </div>
            </Field>
          </div>
        </>
      )}
    </div>
  );
}
