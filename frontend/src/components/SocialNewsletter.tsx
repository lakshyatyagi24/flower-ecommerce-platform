"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function SocialNewsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<null | "idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    try {
      await new Promise((r) => setTimeout(r, 600));
      setStatus("sent");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="bg-rose-50 border-t py-8">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-semibold">Follow us for floral inspiration</h3>
            <p className="text-sm text-gray-700 mt-1">See our latest arrangements and behind-the-scenes on social media.</p>
            <div className="mt-3 flex items-center gap-3">
              <Link href="#" className="text-gray-700 hover:text-olive-green">Instagram</Link>
              <Link href="#" className="text-gray-700 hover:text-olive-green">Facebook</Link>
              <Link href="#" className="text-gray-700 hover:text-olive-green">Pinterest</Link>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <label htmlFor="sn-email" className="sr-only">Email</label>
            <input
              id="sn-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-olive-green/30"
            />
            <button type="submit" className="px-4 py-2 bg-olive-green text-white rounded-r-md hover:opacity-95">
              {status === "sending" ? "Sending..." : "Subscribe"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
