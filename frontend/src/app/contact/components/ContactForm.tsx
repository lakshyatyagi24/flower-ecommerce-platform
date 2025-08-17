"use client";
import React from "react";
import ContactAlert from "./ContactAlert";

export default function ContactForm() {
  const [form, setForm] = React.useState({ name: "", email: "", message: "" });
  const [status, setStatus] = React.useState<null | "idle" | "sending" | "sent" | "error">("idle");
  const [showAlert, setShowAlert] = React.useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      await new Promise((r) => setTimeout(r, 700));
      setStatus("sent");
      setShowAlert(true);
      setForm({ name: "", email: "", message: "" });
    } catch {
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
        <ContactAlert type="error" message="Could not send message. Please try again." onClose={() => setShowAlert(false)} />
      )}

      <h2 id="contact-form" className="text-xl font-semibold mb-4">Send a message</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Your name</label>
          <input id="name" name="name" value={form.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-olive-green/50 focus:border-olive-green" />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-olive-green/50 focus:border-olive-green" />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
          <textarea id="message" name="message" rows={5} value={form.message} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-olive-green/50 focus:border-olive-green" />
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={status === "sending"} className="inline-flex items-center px-4 py-2 bg-olive-green text-white rounded-md shadow hover:brightness-95 disabled:opacity-60">
            {status === "sending" ? "Sending..." : "Send message"}
          </button>

          {status === "sending" && <p className="text-sm text-gray-600">Sending message...</p>}
        </div>
      </form>

      <div className="mt-6 text-sm text-gray-600">
        <p>Prefer to call? Reach us at <a href="tel:+1234567890" className="text-olive-green hover:underline">+1 234 567 890</a></p>
        <p className="mt-1">Or email <a href="mailto:hello@example.com" className="text-olive-green hover:underline">hello@example.com</a></p>
      </div>
    </div>
  );
}
