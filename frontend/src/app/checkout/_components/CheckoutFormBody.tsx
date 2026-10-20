"use client";

import React, { lazy, Suspense } from "react";
import FormError from "@/components/ui/FormError";
import type { DeliveryOptions } from "@/lib/delivery-date";
import type { CheckoutState } from "../useCheckout";
import ContactDeliveryFieldset from "./ContactDeliveryFieldset";
import GuestNotice from "./GuestNotice";
import PaymentFieldset from "./PaymentFieldset";
import SubmitSection from "./SubmitSection";

// Only shown when the bag has blocking or adjusted lines, so it stays out of the first-load bundle.
const ChangesPanel = lazy(() => import("./ChangesPanel"));

const focusField = (id: string) => document.getElementById(id)?.focus();

function ChangesArea({ c }: { c: CheckoutState }) {
  if (c.blocking.length === 0 && c.shownAdjustments.length === 0) return null;
  return (
    <Suspense fallback={null}>
      <ChangesPanel
        blocking={c.blocking}
        shownAdjustments={c.shownAdjustments}
        remove={c.remove}
        setAdjustments={c.setAdjustments}
      />
    </Suspense>
  );
}

function ErrorSummary({ c }: { c: CheckoutState }) {
  const hasItems = c.summaryItems.length > 0;
  return (
    <FormError
      ref={c.summaryRef}
      title={hasItems ? "Please check the following" : undefined}
      items={c.summaryItems}
      onItemClick={focusField}
    >
      {hasItems ? null : c.error}
    </FormError>
  );
}

export default function CheckoutFormBody({ c, deliveryOptions }: { c: CheckoutState; deliveryOptions: DeliveryOptions }) {
  return (
    <form onSubmit={c.handleSubmit} noValidate className="space-y-12 lg:col-span-7 lg:row-start-1">
      {/* Live region: only a short summary is announced; the full panel below is ordinary content. */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="checkout-changes-live">
        {c.changesSummary}
      </div>
      <ChangesArea c={c} />
      {!c.user && <GuestNotice />}
      <ErrorSummary c={c} />
      <ContactDeliveryFieldset
        form={c.form}
        user={c.user}
        update={c.update}
        blur={c.blur}
        fieldError={c.fieldError}
        deliveryOptions={deliveryOptions}
        optionsError={c.optionsError}
        pinCheck={c.pinCheck}
        checkPin={c.checkPin}
      />
      <PaymentFieldset onlineEnabled={c.onlineEnabled} paymentMethod={c.paymentMethod} update={c.update} />
      <SubmitSection
        submitting={c.submitting}
        couponBusy={c.coupon.busy}
        blockMessage={c.blockMessage}
        paymentMethod={c.paymentMethod}
      />
    </form>
  );
}
