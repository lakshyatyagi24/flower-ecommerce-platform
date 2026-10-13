"use client";

import { parseFlatRate, parseFreeThreshold, shippingFor } from "@/lib/shipping";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, formatINR } from "@/lib/cart-context";
import { productImage } from "@/lib/product-image";
import { useAuth } from "@/lib/auth-context";
import { ApiError, api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import ErrorState from "@/components/ui/ErrorState";
import { clearPendingOrder, readPendingOrderId, savePendingOrder } from "@/lib/pending-order";
import { EXPIRED_COPY, reservedMessage, usePayForOrder, type ExpiredKind } from "@/lib/use-pay-for-order";
import PaymentActions from "@/components/PaymentActions";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import RadioCard from "@/components/ui/RadioCard";
import FormError from "@/components/ui/FormError";
import { readStoredPincode, storePincode } from "@/lib/pincode-storage";
import { formatDeliveryDate, isDeliveryOptions, validateDeliveryDate, type DeliveryOptions } from "@/lib/delivery-date";
import {
  CHECKOUT_FIELD_ORDER,
  PHONE_PATTERN,
  PIN_PATTERN,
  validateCheckout,
  type CheckoutFieldName,
} from "@/lib/checkout-validation";

const PIN_RE = new RegExp(`^(?:${PIN_PATTERN})$`);

// The delivery date is validated against the server-provided window, so it lives beside the shared field rules.
type FieldName = CheckoutFieldName | "deliveryDate";
const ALL_FIELD_ORDER: FieldName[] = [...CHECKOUT_FIELD_ORDER, "deliveryDate"];

const FIELD_IDS: Record<FieldName, string> = {
  customerName: "checkout-name",
  customerEmail: "checkout-email",
  customerPhone: "checkout-phone",
  shippingAddress: "checkout-address",
  city: "checkout-city",
  postalCode: "checkout-pin",
  deliveryDate: "checkout-delivery-date",
};

const Chevron = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
    <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

function SectionLegend({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <legend className="mb-6 flex items-baseline gap-4 p-0">
      <span className="font-sans text-xs font-medium tracking-[0.16em] text-stone-dark" aria-hidden="true">
        {String(n).padStart(2, "0")}
      </span>
      <span className="font-display text-2xl text-charcoal md:text-3xl">{children}</span>
    </legend>
  );
}

function dateHint(o: DeliveryOptions): string {
  const base = `Available from ${formatDeliveryDate(o.earliest)} to ${formatDeliveryDate(o.latest)}.`;
  if (o.blackoutDates.length === 0) return base;
  return `${base} We can't deliver on: ${o.blackoutDates.map(formatDeliveryDate).join("; ")}.`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, count, clear } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Live prices re-fetched at checkout time. The backend charges the current DB
  // price (the order payload sends only productId+quantity), so we display these
  // fresh values — not the prices cached in the cart at add-time — and warn if
  // they changed, so the amount the customer reviews equals what they're charged.

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    city: "",
    postalCode: "",
    deliveryDate: "",
    notes: "",
    paymentMethod: "RAZORPAY" as "COD" | "RAZORPAY",
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
  // Serviceability for the PIN last checked. Only an explicit `serviceable:false` blocks; a failed request
  // (`unknown`) never does, because the backend enforces the same rule when the order is created.
  const [pinCheck, setPinCheck] = useState<{ pin: string; status: "ok" | "no" | "unknown"; message: string } | null>(null);
  const [pinFocusTick, setPinFocusTick] = useState(0);
  const latestPinRef = useRef("");
  const pinNow = form.postalCode.trim();
  const pinBlocked = pinCheck && pinCheck.pin === pinNow && pinCheck.status === "no" ? pinCheck.message : undefined;
  const fieldError = (k: FieldName) =>
    touched[k] || attempted ? errors[k] ?? (k === "postalCode" ? pinBlocked : undefined) : undefined;
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
  }, []);
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
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRestoring(false);
      return;
    }
    const id = readPendingOrderId();
    if (id === null) {
      setRestoring(false);
      return;
    }
    let cancelled = false;
    api
      .getMyOrder(id)
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
          setPendingId(id);
          pay.setNotice({ text: reservedMessage(id), kind: "status" });
          pay.setShowCheck(true);
          setRestoring(false);
        } else {
          clearPendingOrder();
          setRestoring(false);
        }
      })
      .catch(() => {
        if (cancelled) return;
        clearPendingOrder();
        setRestoring(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  // Login is required to place an order. Send guests to /account/login with a
  // callback so they bounce back here once authenticated.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/account/login?callbackUrl=${encodeURIComponent("/checkout")}`);
    }
  }, [authLoading, user, router]);

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

  // Re-fetch live prices whenever the set of products in the cart changes.
  const productKey = items.map((i) => i.productId).sort((a, b) => a - b).join(",");
  const {
    data: pricing,
    error: pricesError,
    loading: pricesLoading,
    reload: reloadPrices,
  } = useApi(async () => {
    const snapshot = items;
    const results = await Promise.all(
      snapshot.map((it) =>
        // A product that no longer exists (404) is skipped here; the backend
        // rejects the order with a readable message. Any other failure aborts.
        api.getProductBySlug(it.slug).catch((e: unknown) => {
          if (e instanceof ApiError && e.status === 404) return null;
          throw e;
        }),
      ),
    );
    const map: Record<number, { price: number; gstRate: number }> = {};
    let changed = false;
    results.forEach((p, idx) => {
      if (!p) return;
      map[p.id] = { price: p.price, gstRate: p.gstRate ?? 0 };
      if (Math.abs((p.price ?? 0) - snapshot[idx].price) > 0.001) changed = true;
    });
    return { map, changed };
  }, [productKey]);
  const freshPrices = pricing?.map ?? {};
  const priceChanged = pricing?.changed ?? false;

  const priceOf = (it: (typeof items)[number]) => freshPrices[it.productId]?.price ?? it.price;
  const gstRateOf = (it: (typeof items)[number]) => freshPrices[it.productId]?.gstRate ?? it.gstRate ?? 0;
  const liveSubtotal = useMemo(
    () => items.reduce((s, it) => s + priceOf(it) * it.quantity, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, freshPrices],
  );
  const liveGstTotal = useMemo(
    () => items.reduce((s, it) => s + (gstRateOf(it) ? (priceOf(it) * it.quantity * gstRateOf(it)) / 100 : 0), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, freshPrices],
  );

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        customerName: f.customerName || user.name || "",
        customerEmail: f.customerEmail || user.email,
        customerPhone: f.customerPhone || user.phone || "",
      }));
    }
  }, [user]);

  // Mirrors the backend rule exactly (see lib/shipping.ts): threshold "0" => every order ships free.
  const flatRate = parseFlatRate(settings["shipping.flatRate"]);
  const freeThreshold = parseFreeThreshold(settings["shipping.freeThreshold"]);
  const shipping = useMemo(() => {
    if (count === 0) return 0;
    return shippingFor(liveSubtotal, flatRate, freeThreshold);
  }, [liveSubtotal, count, flatRate, freeThreshold]);
  const total = liveSubtotal + shipping + liveGstTotal;

  // Don't render the form for guests — they're being redirected to /account/login.
  if (authLoading || !user) {
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
      <main>
        <Container className="py-12 lg:py-20">
          <div className="max-w-xl">
            <h1 className="type-h2">{pay.switched ? "Refund due" : "Payment pending"}</h1>
            {!pay.switched && (
              <p className="mt-4 text-base leading-relaxed text-stone-dark">
                Your order #{pendingId} has been created and is waiting for payment. It stays reserved for 30 minutes.
              </p>
            )}
            <PaymentActions pay={pay} orderId={pendingId} />
          </div>
        </Container>
      </main>
    );
  }

  if (expired) {
    return (
      <main>
        <Container className="py-12 lg:py-20">
          <div className="max-w-xl">
            <h1 className="type-h2">
              {expired === "unpaid" ? "Order expired" : expired === "refunded" ? "Payment refunded" : "Order cancelled"}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-stone-dark">{EXPIRED_COPY[expired]}</p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Button type="button" onClick={() => setExpired(null)}>
                Back to checkout
              </Button>
              <Button variant="ghost" href="/products">
                Continue shopping — browse products
              </Button>
            </div>
          </div>
        </Container>
      </main>
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

  if (count > 0 && (settingsLoading || pricesLoading || configLoading || (optionsLoading && !deliveryOptions) || !settingsData || !pricing || !deliveryOptions)) {
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
      });
      if (paymentMethod === "COD") {
        goToSuccess(order.id);
      } else {
        // Keep the cart until payment is confirmed. Remember the order so a
        // refresh shows the pending panel instead of a fresh, submittable form.
        savePendingOrder(order.id);
        setPendingId(order.id);
        void pay.payNow(order.id);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not place order";
      setError(message);
      // The window moves with the clock (cut-off time): after a date rejection, re-read it so the field shows the new range.
      if (/delivery date|deliver on that date/i.test(message)) reloadOptions();
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
        <h1 className="type-h1">Checkout</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-dark">
          Choose how you would like to pay. Online orders are held for 30 minutes while you complete payment.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:mt-12 lg:grid-cols-12 lg:gap-x-16">
          <aside aria-label="Order summary" className="lg:sticky lg:top-28 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:self-start">
            <button
              type="button"
              aria-expanded={summaryOpen}
              aria-controls="checkout-summary-panel"
              onClick={() => setSummaryOpen((o) => !o)}
              className="flex min-h-14 w-full items-center justify-between gap-4 border-y border-stone-light py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss lg:hidden"
            >
              <span className="flex items-center gap-2 text-sm text-charcoal">
                Order summary ({itemsLabel})
                <Chevron open={summaryOpen} />
              </span>
              <span className="text-base text-charcoal">{formatINR(total)}</span>
            </button>

            <div id="checkout-summary-panel" className={`${summaryOpen ? "block" : "hidden"} pt-6 lg:block lg:bg-ivory-deep lg:p-8`}>
              <h2 className="mb-6 hidden font-display text-2xl text-charcoal lg:block">Order summary</h2>
              <ul className="space-y-5 lg:max-h-80 lg:overflow-y-auto">
                {items.map((it) => (
                  <li key={it.productId} className="flex gap-4">
                    <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-sm bg-ivory-deep lg:bg-ivory">
                      <Image src={productImage(it)} alt="" fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-charcoal">{it.name}</div>
                      <div className="mt-1 text-sm text-stone-dark">Qty {it.quantity}</div>
                    </div>
                    <div className="shrink-0 whitespace-nowrap text-sm text-charcoal">{formatINR(priceOf(it) * it.quantity)}</div>
                  </li>
                ))}
              </ul>
              {priceChanged && (
                <p className="mt-6 border border-stone-light px-4 py-3 text-sm text-charcoal" role="status">
                  Some prices were updated since you added these items. The total below reflects current pricing.
                </p>
              )}
              <dl className="mt-6 space-y-3 border-t border-stone-light pt-6 text-sm text-charcoal">
                {!errors.deliveryDate && (
                  <div className="flex justify-between gap-4">
                    <dt>Delivery date</dt>
                    <dd className="text-right">{formatDeliveryDate(form.deliveryDate)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt>Subtotal</dt>
                  <dd>{formatINR(liveSubtotal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Shipping</dt>
                  <dd>{shipping === 0 ? "Free" : formatINR(shipping)}</dd>
                </div>
                {liveGstTotal > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt>GST</dt>
                    <dd>{formatINR(liveGstTotal)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4 border-t border-stone-light pt-4 text-base">
                  <dt>Total</dt>
                  <dd className="font-display text-2xl">{formatINR(total)}</dd>
                </div>
              </dl>
            </div>
          </aside>

          <form onSubmit={handleSubmit} noValidate className="space-y-12 lg:col-span-7 lg:row-start-1">
            <FormError
              ref={summaryRef}
              title={summaryItems.length > 0 ? "Please check the following" : undefined}
              items={summaryItems}
              onItemClick={focusField}
            >
              {summaryItems.length === 0 ? error : null}
            </FormError>

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
                <Field id={FIELD_IDS.customerEmail} label="Email" error={fieldError("customerEmail")}>
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

            <div>
              <Button type="submit" size="lg" disabled={submitting} className="w-full">
                {submitting ? "Placing order…" : paymentMethod === "RAZORPAY" ? "Place order & pay" : "Place order"}
              </Button>
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
