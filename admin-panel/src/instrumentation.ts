/**
 * Next.js instrumentation hook. Initialises server-side Sentry ONLY when
 * SENTRY_DSN_ADMIN (or the public DSN) is set; otherwise nothing is loaded.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const dsn = (process.env.SENTRY_DSN_ADMIN || process.env.NEXT_PUBLIC_SENTRY_DSN_ADMIN || "").trim();
  if (!dsn) return;
  const { initServerSentry } = await import("./lib/sentry/server");
  initServerSentry(dsn);
}

/** Reports unhandled server render/route errors (Next 15). No-op without a DSN. */
export async function onRequestError(...args: unknown[]) {
  const dsn = (process.env.SENTRY_DSN_ADMIN || process.env.NEXT_PUBLIC_SENTRY_DSN_ADMIN || "").trim();
  if (!dsn || process.env.NEXT_RUNTIME !== "nodejs") return;
  const { captureRequestError } = await import("./lib/sentry/server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (captureRequestError as (...a: any[]) => void)(...args);
}
