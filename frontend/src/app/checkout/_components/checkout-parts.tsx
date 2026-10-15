import React from "react";
import { formatDeliveryDate, type DeliveryOptions } from "@/lib/delivery-date";
import { CHECKOUT_FIELD_ORDER, type CheckoutFieldName } from "@/lib/checkout-validation";

export type CheckoutForm = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  postalCode: string;
  deliveryDate: string;
  notes: string;
  paymentMethod: "COD" | "RAZORPAY";
};

// The delivery date is validated against the server-provided window, so it lives beside the shared field rules.
export type FieldName = CheckoutFieldName | "deliveryDate";
export const ALL_FIELD_ORDER: FieldName[] = [...CHECKOUT_FIELD_ORDER, "deliveryDate"];

export const FIELD_IDS: Record<FieldName, string> = {
  customerName: "checkout-name",
  customerEmail: "checkout-email",
  customerPhone: "checkout-phone",
  shippingAddress: "checkout-address",
  city: "checkout-city",
  postalCode: "checkout-pin",
  deliveryDate: "checkout-delivery-date",
};

export const Chevron = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
    <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

export function SectionLegend({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <legend className="mb-6 flex items-baseline gap-4 p-0">
      <span className="font-sans text-xs font-medium tracking-[0.16em] text-stone-dark" aria-hidden="true">
        {String(n).padStart(2, "0")}
      </span>
      <span className="font-display text-2xl text-charcoal md:text-3xl">{children}</span>
    </legend>
  );
}

export function amountsOf(o: { total: number; discount?: number; couponCode?: string | null }) {
  return { total: o.total, discount: o.discount ?? 0, couponCode: o.couponCode ?? null };
}


export function dateHint(o: DeliveryOptions): string {
  const base = `Available from ${formatDeliveryDate(o.earliest)} to ${formatDeliveryDate(o.latest)}.`;
  if (o.blackoutDates.length === 0) return base;
  return `${base} We can't deliver on: ${o.blackoutDates.map(formatDeliveryDate).join("; ")}.`;
}
