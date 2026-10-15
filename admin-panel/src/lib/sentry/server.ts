import * as Sentry from "@sentry/nextjs";
import { buildOptions } from "./options";

/** Server-side init (called from instrumentation.ts only when a DSN is set). Request errors arrive via onRequestError. */
export function initServerSentry(dsn: string) {
  Sentry.init(buildOptions(dsn, process.env));
}

export const captureRequestError = Sentry.captureRequestError;
