"use client";

import { parseFlatRate, parseFreeThreshold, shippingFor } from "@/lib/shipping";
import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { ApiError, api, type ApiProduct } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import ErrorState from "@/components/ui/ErrorState";
import { clearPendingOrder, readPendingOrderId, savePendingOrder } from "@/lib/pending-order";
import { clearLastOrderEmail, getLastOrderEmail, setLastOrderEmail } from "@/lib/guest-order";
import { fetchFreshProducts } from "@/lib/fresh-products";
import {
  adjustmentNotices,
  applyReconciled,
  blockingNotices,
  linesChanged,
  reconcileCart,
  type CartNotice,
} from "@/lib/reconcile-cart";
import { requestSignIn } from "@/lib/sign-in-request";
import { useCoupon } from "@/lib/use-coupon";
import { belowFloorMessage, gstAfterDiscount, isCouponError, totalAfterDiscount } from "@/lib/coupon";
import { reservedMessage, usePayForOrder, type ExpiredKind } from "@/lib/use-pay-for-order";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import FormError from "@/components/ui/FormError";
import { textLink } from "@/components/ui/form-styles";
import { isDeliveryOptions, validateDeliveryDate, type DeliveryOptions } from "@/lib/delivery-date";
import { validateCheckout } from "@/lib/checkout-validation";
import { ALL_FIELD_ORDER, amountsOf, FIELD_IDS, type CheckoutForm, type FieldName } from "./_components/checkout-parts";
import { useCheckoutPin, useDefaultDeliveryDate } from "./_components/checkout-hooks";
import CheckoutSummaryAside from "./_components/CheckoutSummaryAside";

import ContactDeliveryFieldset from "./_components/ContactDeliveryFieldset";
import PaymentFieldset from "./_components/PaymentFieldset";

// The pending-payment and expired screens are only shown after an order exists, so they are not part of the
// first-load bundle (they bring PaymentActions with them).
const PendingPanel = lazy(() => import("./_components/PendingPanel"));
const ExpiredPanel = lazy(() => import("./_components/ExpiredPanel"));
const ChangesPanel = lazy(() => import("./_components/ChangesPanel"));

export default function CheckoutPage() {
  const router = useRouter();
  const { items, count, clear, remove, replaceWith } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Live prices re-fetched at checkout time. The backend charges the current DB
  // price (the order payload sends only productId+quantity), so we display these
  // fresh values — not the prices cached in the cart at add-time — and warn if
  // they changed, so the amount the customer reviews equals what they're charged.

  const [form, setForm] = useState<CheckoutForm>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    city: "",
    postalCode: "",
    deliveryDate: "",
    notes: "",
    paymentMethod: "RAZORPAY",
  });

  // Selectable delivery window (and unavailable dates) from the server, in India time. The date is required,
  // so a failed load blocks the form with a retry instead of letting an order go out without one.
  const {
    data: optionsRaw,
    error: optionsError,
    loading: optionsLoading,
    reload: reloadOptions,
  } = useApi(() => api.getDeliveryOptions(), []);
  const deliveryOptions: DeliveryOptions | null = isDeliveryOptions(optionsRaw) ? optionsRaw : null;

  // Inline validation: a field shows its error once it was blurred or a submit was attempted.
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [focusTick, setFocusTick] = useState(0);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const errors = useMemo(() => {
    const e: Partial<Record<FieldName, string>> = validateCheckout(form);
    const dateError = deliveryOptions ? validateDeliveryDate(form.deliveryDate, deliveryOptions) : "Choose a delivery date";
    if (dateError) e.deliveryDate = dateError;
    return e;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, optionsRaw]);
  const { pinCheck, setPinFocusTick, pinBlocked, checkPin } = useCheckoutPin(form, setForm);
  // Fetch the rarely shown panels in the background right after the first render: they stay out of the first-load
  // bundle, but are already there by the time an order exists (no flash, no wait when one is needed).
  useEffect(() => {
    void import("./_components/PendingPanel");
    void import("./_components/ExpiredPanel");
    void import("./_components/ChangesPanel");
  }, []);
  const fieldError = (k: FieldName) =>
    touched[k] || attempted ? errors[k] ?? (k === "postalCode" ? pinBlocked : undefined) : undefined;
  useDefaultDeliveryDate(deliveryOptions, optionsRaw, setForm);
  const summaryItems = attempted
    ? ALL_FIELD_ORDER.filter((k) => fieldError(k)).map((k) => ({ id: FIELD_IDS[k], message: fieldError(k) as string }))
    : [];
  // Move focus to the error summary after a failed submit (validation or server error).
  useEffect(() => {
    if (focusTick > 0) summaryRef.current?.focus();
  }, [focusTick]);

  // Online-payment state. `pendingId` is an order that exists on the server but
  // is not paid yet: while set, the checkout form is not rendered, so a second
  // order can't be created by accident.
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [expired, setExpired] = useState<ExpiredKind | null>(null);
  const [restoring, setRestoring] = useState(true);
  // What the server recorded for the pending order (total after any coupon); shown on the pending panel.
  const [pendingAmounts, setPendingAmounts] = useState<{ total: number; discount: number; couponCode: string | null } | null>(null);

  // Shared pay/switch/check behaviour: clears the cart and matching pending key
  // itself whenever an order resolves, then we just navigate or show expiry.
  const pay = usePayForOrder({
    orderId: pendingId,
    onResolved: (kind, id, expiredKind) => {
      if (kind === "expired") {
        setPendingId(null);
        setExpired(expiredKind ?? "unpaid");
        // The restore effect may be the caller: do not leave the skeleton up.
        setRestoring(false);
      } else {
        router.push(`/checkout/success?orderId=${id}`);
      }
    },
  });

  const goToSuccess = (id: number) => {
    clear();
    clearPendingOrder();
    router.push(`/checkout/success?orderId=${id}`);
  };

  // After auth is known: if a recent unpaid online order is remembered, show its
  // pending panel instead of the form (a refresh must not lead to a second order).
  // A signed-in customer reloads it through their account; a guest through the order id + the email kept in
  // sessionStorage (never the URL). Without that email a guest order cannot be read, so the form is shown.
  useEffect(() => {
    if (authLoading) return;
    // Already showing the pending panel for this page view (e.g. the shopper signed in meanwhile): keep it.
    if (pendingId !== null) return;
    const id = readPendingOrderId();
    if (id === null) {
      setRestoring(false);
      return;
    }
    const guestEmail = getLastOrderEmail();
    if (!user && !guestEmail) {
      clearPendingOrder();
      setRestoring(false);
      return;
    }
    let cancelled = false;
    // Signed in meanwhile: the account endpoint first; a guest order is not "mine" (403/404), so fall back to
    // the email it was placed with.
    (user
      ? api.getMyOrder(id).catch((e: unknown) => {
          if (guestEmail && e instanceof ApiError && (e.status === 403 || e.status === 404)) return api.trackOrder(id, guestEmail);
          throw e;
        })
      : api.trackOrder(id, guestEmail as string)
    )
      .then((o) => {
        if (cancelled) return;
        if (o.paymentStatus === "PAID" || o.paymentMethod === "COD") {
          // Paid (any status, incl. refund due) or switched to COD: show the
          // success page, which explains the exact state; the helper clears
          // the cart and pending key.
          pay.applyOrder(o);
        } else if (
          o.status === "PENDING" &&
          o.paymentMethod === "RAZORPAY" &&
          (o.paymentStatus === "UNPAID" || o.paymentStatus === "FAILED")
        ) {
          setPendingAmounts(amountsOf(o));
          setPendingId(id);
          pay.setNotice({ text: reservedMessage(id), kind: "status" });
          pay.setShowCheck(true);
          setRestoring(false);
        } else {
          clearPendingOrder();
          if (!user) clearLastOrderEmail();
          setRestoring(false);
        }
      })
      .catch(() => {
        if (cancelled) return;
        clearPendingOrder();
        if (!user) clearLastOrderEmail();
        setRestoring(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  // Shipping settings and live prices are hard prerequisites: if either fails to
  // load we render an ErrorState instead of the form, so an order can never be
  // submitted against unknown shipping or stale prices.
  const {
    data: settingsData,
    error: settingsError,
    loading: settingsLoading,
    reload: reloadSettings,
  } = useApi(() => api.getSettings(), []);
  const settings = settingsData ?? {};

  // Online payments need Razorpay keys on the server. If they are off (or the config cannot be read),
  // default to cash on delivery and hide the online option so no unpayable order is ever created.
  const { data: paymentConfig, loading: configLoading } = useApi(() => api.getPaymentConfig(), []);
  const onlineEnabled = paymentConfig?.enabled === true;
  const paymentMethod: "COD" | "RAZORPAY" = onlineEnabled ? form.paymentMethod : "COD";

  // Re-fetch live prices whenever the set of products in the cart changes. A product that no longer exists (404)
  // is simply absent from `fresh` (reconcileCart flags it); any other failure aborts, so an order can never be
  // submitted against stale prices.
  const productKey = items.map((i) => i.productId).sort((a, b) => a - b).join(",");
  const {
    data: pricing,
    error: pricesError,
    loading: pricesLoading,
    reload: reloadPrices,
  } = useApi(async () => {
    const res = await fetchFreshProducts(items, { maxAgeMs: 0 });
    if (res.failed) throw new Error("Could not load current prices");
    const map: Record<number, { price: number; gstRate: number }> = {};
    for (const p of res.fresh) map[p.id] = { price: p.price, gstRate: p.gstRate ?? 0 };
    return { map, fresh: res.fresh };
  }, [productKey]);
  const freshPrices = pricing?.map ?? {};

  // Same reconcile as the cart drawer. Fixable differences (lower stock, new price) are applied to the bag and
  // listed for the shopper to accept before paying; blocking ones (gone / out of stock) must be removed.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const [adjustments, setAdjustments] = useState<CartNotice[]>([]);
  const noteAdjustments = (found: CartNotice[]) => {
    if (found.length === 0) return;
    setAdjustments((prev) => [
      ...prev.filter((p) => !found.some((f) => f.productId === p.productId && f.kind === p.kind)),
      ...found,
    ]);
  };
  const applyFresh = (fresh: ApiProduct[]) => {
    const latest = itemsRef.current;
    const result = reconcileCart(latest, fresh);
    if (linesChanged(latest, result.lines)) replaceWith((prev) => applyReconciled(prev, latest, result.lines));
    noteAdjustments(adjustmentNotices(result.notices));
  };
  useEffect(() => {
    if (pricing) applyFresh(pricing.fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricing]);
  const blocking = useMemo(
    () => (pricing ? blockingNotices(reconcileCart(items, pricing.fresh).notices) : []),
    [items, pricing],
  );
  const shownAdjustments = adjustments.filter((a) => items.some((i) => i.productId === a.productId));
  const changesSummary =
    blocking.length > 0
      ? `${blocking.length === 1 ? "One item" : `${blocking.length} items`} in your bag can't be ordered right now.`
      : shownAdjustments.length > 0
        ? `Your order changed: ${shownAdjustments.length === 1 ? "one update needs" : `${shownAdjustments.length} updates need`} your review.`
        : "";
  const gateMessage =
    blocking.length > 0
      ? "Remove the items that can't be ordered right now to continue."
      : shownAdjustments.length > 0
        ? "Please review and accept the changes to your order to continue."
        : null;

  const priceOf = (it: (typeof items)[number]) => freshPrices[it.productId]?.price ?? it.price;
  const gstRateOf = (it: (typeof items)[number]) => freshPrices[it.productId]?.gstRate ?? it.gstRate ?? 0;
  const liveSubtotal = useMemo(
    () => items.reduce((s, it) => s + priceOf(it) * it.quantity, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, freshPrices],
  );
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        customerName: f.customerName || user.name || "",
        // A guest who signs in mid-form: the order is tied to the account email, so show that one.
        customerEmail: user.email,
        customerPhone: f.customerPhone || user.phone || "",
      }));
    }
  }, [user]);

  const coupon = useCoupon(liveSubtotal);
  const discount = coupon.discount;
  // GST is charged on the value AFTER the discount, spread over the lines exactly as the server does it.
  const liveGstTotal = useMemo(
    () => gstAfterDiscount(items.map((it) => ({ lineTotal: priceOf(it) * it.quantity, gstRate: gstRateOf(it) })), discount),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, freshPrices, discount],
  );

  // Mirrors the backend rule exactly (see lib/shipping.ts): threshold "0" => every order ships free.
  const flatRate = parseFlatRate(settings["shipping.flatRate"]);
  const freeThreshold = parseFreeThreshold(settings["shipping.freeThreshold"]);
  const shipping = useMemo(() => {
    if (count === 0) return 0;
    return shippingFor(liveSubtotal, flatRate, freeThreshold);
  }, [liveSubtotal, count, flatRate, freeThreshold]);
  // R19: shipping was judged on the pre-discount subtotal above; the discount reduces the items and their GST.
  const total = totalAfterDiscount(liveSubtotal, discount, shipping, liveGstTotal);
  // The server refuses a discounted order whose total is below the floor (Razorpay needs at least one rupee). Say so
  // here and hold the order, but keep the coupon: the shopper can add items or remove it.
  const couponFloorMessage =
    coupon.applied && discount > 0 && total < coupon.applied.minTotal ? belowFloorMessage(coupon.applied.minTotal) : null;
  const blockMessage = gateMessage ?? couponFloorMessage;

  if (authLoading) {
    return (
      <main>
        <Container className="py-12 lg:py-16">
          <div className="max-w-3xl space-y-4" aria-busy="true">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-64" />
          </div>
        </Container>
      </main>
    );
  }

  if (restoring) {
    return (
      <main>
        <Container className="py-12 lg:py-16">
          <div className="max-w-3xl space-y-4" aria-busy="true">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-32" />
          </div>
        </Container>
      </main>
    );
  }

  if (pendingId !== null) {
    return (
      <Suspense fallback={null}>
        <PendingPanel pay={pay} pendingId={pendingId} pendingAmounts={pendingAmounts} />
      </Suspense>
    );
  }

  if (expired) {
    return (
      <Suspense fallback={null}>
        <ExpiredPanel expired={expired} onBack={() => setExpired(null)} />
      </Suspense>
    );
  }

  if (count > 0 && (settingsError || pricesError)) {
    return (
      <main>
        <Container className="py-12">
          <ErrorState
            message="We couldn't load delivery charges. Please refresh."
            onRetry={() => {
              reloadSettings();
              reloadPrices();
            }}
          />
        </Container>
      </main>
    );
  }

  // Full-page states only while there are no options yet. During a reload (e.g. after a rejected date) the previous
  // window stays on screen so the form, the typed values and the focused error summary are not torn down.
  if (count > 0 && !deliveryOptions && (optionsError || !optionsLoading)) {
    return (
      <main>
        <Container className="py-12">
          <ErrorState message="We couldn't load the available delivery dates. Please try again." onRetry={reloadOptions} />
        </Container>
      </main>
    );
  }

  if (count > 0 && (settingsLoading || (pricesLoading && !pricing) || configLoading || (optionsLoading && !deliveryOptions) || !settingsData || !pricing || !deliveryOptions)) {
    return (
      <main>
        <Container className="py-12 lg:py-16">
          <div className="max-w-3xl space-y-4" aria-busy="true">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-64" />
          </div>
        </Container>
      </main>
    );
  }

  if (count === 0) {
    return (
      <main>
        <Container className="py-16 text-center lg:py-24">
          <h1 className="type-h2">Your cart is empty</h1>
          <p className="mt-4 text-base text-stone-dark">Add some florals before you can check out.</p>
          <div className="mt-8">
            <Button href="/products">Browse florals</Button>
          </div>
        </Container>
      </main>
    );
  }

  // Unreachable once the guards above pass (a missing window renders the retry state); narrows the type.
  if (!deliveryOptions) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setError(null);
    setAttempted(true);
    if (Object.keys(errors).length > 0) {
      setFocusTick((t) => t + 1);
      return;
    }
    if (blockMessage) {
      setError(blockMessage);
      setFocusTick((t) => t + 1);
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const pin = form.postalCode.trim();
      const known = pinCheck && pinCheck.pin === pin && pinCheck.status !== "unknown" ? pinCheck : await checkPin(pin);
      if (known?.status === "no") {
        setTouched((t) => ({ ...t, postalCode: true }));
        setPinFocusTick((t) => t + 1);
        return;
      }
      // Last look before money moves: prices and stock may have changed while the form was open. Anything that
      // changed is shown for the shopper to accept first; the server still computes the real total.
      const latest = await fetchFreshProducts(items, { maxAgeMs: 0 });
      if (!latest.failed) {
        const result = reconcileCart(items, latest.fresh);
        const newBlocking = blockingNotices(result.notices);
        const newAdjustments = adjustmentNotices(result.notices);
        if (linesChanged(items, result.lines)) replaceWith((prev) => applyReconciled(prev, items, result.lines));
        noteAdjustments(newAdjustments);
        if (newBlocking.length > 0 || newAdjustments.length > 0) {
          reloadPrices();
          setError(
            newBlocking.length > 0
              ? "Some items in your bag can't be ordered right now. Remove them to continue."
              : "Some prices or quantities changed while you were checking out. Review the changes and accept them to continue.",
          );
          setFocusTick((t) => t + 1);
          return;
        }
      }
      const order = await api.createOrder({
        items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        shippingAddress: form.shippingAddress.trim(),
        city: form.city.trim(),
        postalCode: form.postalCode.trim(),
        deliveryDate: form.deliveryDate,
        notes: form.notes.trim() || undefined,
        paymentMethod,
        ...(coupon.applied ? { couponCode: coupon.applied.code } : {}),
      });
      // A guest finds their order again (pay, switch, success page) with the email they ordered with.
      if (!user) setLastOrderEmail(form.customerEmail.trim());
      if (paymentMethod === "COD") {
        goToSuccess(order.id);
      } else {
        // Keep the cart until payment is confirmed. Remember the order so a
        // refresh shows the pending panel instead of a fresh, submittable form.
        savePendingOrder(order.id);
        setPendingAmounts(amountsOf(order));
        setPendingId(order.id);
        void pay.payNow(order.id);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not place order";
      if (isCouponError(err)) {
        // The server refused the coupon (expired, used up, below its minimum...). Drop it, say why next to the
        // field, and let the shopper decide: the order is NOT retried without it.
        coupon.reject(message);
        setError("Your coupon could not be applied, so it was removed and no order was placed. Check the total and place the order again.");
        setFocusTick((t) => t + 1);
        return;
      }
      setError(message);
      // The window moves with the clock (cut-off time): after a date rejection, re-read it so the field shows the new range.
      if (/delivery date|deliver on that date/i.test(message)) reloadOptions();
      // Stock / availability rejected by the server: re-read the bag against current data so the shopper sees
      // exactly which lines to fix instead of retrying the same order.
      if (err instanceof ApiError && err.status === 400 && /stock|available|minimum order|enquiry|adjust your cart/i.test(message)) {
        reloadPrices();
      }
      setFocusTick((t) => t + 1);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const update = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const blur = (k: FieldName) => () => setTouched((t) => (t[k] ? t : { ...t, [k]: true }));
  const focusField = (id: string) => document.getElementById(id)?.focus();

  const itemsLabel = `${count} ${count === 1 ? "item" : "items"}`;

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
          <CheckoutSummaryAside
            items={items}
            priceOf={priceOf}
            itemsLabel={itemsLabel}
            summaryOpen={summaryOpen}
            setSummaryOpen={setSummaryOpen}
            coupon={coupon}
            submitting={submitting}
            couponFloorMessage={couponFloorMessage}
            errors={errors}
            form={form}
            discount={discount}
            liveSubtotal={liveSubtotal}
            shipping={shipping}
            liveGstTotal={liveGstTotal}
            total={total}
          />

          <form onSubmit={handleSubmit} noValidate className="space-y-12 lg:col-span-7 lg:row-start-1">
            {/* Live region: only a short summary is announced; the full panel below is ordinary content. */}
            <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="checkout-changes-live">
              {changesSummary}
            </div>
            {(blocking.length > 0 || shownAdjustments.length > 0) && (
              <Suspense fallback={null}>
                <ChangesPanel blocking={blocking} shownAdjustments={shownAdjustments} remove={remove} setAdjustments={setAdjustments} />
              </Suspense>
            )}

            {!user && (
              <section aria-labelledby="guest-checkout-title" className="border border-stone-light px-5 py-4">
                <h2 id="guest-checkout-title" className="font-display text-xl text-charcoal">
                  Checkout as guest
                </h2>
                <p className="mt-2 text-sm text-stone-dark">
                  No account needed. We&apos;ll email your order confirmation to the address below. Have an account?{" "}
                  <button
                    type="button"
                    aria-label="Sign in to your account"
                    onClick={(e) => requestSignIn(e.currentTarget)}
                    className={`text-charcoal ${textLink}`}
                  >
                    Sign in
                  </button>
                </p>
              </section>
            )}

            <FormError
              ref={summaryRef}
              title={summaryItems.length > 0 ? "Please check the following" : undefined}
              items={summaryItems}
              onItemClick={focusField}
            >
              {summaryItems.length === 0 ? error : null}
            </FormError>

            <ContactDeliveryFieldset
              form={form}
              user={user}
              update={update}
              blur={blur}
              fieldError={fieldError}
              deliveryOptions={deliveryOptions}
              optionsError={optionsError}
              pinCheck={pinCheck}
              checkPin={checkPin}
            />

            <PaymentFieldset onlineEnabled={onlineEnabled} paymentMethod={paymentMethod} update={update} />

            <div>
              <Button
                type="submit"
                size="lg"
                disabled={submitting || Boolean(blockMessage) || coupon.busy}
                aria-describedby={blockMessage ? "checkout-gate" : undefined}
                className="w-full"
              >
                {submitting ? "Placing order…" : paymentMethod === "RAZORPAY" ? "Place order & pay" : "Place order"}
              </Button>
              {blockMessage && (
                <p id="checkout-gate" className="mt-3 text-sm text-charcoal">
                  {blockMessage}
                </p>
              )}
              <ul className="mt-4 space-y-1 text-left text-sm text-stone-dark">
                {paymentMethod === "RAZORPAY" && <li>Secure payment via Razorpay.</li>}
                <li>We&apos;ll email your order confirmation.</li>
              </ul>
            </div>
          </form>
        </div>
      </Container>
    </main>
  );
}
