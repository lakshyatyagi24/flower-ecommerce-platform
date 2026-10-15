"use client";

import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { readStoredPincode, storePincode } from "@/lib/pincode-storage";
import { PIN_PATTERN } from "@/lib/checkout-validation";
import type { DeliveryOptions } from "@/lib/delivery-date";
import { FIELD_IDS, type CheckoutForm } from "./checkout-parts";

const PIN_RE = new RegExp(`^(?:${PIN_PATTERN})$`);

type SetForm = React.Dispatch<React.SetStateAction<CheckoutForm>>;

/** PIN serviceability check, focus handling and the PIN remembered from the product page. */
export function useCheckoutPin(form: CheckoutForm, setForm: SetForm) {
  // Serviceability for the PIN last checked. Only an explicit `serviceable:false` blocks; a failed request
  // (`unknown`) never does, because the backend enforces the same rule when the order is created.
  const [pinCheck, setPinCheck] = useState<{ pin: string; status: "ok" | "no" | "unknown"; message: string } | null>(null);
  const [pinFocusTick, setPinFocusTick] = useState(0);
  const latestPinRef = useRef("");
  const pinNow = form.postalCode.trim();
  const pinBlocked = pinCheck && pinCheck.pin === pinNow && pinCheck.status === "no" ? pinCheck.message : undefined;
  const checkPin = async (pin: string) => {
    if (!PIN_RE.test(pin)) return null;
    let next: { pin: string; status: "ok" | "no" | "unknown"; message: string };
    try {
      const res = await api.checkPincode(pin);
      // Only explicit booleans count; anything else (odd payload, timeout) is "unknown" and never blocks.
      const status = res?.serviceable === false ? "no" : res?.serviceable === true ? "ok" : "unknown";
      next = { pin, status, message: res?.message ?? "" };
      if (status === "ok") storePincode(pin);
    } catch {
      next = { pin, status: "unknown", message: "" };
    }
    // The shopper may have edited the PIN while this was in flight: a stale answer must not show.
    if (latestPinRef.current === pin) setPinCheck(next);
    return next;
  };
  useEffect(() => {
    latestPinRef.current = form.postalCode.trim();
  }, [form.postalCode]);
  // Focus the PIN field only after React has committed aria-invalid / aria-describedby for the new error.
  useEffect(() => {
    if (pinFocusTick > 0) document.getElementById(FIELD_IDS.postalCode)?.focus();
  }, [pinFocusTick]);
  // Prefill the PIN remembered from the product page, only when the field is still empty.
  useEffect(() => {
    const saved = readStoredPincode();
    if (saved) setForm((f) => (f.postalCode ? f : { ...f, postalCode: saved }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { pinCheck, setPinFocusTick, pinBlocked, checkPin };
}

/** Start on the earliest available date and follow it when the window advances. */
export function useDefaultDeliveryDate(deliveryOptions: DeliveryOptions | null, optionsRaw: unknown, setForm: SetForm) {
  // Start on the earliest available date; the shopper can move it. A real choice is kept, but a date still on the
  // old earliest (never moved) or now before the new earliest (the window advanced) follows the new earliest.
  const prevEarliestRef = useRef<string | null>(null);
  useEffect(() => {
    if (!deliveryOptions) return;
    const { earliest } = deliveryOptions;
    const prev = prevEarliestRef.current;
    prevEarliestRef.current = earliest;
    setForm((f) =>
      !f.deliveryDate || f.deliveryDate === prev || f.deliveryDate < earliest ? { ...f, deliveryDate: earliest } : f,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsRaw]);
}
