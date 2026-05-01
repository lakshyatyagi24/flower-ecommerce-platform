"use client";

import React from "react";
import { api, ApiError } from "@/lib/api";

export type EnquiryFormDefaults = {
  productId?: number | null;
  productName?: string;
  source?: string;
  occasion?: string;
};

export type EnquiryFormProps = EnquiryFormDefaults & {
  variant?: "card" | "inline";
  heading?: string;
  description?: string;
  submitLabel?: string;
  onSuccess?: () => void;
};

const occasionOptions = [
  "Corporate / Office",
  "Wedding",
  "Anniversary",
  "Birthday",
  "Conference / Event",
  "Other",
];

export default function EnquiryForm({
  productId = null,
  productName,
  source = "website",
  occasion: defaultOccasion,
  variant = "card",
  heading = "Send an enquiry",
  description = "Share your requirement and we will call you back to confirm pricing and availability.",
  submitLabel = "Send enquiry",
  onSuccess,
}: EnquiryFormProps) {
  const [form, setForm] = React.useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    quantity: "",
    eventDate: "",
    occasion: defaultOccasion || "",
    address: "",
    city: "",
    message: "",
  });
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage(null);
    try {
      await api.createEnquiry({
        productId: productId ?? undefined,
        productName,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail || undefined,
        quantity: form.quantity ? Number(form.quantity) : undefined,
        eventDate: form.eventDate || undefined,
        occasion: form.occasion || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        message: form.message || undefined,
        source,
      });
      setStatus("sent");
      setForm({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        quantity: "",
        eventDate: "",
        occasion: defaultOccasion || "",
        address: "",
        city: "",
        message: "",
      });
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not send enquiry";
      setErrorMessage(msg);
      setStatus("error");
    }
  }

  const wrapperClass =
    variant === "card"
      ? "bg-white rounded-2xl border border-olive-green/10 shadow-sm p-6"
      : "";

  return (
    <div className={wrapperClass}>
      {heading ? <h2 className="text-xl font-semibold text-olive-green">{heading}</h2> : null}
      {description ? <p className="text-sm text-gray-600 mt-1">{description}</p> : null}
      {productName ? (
        <p className="mt-2 text-xs uppercase tracking-wide text-gray-500">
          Enquiring about: <span className="font-semibold text-gray-800">{productName}</span>
        </p>
      ) : null}

      {status === "sent" ? (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Thanks — we&apos;ve received your enquiry. We&apos;ll call you back shortly.
        </div>
      ) : null}
      {status === "error" && errorMessage ? (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {errorMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-1">
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Your name *</label>
          <input
            id="customerName"
            name="customerName"
            value={form.customerName}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-olive-green/50 focus:border-olive-green"
          />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700">Phone *</label>
          <input
            id="customerPhone"
            name="customerPhone"
            type="tel"
            value={form.customerPhone}
            onChange={handleChange}
            placeholder="+91 98765 43210"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-olive-green/50 focus:border-olive-green"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">Email <span className="text-xs text-gray-400">(optional)</span></label>
          <input
            id="customerEmail"
            name="customerEmail"
            type="email"
            value={form.customerEmail}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-olive-green/50 focus:border-olive-green"
          />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity / size</label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            value={form.quantity}
            onChange={handleChange}
            placeholder="e.g. 50 stems, 10 bouquets"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-olive-green/50 focus:border-olive-green"
          />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700">Delivery / event date</label>
          <input
            id="eventDate"
            name="eventDate"
            type="date"
            value={form.eventDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-olive-green/50 focus:border-olive-green"
          />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="occasion" className="block text-sm font-medium text-gray-700">Occasion</label>
          <select
            id="occasion"
            name="occasion"
            value={form.occasion}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-olive-green/50 focus:border-olive-green"
          >
            <option value="">Select…</option>
            {occasionOptions.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
          <input
            id="city"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="Delhi NCR"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-olive-green/50 focus:border-olive-green"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Delivery address</label>
          <textarea
            id="address"
            name="address"
            rows={2}
            value={form.address}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-olive-green/50 focus:border-olive-green"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">Additional details</label>
          <textarea
            id="message"
            name="message"
            rows={3}
            value={form.message}
            onChange={handleChange}
            placeholder="Tell us about colour preferences, budget, special requirements, etc."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-olive-green/50 focus:border-olive-green"
          />
        </div>
        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={status === "sending"}
            className="inline-flex items-center px-5 py-2 bg-olive-green text-white rounded-md shadow hover:brightness-95 disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : submitLabel}
          </button>
          <p className="text-xs text-gray-500">We will respond within a few hours.</p>
        </div>
      </form>
    </div>
  );
}
