"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DeliveryOptions } from "@/lib/delivery-date";
import { buildSummaryItems, computeErrors } from "./checkout-logic";
import type { CheckoutForm, FieldName } from "./checkout-parts";

const EMPTY_FORM: CheckoutForm = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  shippingAddress: "",
  city: "",
  postalCode: "",
  deliveryDate: "",
  notes: "",
  paymentMethod: "RAZORPAY",
};

type FormUser = { name?: string | null; email: string; phone?: string | null } | null;

/** The form values, with the signed-in customer's details filled in. */
export function useCheckoutForm(user: FormUser) {
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      customerName: f.customerName || user.name || "",
      // A guest who signs in mid-form: the order is tied to the account email, so show that one.
      customerEmail: user.email,
      customerPhone: f.customerPhone || user.phone || "",
    }));
  }, [user]);
  const update = (key: keyof CheckoutForm, value: string) => setForm((f) => ({ ...f, [key]: value }));
  return { form, setForm, update };
}

type ValidationInput = {
  form: CheckoutForm;
  deliveryOptions: DeliveryOptions | null;
  optionsRaw: unknown;
  pinBlocked: string | undefined;
};

/**
 * Inline validation: a field shows its error once it was blurred or a submit was attempted.
 * `bumpFocus` moves focus to the error summary after a failed submit (validation or server error).
 */
export function useCheckoutValidation({ form, deliveryOptions, optionsRaw, pinBlocked }: ValidationInput) {
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [focusTick, setFocusTick] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const errors = useMemo(() => computeErrors(form, deliveryOptions), [form, optionsRaw]);
  const fieldError = (k: FieldName) =>
    touched[k] || attempted ? errors[k] ?? (k === "postalCode" ? pinBlocked : undefined) : undefined;
  const summaryItems = attempted ? buildSummaryItems(fieldError) : [];
  useEffect(() => {
    if (focusTick > 0) summaryRef.current?.focus();
  }, [focusTick]);
  const blur = (k: FieldName) => () => setTouched((t) => (t[k] ? t : { ...t, [k]: true }));
  const bumpFocus = () => setFocusTick((t) => t + 1);
  return { errors, fieldError, summaryItems, summaryRef, blur, bumpFocus, setTouched, setAttempted };
}
