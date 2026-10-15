"use client";

import { useReportError } from "@/lib/sentry/use-report-error";

/** Last-resort boundary: renders only when the root layout itself throws. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useReportError(error);
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "6rem 1rem" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>Something went wrong</h1>
        <p style={{ marginBottom: "1.5rem" }}>We hit an unexpected problem. Please try again.</p>
        <button type="button" onClick={reset} style={{ padding: "0.6rem 1.4rem", cursor: "pointer" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
