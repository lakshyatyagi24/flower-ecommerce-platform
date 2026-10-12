"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, formatINR } from "@/lib/cart-context";
import { productImage } from "@/lib/product-image";
import { useAuth } from "@/lib/auth-context";
import { ApiError, api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import ErrorState from "@/components/ui/ErrorState";
import { payForOrder, type PayHandlers } from "@/lib/razorpay-flow";
import { clearPendingOrder, readPendingOrderId, savePendingOrder } from "@/lib/pending-order";

const RESERVED_MSG = (id: number) => `Payment not completed. Your order #${id} is reserved for 30 minutes.`;

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
    notes: "",
    paymentMethod: "RAZORPAY" as "COD" | "RAZORPAY",
  });

  // Online-payment state. `pendingId` is an order that exists on the server but
  // is not paid yet: while set, the checkout form is not rendered, so a second
  // order can't be created by accident.
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCheck, setShowCheck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [expired, setExpired] = useState(false);
  const [restoring, setRestoring] = useState(true);

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
        if (o.paymentStatus === "PAID" && o.status !== "CANCELLED") {
          goToSuccess(id);
        } else if (
          o.status === "PENDING" &&
          o.paymentMethod === "RAZORPAY" &&
          (o.paymentStatus === "UNPAID" || o.paymentStatus === "FAILED")
        ) {
          setPendingId(id);
          setNotice(RESERVED_MSG(id));
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

  const payHandlers = (id: number): PayHandlers => ({
    onPaid: () => goToSuccess(id),
    // The success page explains the refund from the order's stored state.
    onRefundDue: () => goToSuccess(id),
    onDismiss: () => {
      setNotice(RESERVED_MSG(id));
      setShowCheck(false);
    },
    onFailure: () => {
      setNotice(RESERVED_MSG(id));
      setShowCheck(false);
    },
    onVerifyError: (msg) => {
      setNotice(msg);
      setShowCheck(true);
    },
    onError: (msg) => {
      setNotice(msg);
      setShowCheck(false);
    },
  });

  const payNow = (id: number) => {
    setNotice(null);
    setShowCheck(false);
    void payForOrder(id, payHandlers(id));
  };

  const switchToCod = async (id: number) => {
    if (busy) return;
    setBusy(true);
    try {
      await api.setOrderPaymentMethod(id, user?.email);
      goToSuccess(id);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setNotice("This order can no longer be switched. Check its status below.");
        setShowCheck(true);
      } else {
        setNotice(err instanceof Error && err.message ? err.message : "Could not switch to cash on delivery");
      }
    } finally {
      setBusy(false);
    }
  };

  const checkStatus = async (id: number) => {
    if (busy) return;
    setBusy(true);
    try {
      const o = await api.getMyOrder(id);
      if (o.status === "CANCELLED" && o.paymentStatus !== "PAID") {
        clearPendingOrder();
        setPendingId(null);
        setExpired(true);
      } else if (o.paymentStatus === "PAID" || o.paymentMethod === "COD" || o.status === "CANCELLED") {
        goToSuccess(id);
      } else {
        setNotice("Your payment has not been confirmed yet. " + RESERVED_MSG(id));
      }
    } catch (err) {
      setNotice(err instanceof Error && err.message ? err.message : "Could not check the order status");
    } finally {
      setBusy(false);
    }
  };

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

  const flatRate = parseFloat(settings["shipping.flatRate"] || "0") || 0;
  const freeThreshold = parseFloat(settings["shipping.freeThreshold"] || "0") || 0;
  const shipping = useMemo(() => {
    if (count === 0) return 0;
    if (freeThreshold > 0 && liveSubtotal >= freeThreshold) return 0;
    return flatRate;
  }, [liveSubtotal, count, flatRate, freeThreshold]);
  const total = liveSubtotal + shipping + liveGstTotal;

  // Don't render the form for guests — they're being redirected to /account/login.
  if (authLoading || !user) {
    return (
      <main className="section-shell mt-12 mb-16">
        <div className="animate-pulse space-y-4 max-w-3xl">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </main>
    );
  }

  if (restoring) {
    return (
      <main className="section-shell mt-12 mb-16">
        <div className="animate-pulse space-y-4 max-w-3xl" aria-busy="true">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-32 bg-slate-200 rounded" />
        </div>
      </main>
    );
  }

  if (pendingId !== null) {
    return (
      <main className="section-shell mt-12 mb-16">
        <div className="section-card p-8 max-w-xl mx-auto">
          <h1 className="text-2xl font-semibold text-slate-900">Payment pending</h1>
          <p className="mt-2 text-slate-700">
            Your order #{pendingId} has been created and is waiting for payment. It stays reserved for 30 minutes.
          </p>
          {notice && (
            <div className="mt-4 px-4 py-3 rounded bg-amber-50 text-amber-800 text-sm" role="status">
              {notice}
            </div>
          )}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => payNow(pendingId)}
              className="bg-olive-green text-white px-6 py-3 rounded-full font-semibold disabled:opacity-50"
            >
              Pay now
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => switchToCod(pendingId)}
              className="px-6 py-3 rounded-full font-semibold border border-olive-green text-olive-green disabled:opacity-50"
            >
              Switch to cash on delivery
            </button>
            {showCheck && (
              <button
                type="button"
                disabled={busy}
                onClick={() => checkStatus(pendingId)}
                className="px-6 py-3 rounded-full font-semibold underline underline-offset-4 disabled:opacity-50"
              >
                Check status
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (expired) {
    return (
      <main className="section-shell mt-12 mb-16 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Order expired</h1>
        <p className="mt-2 text-slate-700">This order expired because payment was not completed. Nothing was charged.</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => setExpired(false)}
            className="bg-olive-green text-white px-6 py-3 rounded-full font-semibold"
          >
            Back to checkout
          </button>
          <Link href="/products" className="text-olive-green font-semibold underline-offset-4 hover:underline self-center">
            Continue shopping — browse products
          </Link>
        </div>
      </main>
    );
  }

  if (count > 0 && (settingsError || pricesError)) {
    return (
      <main className="section-shell mt-12 mb-16">
        <ErrorState
          message="We couldn't load delivery charges. Please refresh."
          onRetry={() => {
            reloadSettings();
            reloadPrices();
          }}
        />
      </main>
    );
  }

  if (count > 0 && (settingsLoading || pricesLoading || !settingsData || !pricing)) {
    return (
      <main className="section-shell mt-12 mb-16">
        <div className="animate-pulse space-y-4 max-w-3xl" aria-busy="true">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </main>
    );
  }

  if (count === 0) {
    return (
      <main className="section-shell mt-12 mb-16 text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Your cart is empty</h1>
        <p className="mt-2 text-slate-700">Add some florals before you can check out.</p>
        <Link href="/products" className="mt-6 inline-block bg-olive-green text-white px-6 py-3 rounded-full font-semibold hover:opacity-95">
          Browse florals
        </Link>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const order = await api.createOrder({
        items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        shippingAddress: form.shippingAddress.trim(),
        city: form.city.trim(),
        postalCode: form.postalCode.trim(),
        notes: form.notes.trim() || undefined,
        paymentMethod: form.paymentMethod,
      });
      if (form.paymentMethod === "COD") {
        goToSuccess(order.id);
      } else {
        // Keep the cart until payment is confirmed. Remember the order so a
        // refresh shows the pending panel instead of a fresh, submittable form.
        savePendingOrder(order.id);
        setPendingId(order.id);
        setNotice(null);
        void payForOrder(order.id, payHandlers(order.id));
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not place order";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const update = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <main className="section-shell mt-12 mb-16">
      <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-2">Checkout</h1>
      <p className="text-slate-700 mb-8">Choose how you would like to pay. Online orders are held for 30 minutes while you complete payment.</p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="section-card p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Contact details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Full name</span>
                <input required value={form.customerName} onChange={(e) => update("customerName", e.target.value)} className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Email</span>
                <input type="email" required value={form.customerEmail} onChange={(e) => update("customerEmail", e.target.value)} className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Phone</span>
                <input type="tel" inputMode="tel" required pattern="(\+?91[\s\-]?|0)?[6-9][0-9]{4}[\s\-]?[0-9]{5}" title="Enter a valid 10-digit Indian mobile number" value={form.customerPhone} onChange={(e) => update("customerPhone", e.target.value)} placeholder="+91 99999 11111" className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40" />
              </label>
            </div>
          </section>

          <section className="section-card p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Shipping address</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Address</span>
                <textarea required rows={3} value={form.shippingAddress} onChange={(e) => update("shippingAddress", e.target.value)} placeholder="Street, building, landmark…" className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40" />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">City</span>
                  <input required maxLength={80} value={form.city} onChange={(e) => update("city", e.target.value)} className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Postal code</span>
                  <input required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} title="Enter a valid 6-digit PIN code" value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40" />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Notes for delivery (optional)</span>
                <textarea rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Buzzer code, gift message, preferred time…" className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40" />
              </label>
            </div>
          </section>

          <fieldset className="section-card p-6 space-y-3">
            <legend className="text-xl font-semibold text-slate-900 mb-1 px-1">Payment</legend>
            <label className="flex items-start gap-3 p-4 rounded-md border border-olive-green/20 bg-olive-green/5">
              <input type="radio" name="paymentMethod" checked={form.paymentMethod === "RAZORPAY"} onChange={() => update("paymentMethod", "RAZORPAY")} className="mt-1" />
              <div>
                <span className="font-medium text-slate-900">Pay online (UPI, cards, net banking)</span>
                <p className="text-sm text-slate-700 mt-1">Secure payment through Razorpay. Your order is confirmed once payment succeeds.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-4 rounded-md border border-olive-green/20">
              <input type="radio" name="paymentMethod" checked={form.paymentMethod === "COD"} onChange={() => update("paymentMethod", "COD")} className="mt-1" />
              <div>
                <span className="font-medium text-slate-900">Cash on delivery</span>
                <p className="text-sm text-slate-700 mt-1">Pay our courier when your bouquet arrives.</p>
              </div>
            </label>
          </fieldset>

          {error && (
            <div className="px-4 py-3 rounded bg-red-50 text-red-700 text-sm" role="alert">{error}</div>
          )}
        </div>

        <aside className="lg:col-span-1">
          <div className="section-card p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Order summary</h2>
            <ul className="space-y-3 max-h-72 overflow-y-auto">
              {items.map((it) => (
                <li key={it.productId} className="flex gap-3">
                  <div className="relative w-14 h-14 flex-shrink-0 rounded bg-slate-100 overflow-hidden">
                    <Image src={productImage(it)} alt={it.name} fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{it.name}</div>
                    <div className="text-xs text-slate-600">Qty {it.quantity}</div>
                  </div>
                  <div className="text-sm font-semibold text-olive-green">{formatINR(priceOf(it) * it.quantity)}</div>
                </li>
              ))}
            </ul>
            {priceChanged && (
              <div className="mt-4 px-3 py-2 rounded bg-amber-50 text-amber-800 text-xs" role="status">
                Some prices were updated since you added these items. The total below reflects current pricing.
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-olive-green/10 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(liveSubtotal)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "Free" : formatINR(shipping)}</span></div>
              {liveGstTotal > 0 && (
                <div className="flex justify-between"><span>GST</span><span>{formatINR(liveGstTotal)}</span></div>
              )}
              <div className="flex justify-between text-base font-semibold text-olive-green pt-2 border-t border-olive-green/10"><span>Total</span><span>{formatINR(total)}</span></div>
            </div>
            <button type="submit" disabled={submitting} className="mt-5 w-full bg-olive-green text-white px-6 py-3 rounded-full font-semibold shadow-md hover:shadow-lg disabled:opacity-50">
              {submitting ? "Placing order…" : form.paymentMethod === "RAZORPAY" ? "Place order & pay" : "Place order"}
            </button>
          </div>
        </aside>
      </form>
    </main>
  );
}
