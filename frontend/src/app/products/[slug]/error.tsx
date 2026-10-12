"use client";

import ErrorState from "@/components/ui/ErrorState";

export default function ProductError({ reset }: { error: Error; reset: () => void }) {
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
