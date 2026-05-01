"use client";
import React from "react";
import ContactAlert from "./ContactAlert";
import { api, ApiError } from "@/lib/api";
import { useSettings, telLink, mailtoLink } from "@/lib/settings-context";

export default function ContactForm() {
  const settings = useSettings();
  const phoneHref = telLink(settings.phone);
  const emailHref = mailtoLink(settings.email);
  const [form, setForm] = React.useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = React.useState<null | "idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showAlert, setShowAlert] = React.useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage(null);
    try {
      await api.createEnquiry({
        customerName: form.name,
        customerEmail: form.email || undefined,
        customerPhone: form.phone,
        message: form.message,
        source: "contact-page",
      });
      setStatus("sent");
      setShowAlert(true);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not send message";
      setErrorMessage(msg);
      setStatus("error");
      setShowAlert(true);
    }
  }

  React.useEffect(() => {
    if (status === "sent") {
      const t = setTimeout(() => setShowAlert(false), 3500);
      return () => clearTimeout(t);
    }
  }, [status]);

  return (
    <div>
      {showAlert && status === "sent" && (
        <ContactAlert type="success" message="Message sent — we will reply soon." onClose={() => setShowAlert(false)} />
      )}
      {showAlert && status === "error" && (
        <ContactAlert type="error" message={errorMessage || "Could not send message. Please try again."} onClose={() => setShowAlert(false)} />
      )}

      <h2 id="contact-form" className="text-xl font-semibold mb-4">Send a message</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Your name</label>
          <input id="name" name="name" value={form.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-olive-green/50 focus:border-olive-green" />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone <span className="text-rose-500">*</span></label>
          <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required placeholder="+91 98765 43210" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-olive-green/50 focus:border-olive-green" />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email <span className="text-gray-400 text-xs">(optional)</span></label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-olive-green/50 focus:border-olive-green" />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
          <textarea id="message" name="message" rows={5} value={form.message} onChange={handleChange} required placeholder="Tell us what you're looking for — flower type, quantity, event date, etc." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-olive-green/50 focus:border-olive-green" />
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={status === "sending"} className="inline-flex items-center px-4 py-2 bg-olive-green text-white rounded-md shadow hover:brightness-95 disabled:opacity-60">
            {status === "sending" ? "Sending..." : "Send message"}
          </button>

          {status === "sending" && <p className="text-sm text-gray-600">Sending message...</p>}
        </div>
      </form>

      <div className="mt-6 text-sm text-gray-600">
        {phoneHref ? (
          <p>Prefer to call? Reach us at <a href={phoneHref} className="text-olive-green hover:underline">{settings.phone}</a></p>
        ) : null}
        {emailHref ? (
          <p className="mt-1">Or email <a href={emailHref} className="text-olive-green hover:underline">{settings.email}</a></p>
        ) : null}
      </div>
    </div>
  );
}
