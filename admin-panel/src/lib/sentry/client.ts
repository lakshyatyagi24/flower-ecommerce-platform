import * as Sentry from "@sentry/nextjs";
import { buildOptions } from "./options";

/** Browser init. Only ever reached through a dynamic import (see ./loader.ts). */
export function initClientSentry(dsn: string) {
  Sentry.init({
    ...buildOptions(
      dsn,
      {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_SENTRY_RELEASE: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
      },
      // Trace headers only to our own API host.
      process.env.NEXT_PUBLIC_API_BASE ? [process.env.NEXT_PUBLIC_API_BASE] : [],
    ),
    // Keep the browser footprint small: no session replay.
    integrations: (defaults) => defaults.filter((i) => !/replay/i.test(i.name)),
  });
}

export function captureClientError(error: unknown) {
  Sentry.captureException(error);
}
