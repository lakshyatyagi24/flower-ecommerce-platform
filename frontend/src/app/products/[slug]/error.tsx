"use client";

import ErrorState from "@/components/ui/ErrorState";
import { useReportError } from "@/lib/sentry/use-report-error";

export default function ProductError({ error, reset }: { error: Error; reset: () => void }) {
  useReportError(error);
  return (
    <main className="py-24">
      <ErrorState
        message="We couldn't load this product right now. Please try again in a moment."
        onRetry={reset}
        link={{ href: "/products", label: "Back to all flowers" }}
      />
    </main>
  );
}
