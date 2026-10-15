/**
 * Next.js instrumentation hook (enabled via experimental.instrumentationHook).
 * Initialises server-side Sentry ONLY when SENTRY_DSN_WEB (or the public DSN)
 * is set; otherwise this function returns immediately and the SDK is never
 * loaded, so there is no network traffic and no behaviour change.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return; // no middleware/edge routes use Sentry
  const dsn = (process.env.SENTRY_DSN_WEB || process.env.NEXT_PUBLIC_SENTRY_DSN_WEB || "").trim();
  if (!dsn) return;
  const { initServerSentry } = await import("./lib/sentry/server");
  initServerSentry(dsn);
}
