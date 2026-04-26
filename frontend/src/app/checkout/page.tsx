"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, formatINR } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { ApiError, api } from "@/lib/api";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, count, clear } = useCart();
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    city: "",
    postalCode: "",
    notes: "",
    paymentMethod: "COD",
  });

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
  }, []);

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
    if (freeThreshold > 0 && subtotal >= freeThreshold) return 0;
    return flatRate;
  }, [subtotal, count, flatRate, freeThreshold]);
  const total = subtotal + shipping;

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
        customerPhone: form.customerPhone.trim() || undefined,
        shippingAddress: form.shippingAddress.trim(),
        city: form.city.trim() || undefined,
        postalCode: form.postalCode.trim() || undefined,
        notes: form.notes.trim() || undefined,
        paymentMethod: form.paymentMethod,
      });
      clear();
      router.push(`/checkout/success?orderId=${order.id}`);
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
      <p className="text-slate-700 mb-8">Cash on delivery is our MVP option — your order is secured the moment you confirm.</p>

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
                <input value={form.customerPhone} onChange={(e) => update("customerPhone", e.target.value)} placeholder="+91 99999 11111" className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40" />
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
                  <input value={form.city} onChange={(e) => update("city", e.target.value)} className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Postal code</span>
                  <input value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40" />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Notes for delivery (optional)</span>
                <textarea rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Buzzer code, gift message, preferred time…" className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40" />
              </label>
            </div>
          </section>

          <section className="section-card p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Payment</h2>
            <label className="flex items-start gap-3 p-4 rounded-md border border-olive-green/20 bg-olive-green/5">
              <input type="radio" checked={form.paymentMethod === "COD"} onChange={() => update("paymentMethod", "COD")} className="mt-1" />
              <div>
                <span className="font-medium text-slate-900">Cash on delivery</span>
                <p className="text-sm text-slate-700 mt-1">Pay our courier when your bouquet arrives. Online card and UPI payments are coming soon.</p>
              </div>
            </label>
          </section>

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
                    {it.image ? (
                      <Image src={it.image} alt={it.name} fill sizes="56px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">🌸</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{it.name}</div>
                    <div className="text-xs text-slate-600">Qty {it.quantity}</div>
                  </div>
                  <div className="text-sm font-semibold text-olive-green">{formatINR(it.price * it.quantity)}</div>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-olive-green/10 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "Free" : formatINR(shipping)}</span></div>
              <div className="flex justify-between text-base font-semibold text-olive-green pt-2 border-t border-olive-green/10"><span>Total</span><span>{formatINR(total)}</span></div>
            </div>
            <button type="submit" disabled={submitting} className="mt-5 w-full bg-olive-green text-white px-6 py-3 rounded-full font-semibold shadow-md hover:shadow-lg disabled:opacity-50">
              {submitting ? "Placing order…" : "Place order"}
            </button>
          </div>
        </aside>
      </form>
    </main>
  );
}
