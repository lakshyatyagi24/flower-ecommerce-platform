import * as Sentry from "@sentry/nextjs";
import { buildOptions } from "./options";

/**
 * Server-side init (called from instrumentation.ts only when a DSN is set).
 * Next 14 has no onRequestError hook, so errors Next logs while rendering a
 * request (console.error) are forwarded via captureConsoleIntegration.
 */
export function initServerSentry(dsn: string) {
  Sentry.init({
    ...buildOptions(dsn, process.env),
    integrations: [Sentry.captureConsoleIntegration({ levels: ["error"] })],
  });
}
