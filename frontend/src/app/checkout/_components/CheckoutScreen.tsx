"use client";

import React, { lazy, Suspense } from "react";
import type { CheckoutState } from "../useCheckout";
import type { CheckoutScreenKind } from "./checkout-logic";
import CheckoutFormScreen from "./CheckoutFormScreen";
import { EmptyCartScreen, LoadErrorScreen, OptionsErrorScreen, SkeletonScreen } from "./CheckoutStatusScreens";

// The pending-payment and expired screens are only shown after an order exists, so they are not part of the
// first-load bundle (they bring PaymentActions with them).
const PendingPanel = lazy(() => import("./PendingPanel"));
const ExpiredPanel = lazy(() => import("./ExpiredPanel"));

const renderForm = (c: CheckoutState) =>
  // Unreachable once the screen resolves to "form" (a missing window renders the retry state); narrows the type.
  c.deliveryOptions ? <CheckoutFormScreen c={c} deliveryOptions={c.deliveryOptions} /> : null;

const RENDERERS: Record<CheckoutScreenKind, (c: CheckoutState) => React.ReactNode> = {
  "auth-loading": () => <SkeletonScreen rows={["h-10 w-1/3", "h-4 w-2/3", "h-64"]} />,
  restoring: () => <SkeletonScreen rows={["h-10 w-1/3", "h-32"]} />,
  pending: (c) => (
    <Suspense fallback={null}>
      <PendingPanel pay={c.pay} pendingId={c.pendingId as number} pendingAmounts={c.pendingAmounts} />
    </Suspense>
  ),
  expired: (c) => (
    <Suspense fallback={null}>
      <ExpiredPanel expired={c.expired as NonNullable<CheckoutState["expired"]>} onBack={c.clearExpired} />
    </Suspense>
  ),
  "load-error": (c) => (
    <LoadErrorScreen
      onRetry={() => {
        c.reloadSettings();
        c.reloadPrices();
      }}
    />
  ),
  "options-error": (c) => <OptionsErrorScreen onRetry={c.reloadOptions} />,
  loading: () => <SkeletonScreen rows={["h-10 w-1/3", "h-64"]} />,
  empty: () => <EmptyCartScreen />,
  form: renderForm,
};

export default function CheckoutScreen({ c }: { c: CheckoutState }) {
  return <>{RENDERERS[c.screen](c)}</>;
}
