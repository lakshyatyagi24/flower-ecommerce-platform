"use client";

import { useEffect } from "react";
import { reportClientError } from "./loader";

/** Error-boundary hook: forwards the caught error to Sentry (no-op without a build-time DSN). */
export function useReportError(error: unknown) {
  useEffect(() => {
    reportClientError(error);
  }, [error]);
}
