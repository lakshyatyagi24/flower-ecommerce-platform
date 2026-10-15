import * as Sentry from "@sentry/nextjs";
import { buildOptions } from "./options";

/**
 * Server-side init (called from instrumentation.ts only when a DSN is set).
 * Next 14 has no onRequestError hook, so errors Next logs while rendering a
 * request (console.error) are forwarded via captureConsoleIntegration.
 */
export function initServerSentry(dsn: string) {
  Sentry.init({
    // Trace headers only to the in-container API loopback (API_BASE_INTERNAL), never third parties.
    ...buildOptions(dsn, process.env, process.env.API_BASE_INTERNAL ? [process.env.API_BASE_INTERNAL] : []),
    integrations: [Sentry.captureConsoleIntegration({ levels: ["error"] })],
  });
}
