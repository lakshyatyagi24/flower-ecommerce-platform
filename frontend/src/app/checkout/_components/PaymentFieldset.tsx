"use client";

import React from "react";
import RadioCard from "@/components/ui/RadioCard";
import { SectionLegend, type CheckoutForm } from "./checkout-parts";

export default function PaymentFieldset({
  onlineEnabled,
  paymentMethod,
  update,
}: {
  onlineEnabled: boolean;
  paymentMethod: "COD" | "RAZORPAY";
  update: (key: keyof CheckoutForm, value: string) => void;
}) {
  return (
        <div className="border-t border-stone-light pt-12">
        <fieldset className="min-w-0 border-0 p-0">
          <SectionLegend n={2}>Payment</SectionLegend>
          <div className="space-y-3">
          {onlineEnabled ? (
            <RadioCard
              name="paymentMethod"
              checked={paymentMethod === "RAZORPAY"}
              onChange={() => update("paymentMethod", "RAZORPAY")}
              title="Pay online (UPI, cards, net banking)"
              description="Your order is confirmed once payment succeeds."
            />
          ) : (
            <p className="text-sm text-stone-dark">Online payment is temporarily unavailable.</p>
          )}
          <RadioCard
            name="paymentMethod"
            checked={paymentMethod === "COD"}
            onChange={() => update("paymentMethod", "COD")}
            title="Cash on delivery"
            description="Pay our courier when your bouquet arrives."
          />
          </div>
        </fieldset>
        </div>
  );
}
