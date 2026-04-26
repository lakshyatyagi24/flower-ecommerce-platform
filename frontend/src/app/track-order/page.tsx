"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TrackOrderPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!orderId.trim()) {
      setError("Please enter your Order ID.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter the email used at checkout.");
      return;
    }

    const params = new URLSearchParams();
    params.set("orderId", orderId.trim());
    params.set("email", email.trim());
    router.push(`/track-order/results?${params.toString()}`);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-semibold mb-2">Track your order</h1>
        <p className="text-sm text-olive-green/80 mb-6">Enter your Order ID and email used at checkout to track delivery status.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
            <input
              id="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g., 1042"
              className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-olive-green/30"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email at checkout</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-olive-green/30"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-olive-green text-white rounded-md px-4 py-2 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-olive-green/30"
            >
              Track Order
            </button>
          </div>

          <div className="mt-6 text-sm">
            <Link href="/contact" className="text-olive-green/80 hover:text-olive-green">Need help? Contact support</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
