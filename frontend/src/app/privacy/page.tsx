"use client";

import React from "react";
import { useSettings } from "@/lib/settings-context";

export default function PrivacyPage() {
  const settings = useSettings();
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose prose-slate">
      <p className="pill mb-3">Legal</p>
      <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-500">Last updated: April 2026</p>

      <h2 className="mt-8 text-xl font-semibold">1. Information we collect</h2>
      <p>We collect the information you provide when placing an order or sending an enquiry — name, phone number, email, delivery address and any notes about your requirement. We also receive basic device and browser information automatically.</p>

      <h2 className="mt-6 text-xl font-semibold">2. How we use it</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>To process orders and enquiries and arrange delivery.</li>
        <li>To contact you about your order or enquiry by phone, WhatsApp or email.</li>
        <li>To improve our products and the website.</li>
      </ul>

      <h2 className="mt-6 text-xl font-semibold">3. Sharing</h2>
      <p>We do not sell or rent your personal information. We share details with delivery partners only to the extent needed to fulfil your order. We use a payment gateway to process online payments — they handle card and UPI data directly.</p>

      <h2 className="mt-6 text-xl font-semibold">4. Cookies</h2>
      <p>We use cookies and local storage to keep your shopping cart and login session working across pages.</p>

      <h2 className="mt-6 text-xl font-semibold">5. Your choices</h2>
      <p>You can request a copy or deletion of your data by contacting us at the details below. We retain order records as required for accounting and tax compliance.</p>

      <h2 className="mt-6 text-xl font-semibold">6. Contact</h2>
      <p>
        {settings.name}
        {settings.email ? <><br />Email: <a href={`mailto:${settings.email}`} className="text-olive-green hover:underline">{settings.email}</a></> : null}
        {settings.phone ? <><br />Phone: <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`} className="text-olive-green hover:underline">{settings.phone}</a></> : null}
        {settings.address ? <><br />{settings.address}</> : null}
      </p>
    </main>
  );
}
