"use client";

import React from "react";
import Container from "@/components/ui/Container";
import type { DeliveryOptions } from "@/lib/delivery-date";
import type { CheckoutState } from "../useCheckout";
import CheckoutFormBody from "./CheckoutFormBody";
import CheckoutSummaryAside from "./CheckoutSummaryAside";

function SummaryAside({ c }: { c: CheckoutState }) {
  return (
    <CheckoutSummaryAside
      items={c.items}
      priceOf={c.priceOf}
      itemsLabel={`${c.count} ${c.count === 1 ? "item" : "items"}`}
      summaryOpen={c.summaryOpen}
      setSummaryOpen={c.setSummaryOpen}
      coupon={c.coupon}
      submitting={c.submitting}
      couponFloorMessage={c.couponFloorMessage}
      errors={c.errors}
      form={c.form}
      discount={c.discount}
      liveSubtotal={c.liveSubtotal}
      shipping={c.shipping}
      liveGstTotal={c.liveGstTotal}
      total={c.total}
    />
  );
}

export default function CheckoutFormScreen({ c, deliveryOptions }: { c: CheckoutState; deliveryOptions: DeliveryOptions }) {
  return (
    <main>
      <Container className="py-10 lg:py-16">
        <h1 id="checkout-heading" tabIndex={-1} className="type-h1 outline-none">
          Checkout
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-dark">
          Choose how you would like to pay. Online orders are held for 30 minutes while you complete payment.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-8 lg:mt-12 lg:grid-cols-12 lg:gap-x-16">
          <SummaryAside c={c} />
          <CheckoutFormBody c={c} deliveryOptions={deliveryOptions} />
        </div>
      </Container>
    </main>
  );
}
