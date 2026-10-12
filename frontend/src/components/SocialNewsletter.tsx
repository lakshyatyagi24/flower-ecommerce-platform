"use client";
import React, { useState } from "react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";
import { api } from "@/lib/api";

export default function SocialNewsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || status === "sending") return;
    setStatus("sending");
    setErrorMsg("");
    try {
      await api.subscribeNewsletter(trimmed);
      setStatus("sent");
      setEmail("");
    } catch (err) {
      setErrorMsg(err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <section className="border-t border-stone-light py-16 md:py-24" aria-labelledby="newsletter-title">
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <Eyebrow className="mb-4">Newsletter</Eyebrow>
          <h2 id="newsletter-title" className="type-h2 text-charcoal">
            Notes from the studio
          </h2>
          <p className="mt-4 text-base leading-relaxed text-stone-dark">Seasonal stems and studio news, occasionally.</p>

          {status === "sent" ? (
            <p role="status" className="mt-8 border border-stone-light px-6 py-4 text-sm text-charcoal">
              You&apos;re on the list
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <label htmlFor="sn-email" className="sr-only">
                Your email address
              </label>
              {/* No bare flex-1 here: in the stacked (flex-col) layout flex-basis 0 would override h-11 and collapse the input. */}
              <input
                id="sn-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                aria-invalid={status === "error"}
                aria-describedby={status === "error" ? "sn-error" : undefined}
                className="h-11 min-h-11 w-full min-w-0 rounded-sm sm:flex-1 border border-stone bg-transparent px-4 text-sm text-charcoal placeholder:text-stone-dark focus:border-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
              />
              <Button type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Subscribing…" : "Subscribe"}
              </Button>
            </form>
          )}
          {status === "error" && (
            <p id="sn-error" role="alert" className="mt-3 text-sm font-medium text-charcoal">
              {errorMsg}
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
