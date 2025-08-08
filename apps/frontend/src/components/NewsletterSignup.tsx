'use client';
import { useState } from 'react';

export default function NewsletterSignup() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Integrate with your email service provider or API
    setSubmitted(true);
  }

  return (
    <section className="max-w-xl mx-auto mt-16 mb-12 px-3 py-10 rounded-xl bg-beige border border-olive-200 shadow-md flex flex-col items-center">
      <h2 className="font-serif text-2xl font-bold mb-2 text-brown-800">Stay in Bloom</h2>
      <p className="text-primary text-base mb-5 text-center">
        Get rustic floral inspiration and special offers.
      </p>
      {submitted ? (
        <div className="text-green-700 font-semibold py-6">Thank you for subscribing!</div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center"
        >
          <input
            required
            type="email"
            placeholder="Your Email Address"
            className="flex-1 px-4 py-2 border border-olive-200 rounded-lg outline-accent focus:ring-1 focus:ring-accent text-primary"
            autoComplete="email"
          />
          <button
            type="submit"
            className="button-primary px-7 py-2 text-base font-semibold rounded-lg"
          >
            Join Now
          </button>
        </form>
      )}
    </section>
  );
}
