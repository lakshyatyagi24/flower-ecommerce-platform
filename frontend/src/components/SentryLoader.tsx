"use client";

import { useEffect } from "react";
import { startSentryWhenIdle } from "@/lib/sentry/loader";

/** Renders nothing; starts the lazily loaded browser SDK once the page is idle. Only mounted when a DSN is configured. */
export default function SentryLoader() {
  useEffect(() => {
    startSentryWhenIdle();
  }, []);
  return null;
}
