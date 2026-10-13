"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { api } from "@/lib/api";
import { PIN_PATTERN } from "@/lib/checkout-validation";
import { readStoredPincode, storePincode } from "@/lib/pincode-storage";

const pinRe = new RegExp(`^(?:${PIN_PATTERN})$`);

type Result = { kind: "ok" | "no" | "unknown"; message: string };

/** "Can we deliver to you?" check. Client-only island: it never affects server-rendered product markup. */
export default function PincodeCheck({ className = "" }: { className?: string }) {
  const [pin, setPin] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = readStoredPincode();
    if (saved) setPin((p) => p || saved);
  }, []);

  const check = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const value = pin.trim();
    setResult(null);
    if (!pinRe.test(value)) {
      setFieldError("Enter a valid 6-digit PIN code");
      return;
    }
    setFieldError(null);
    setBusy(true);
    try {
      const res = await api.checkPincode(value);
      storePincode(value);
      setResult({ kind: res.serviceable ? "ok" : "no", message: res.message });
    } catch {
      setResult({ kind: "unknown", message: "We couldn't check this PIN code right now. You can still continue; we confirm at checkout." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={check} noValidate className={className} aria-label="Check delivery to your PIN code">
      <div className="flex items-end gap-3">
        <Field label="Delivery PIN code" error={fieldError} className="flex-1">
          <Input
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            pattern={PIN_PATTERN}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ""));
              setResult(null);
              setFieldError(null);
            }}
          />
        </Field>
        <Button type="submit" variant="outline" disabled={busy}>
          {busy ? "Checking…" : "Check"}
        </Button>
      </div>
      <div role="status" className="mt-2 text-sm text-charcoal">
        {result?.message}
      </div>
    </form>
  );
}
