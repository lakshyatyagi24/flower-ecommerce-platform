"use client";

import React from "react";
import { useSettings } from "@/lib/settings-context";

export default function RefundPolicyPage() {
  const settings = useSettings();
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose prose-slate">
      <p className="pill mb-3">Legal</p>
      <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight mb-2">Refund & Cancellation Policy</h1>
      <p className="text-sm text-slate-500">Last updated: April 2026</p>

      <h2 className="mt-8 text-xl font-semibold">Cut flowers (purchase products)</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Cancellations accepted up to 2 hours before the scheduled delivery slot. We will refund the order in full to the original payment method within 5–7 business days.</li>
        <li>If the flowers arrive damaged or in poor condition, share photos within 4 hours of delivery and we will replace the order or refund.</li>
        <li>Cut flowers are perishable, so we cannot accept returns once delivered in good condition.</li>
      </ul>

      <h2 className="mt-6 text-xl font-semibold">Bouquets, arrangements & hampers (enquiry products)</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Once you confirm an enquiry quote and we begin preparing the order, cancellations may not be possible. Any refund eligibility will be confirmed at the time of quotation.</li>
        <li>For damaged or incorrect arrangements, contact us within 4 hours of delivery with photos and we will work with you on a replacement or partial refund.</li>
      </ul>

      <h2 className="mt-6 text-xl font-semibold">How to request</h2>
      <p>Reach us at {settings.phone || "the phone number on the contact page"} or {settings.email || "the email on the contact page"} with your order ID and reason. We respond within a few hours during business hours.</p>
    </main>
  );
}
