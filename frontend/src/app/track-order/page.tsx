"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!orderId.trim()) {
      setError("Please enter your Order ID.");
      return;
    }

    // For now navigate to a results page or show placeholder
    // We'll assume a simple query parameter approach: /track-order?orderId=...
    // Using native location to keep client-only behavior predictable.
    const params = new URLSearchParams();
    params.set("orderId", orderId.trim());
    if (contact.trim()) params.set("contact", contact.trim());

    window.location.href = `/track-order/results?${params.toString()}`;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-semibold mb-2">Track your order</h1>
        <p className="text-sm text-olive-green/80 mb-6">Enter your Order ID to track your delivery status</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
            <input
              id="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g., 12345-ABCDE"
              className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-olive-green/30"
            />
          </div>

          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">Email or phone (optional)</label>
            <input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Email or phone used for the order"
              className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-olive-green/30"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-transparent border border-1 border-olive-green/80 rounded-md px-4 py-2 text-olive-green hover:bg-olive-green/5 focus:outline-none focus:ring-2 focus:ring-olive-green/30"
              style={{ borderWidth: "1px" }}
            >
              Track Order
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3">If you don&apos;t have an account, you can still track orders using your Order ID and the email or phone used at checkout.</p>

          <div className="mt-6 text-sm">
            <Link href="/contact" className="text-olive-green/80 hover:text-olive-green">Need help? Contact support</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
