"use client";

import { useEffect, useState } from "react";
import { type ApiOrder, api } from "@/lib/api";
import { clearTrackEmail, getTrackEmail } from "@/lib/track-order-session";
import { lookupProblem } from "./tracking-logic";

function useTrackEmail() {
  // Email arrives via sessionStorage (never the URL). null = not read yet.
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    // Read once into state, then drop it from storage once the lookup finishes.
    setEmail(getTrackEmail() ?? "");
  }, []);
  return email;
}

/** Looks the order up with the id from the URL and the email kept in sessionStorage. */
export function useTrackedOrder(orderId: string) {
  const email = useTrackEmail();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (email === null) return;
    const problem = lookupProblem(orderId, email);
    if (problem) {
      if (problem.clearEmail) clearTrackEmail();
      setLoading(false);
      setError(problem.message);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .trackOrder(parseInt(orderId.trim(), 10), email)
      .then((o) => !cancelled && setOrder(o))
      .catch((err: Error) => !cancelled && setError(err.message || "Could not load order"))
      .finally(() => {
        if (cancelled) return;
        clearTrackEmail();
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, email]);

  return { order, loading, error };
}
