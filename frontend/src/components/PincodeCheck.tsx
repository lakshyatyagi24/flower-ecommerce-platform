"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { api } from "@/lib/api";
import { PIN_PATTERN } from "@/lib/checkout-validation";
import { readStoredPincode, storePincode } from "@/lib/pincode-storage";

const pinRe = new RegExp(`^(?:${PIN_PATTERN})$`);

type Result = { kind: "ok" | "no" | "neutral" | "unknown"; message: string };

/** "Can we deliver to you?" check. Client-only island: it never affects server-rendered product markup. */
export default function PincodeCheck({ className = "" }: { className?: string }) {
  const [pin, setPin] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Bumped on every new request and every edit, so an older response can never overwrite a newer state.
  const requestRef = useRef(0);

  useEffect(() => {
    const saved = readStoredPincode();
    if (saved) setPin((p) => p || saved);
  }, []);

  const check = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const value = pin.trim();
    setResult(null);
    if (!pinRe.test(value)) {
      requestRef.current += 1;
      setBusy(false);
      setFieldError("Enter a valid 6-digit PIN code");
      inputRef.current?.focus();
      return;
    }
    setFieldError(null);
    const id = ++requestRef.current;
    setBusy(true);
    let next: Result;
    try {
      const res = await api.checkPincode(value);
      if (res?.serviceable === true) {
        // Only claim delivery when a service area is actually configured; otherwise stay neutral.
        next =
          res.restricted === true
            ? { kind: "ok", message: `We deliver to ${value}.` }
            : { kind: "neutral", message: res.message };
      } else if (res?.serviceable === false) {
        next = { kind: "no", message: `We do not deliver to ${value} yet.` };
      } else {
        next = { kind: "unknown", message: "We couldn't check this PIN code right now. You can still continue; we confirm at checkout." };
      }
    } catch {
      next = { kind: "unknown", message: "We couldn't check this PIN code right now. You can still continue; we confirm at checkout." };
    }
    if (id !== requestRef.current) return;
    if (next.kind === "ok" || next.kind === "neutral") storePincode(value);
    setResult(next);
    setBusy(false);
  };

  return (
    <form onSubmit={check} noValidate className={className} aria-label="Check delivery to your PIN code">
      <div className="flex items-start gap-3">
        <Field label="Delivery PIN code" quiet error={fieldError} className="flex-1">
          <Input
            ref={inputRef}
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            pattern={PIN_PATTERN}
            value={pin}
            onChange={(e) => {
              requestRef.current += 1;
              setBusy(false);
              setPin(e.target.value.replace(/\D/g, ""));
              setResult(null);
              setFieldError(null);
            }}
          />
        </Field>
        {/* 1.75rem = label line height + its margin, so the button lines up with the input */}
        <Button type="submit" variant="outline" disabled={busy} className="mt-7">
          {busy ? "Checking…" : "Check"}
        </Button>
      </div>
      <div role="status" className="mt-2 min-h-5 text-sm text-charcoal">
        {result?.message}
      </div>
    </form>
  );
}
