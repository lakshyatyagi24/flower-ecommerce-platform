"use client";

import React from "react";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import type { DeliveryOptions } from "@/lib/delivery-date";
import { PHONE_PATTERN, PIN_PATTERN } from "@/lib/checkout-validation";
import { dateHint, FIELD_IDS, SectionLegend, type CheckoutForm, type FieldName } from "./checkout-parts";

type PinCheck = { pin: string; status: "ok" | "no" | "unknown"; message: string } | null;

export default function ContactDeliveryFieldset({
  form,
  user,
  update,
  blur,
  fieldError,
  deliveryOptions,
  optionsError,
  pinCheck,
  checkPin,
}: {
  form: CheckoutForm;
  user: unknown;
  update: (key: keyof CheckoutForm, value: string) => void;
  blur: (k: FieldName) => () => void;
  fieldError: (k: FieldName) => string | undefined;
  deliveryOptions: DeliveryOptions;
  optionsError: unknown;
  pinCheck: PinCheck;
  checkPin: (pin: string) => Promise<unknown>;
}) {
  return (
        <fieldset className="min-w-0 border-0 p-0">
          <SectionLegend n={1}>Contact &amp; delivery</SectionLegend>
          <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
            <Field id={FIELD_IDS.customerName} label="Full name" error={fieldError("customerName")}>
              <Input
                autoComplete="name"
                value={form.customerName}
                onChange={(e) => update("customerName", e.target.value)}
                onBlur={blur("customerName")}
              />
            </Field>
            <Field
              id={FIELD_IDS.customerEmail}
              label="Email"
              hint={user ? undefined : "Your confirmation and tracking details are sent here."}
              error={fieldError("customerEmail")}
            >
              <Input
                type="email"
                autoComplete="email"
                value={form.customerEmail}
                onChange={(e) => update("customerEmail", e.target.value)}
                onBlur={blur("customerEmail")}
              />
            </Field>
            <Field id={FIELD_IDS.customerPhone} label="Phone" className="sm:col-span-2" error={fieldError("customerPhone")}>
              <Input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                pattern={PHONE_PATTERN}
                title="Enter a valid 10-digit Indian mobile number"
                value={form.customerPhone}
                onChange={(e) => update("customerPhone", e.target.value)}
                onBlur={blur("customerPhone")}
                placeholder="+91 99999 11111"
              />
            </Field>
            <Field id={FIELD_IDS.shippingAddress} label="Address" className="sm:col-span-2" error={fieldError("shippingAddress")}>
              <Textarea
                rows={3}
                autoComplete="street-address"
                value={form.shippingAddress}
                onChange={(e) => update("shippingAddress", e.target.value)}
                onBlur={blur("shippingAddress")}
                placeholder="Street, building, landmark…"
              />
            </Field>
            <Field id={FIELD_IDS.city} label="City" error={fieldError("city")}>
              <Input
                maxLength={80}
                autoComplete="address-level2"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                onBlur={blur("city")}
              />
            </Field>
            <Field id={FIELD_IDS.postalCode} label="PIN code" error={fieldError("postalCode")}>
              <Input
                inputMode="numeric"
                autoComplete="postal-code"
                pattern={PIN_PATTERN}
                maxLength={6}
                title="Enter a valid 6-digit PIN code"
                value={form.postalCode}
                onChange={(e) => update("postalCode", e.target.value)}
                onBlur={() => {
                  blur("postalCode")();
                  const pin = form.postalCode.trim();
                  if (pinCheck && pinCheck.pin === pin && pinCheck.status !== "unknown") return;
                  void checkPin(pin);
                }}
              />
            </Field>
            <Field
              id={FIELD_IDS.deliveryDate}
              label="Delivery date"
              className="sm:col-span-2"
              hint={dateHint(deliveryOptions)}
              error={
                fieldError("deliveryDate") ??
                (optionsError ? "We couldn't refresh the available dates, so the dates shown may be out of date." : undefined)
              }
            >
              <Input
                type="date"
                min={deliveryOptions.earliest}
                max={deliveryOptions.latest}
                value={form.deliveryDate}
                onChange={(e) => update("deliveryDate", e.target.value)}
                onBlur={blur("deliveryDate")}
              />
            </Field>
            <Field id="checkout-notes" label="Notes for delivery" optional className="sm:col-span-2">
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Buzzer code, gift message, preferred time…"
              />
            </Field>
          </div>
        </fieldset>
  );
}
