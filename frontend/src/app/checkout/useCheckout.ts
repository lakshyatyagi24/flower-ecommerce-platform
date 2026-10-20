"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { isDeliveryOptions, type DeliveryOptions } from "@/lib/delivery-date";
import { useApi } from "@/lib/use-api";
import { useCoupon } from "@/lib/use-coupon";
import { resolveScreen } from "./_components/checkout-logic";
import { useCheckoutPin, useDefaultDeliveryDate } from "./_components/checkout-hooks";
import { useCheckoutForm, useCheckoutValidation } from "./_components/use-checkout-form";
import { useCheckoutPricing } from "./_components/use-checkout-pricing";
import { useCheckoutSubmit } from "./_components/use-checkout-submit";
import { useCheckoutTotals } from "./_components/use-checkout-totals";
import { usePendingPayment } from "./_components/use-pending-payment";

/** Selectable delivery window (and unavailable dates) from the server, in India time. */
function useDeliveryOptions() {
  const { data: optionsRaw, error, loading, reload } = useApi(() => api.getDeliveryOptions(), []);
  const deliveryOptions: DeliveryOptions | null = isDeliveryOptions(optionsRaw) ? optionsRaw : null;
  return { optionsRaw, deliveryOptions, optionsError: error, optionsLoading: loading, reloadOptions: reload };
}

// Fetch the rarely shown panels in the background right after the first render: they stay out of the first-load
// bundle, but are already there by the time an order exists (no flash, no wait when one is needed).
function usePreloadPanels() {
  useEffect(() => {
    void import("./_components/PendingPanel");
    void import("./_components/ExpiredPanel");
    void import("./_components/ChangesPanel");
  }, []);
}

/**
 * Shipping settings and the payment configuration. Settings are a hard prerequisite (no form without known
 * shipping). Online payments need Razorpay keys on the server: if they are off, or the config cannot be read,
 * default to cash on delivery so no unpayable order is ever created.
 */
function useCheckoutConfig(selected: "COD" | "RAZORPAY") {
  const settingsQuery = useApi(() => api.getSettings(), []);
  const { data: paymentConfig, loading: configLoading } = useApi(() => api.getPaymentConfig(), []);
  const onlineEnabled = paymentConfig?.enabled === true;
  return {
    settingsData: settingsQuery.data,
    settings: settingsQuery.data ?? {},
    settingsError: settingsQuery.error,
    settingsLoading: settingsQuery.loading,
    reloadSettings: settingsQuery.reload,
    configLoading,
    onlineEnabled,
    paymentMethod: (onlineEnabled ? selected : "COD") as "COD" | "RAZORPAY",
  };
}

/** Everything the checkout page shows and does, so the page itself only decides which screen to render. */
export function useCheckout() {
  const { items, count, clear, remove, replaceWith } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const { form, setForm, update } = useCheckoutForm(user);
  const options = useDeliveryOptions();
  const { pinCheck, setPinFocusTick, pinBlocked, checkPin } = useCheckoutPin(form, setForm);
  usePreloadPanels();
  const validation = useCheckoutValidation({ form, pinBlocked, ...options });
  useDefaultDeliveryDate(options.deliveryOptions, options.optionsRaw, setForm);
  const payment = usePendingPayment(user, authLoading);
  const config = useCheckoutConfig(form.paymentMethod);
  const pricing = useCheckoutPricing(items, replaceWith);
  const coupon = useCoupon(pricing.liveSubtotal);
  const totals = useCheckoutTotals({ items, count, coupon, settings: config.settings, ...pricing });
  const submit = useCheckoutSubmit({
    form,
    errors: validation.errors,
    blockMessage: totals.blockMessage,
    paymentMethod: config.paymentMethod,
    isSignedIn: Boolean(user),
    items,
    couponCode: coupon.applied?.code,
    rejectCoupon: coupon.reject,
    pinCheck,
    checkPin,
    setPinFocusTick,
    setTouched: validation.setTouched,
    setAttempted: validation.setAttempted,
    bumpFocus: validation.bumpFocus,
    clearCart: clear,
    replaceWith,
    noteAdjustments: pricing.noteAdjustments,
    reloadPrices: pricing.reloadPrices,
    reloadOptions: options.reloadOptions,
    beginPending: payment.beginPending,
  });
  const screen = resolveScreen({
    authLoading,
    restoring: payment.restoring,
    pendingId: payment.pendingId,
    expired: payment.expired !== null,
    count,
    settingsError: config.settingsError,
    pricesError: pricing.pricesError,
    optionsError: options.optionsError,
    optionsLoading: options.optionsLoading,
    hasOptions: options.deliveryOptions !== null,
    hasSettings: Boolean(config.settingsData),
    hasPricing: Boolean(pricing.pricing),
    settingsLoading: config.settingsLoading,
    configLoading: config.configLoading,
  });

  return {
    screen,
    items,
    count,
    remove,
    user,
    form,
    update,
    coupon,
    summaryOpen,
    setSummaryOpen,
    pinCheck,
    checkPin,
    ...options,
    ...validation,
    ...payment,
    ...config,
    ...pricing,
    ...totals,
    ...submit,
  };
}

export type CheckoutState = ReturnType<typeof useCheckout>;
