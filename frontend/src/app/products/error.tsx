"use client";

import ErrorState from "@/components/ui/ErrorState";

export default function ProductsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="py-24">
      <ErrorState message="We couldn't load our flowers right now. Please try again in a moment." onRetry={reset} />
    </main>
  );
}
