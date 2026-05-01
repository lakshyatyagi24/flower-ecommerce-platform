"use client";

import React from "react";
import { useSettings } from "@/lib/settings-context";

export default function TermsPage() {
  const settings = useSettings();
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose prose-slate">
      <p className="pill mb-3">Legal</p>
      <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight mb-2">Terms of Service</h1>
      <p className="text-sm text-slate-500">Last updated: April 2026</p>

      <h2 className="mt-8 text-xl font-semibold">1. About</h2>
      <p>This website is operated by {settings.name}. By placing an order or sending an enquiry, you agree to these terms.</p>

      <h2 className="mt-6 text-xl font-semibold">2. Orders</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Cut-flower products can be purchased online and are paid via the payment gateway shown at checkout.</li>
        <li>Bouquets, arrangements, hampers and corporate orders are quoted on enquiry. We will confirm pricing, GST and delivery before confirming the order.</li>
        <li>Cut flowers are perishable — we ship the freshest stems available on the day. Exact varieties and shades may vary based on mandi availability.</li>
      </ul>

      <h2 className="mt-6 text-xl font-semibold">3. Pricing & GST</h2>
      <p>Raw cut flowers are exempt from GST. Bouquets, arrangements and hampers (gift category) attract 5% GST as applicable. The applicable GST is shown on your order summary and invoice.</p>

      <h2 className="mt-6 text-xl font-semibold">4. Delivery</h2>
      <p>We deliver across Delhi NCR via cab for bulk orders and bike for retail orders. Delivery dates and time windows are confirmed on the order. Risk passes to you on delivery.</p>

      <h2 className="mt-6 text-xl font-semibold">5. Cancellations</h2>
      <p>Cut-flower orders may be cancelled before they are dispatched. Custom enquiries (bouquets, arrangements, hampers) may not be cancellable once we have started preparing them. Refer to our refund policy for details.</p>

      <h2 className="mt-6 text-xl font-semibold">6. Liability</h2>
      <p>Our liability is limited to the value of the order. We are not liable for indirect or consequential losses.</p>

      <h2 className="mt-6 text-xl font-semibold">7. Changes</h2>
      <p>We may update these terms from time to time. Continued use of the site means you accept the updated terms.</p>

      <h2 className="mt-6 text-xl font-semibold">8. Contact</h2>
      <p>
        {settings.name}
        {settings.email ? <><br />Email: <a href={`mailto:${settings.email}`} className="text-olive-green hover:underline">{settings.email}</a></> : null}
        {settings.phone ? <><br />Phone: <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`} className="text-olive-green hover:underline">{settings.phone}</a></> : null}
      </p>
    </main>
  );
}
