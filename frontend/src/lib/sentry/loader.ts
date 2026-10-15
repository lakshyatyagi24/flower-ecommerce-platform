/**
 * Zero-cost client hook. NEXT_PUBLIC_SENTRY_DSN_WEB is inlined at build time
 * (next.config.mjs `env` pins it to "" when unset, so it is always a literal).
 * With no DSN every branch below is statically dead and the bundler drops the
 * dynamic import: no Sentry chunk is emitted or fetched. With a DSN the SDK
 * loads as its own async chunk after the page is idle (never in first-load JS).
 * Keep `process.env.NEXT_PUBLIC_SENTRY_DSN_WEB` lexically inside each `if`.
 */
type ClientModule = typeof import("./client");

let ready: Promise<ClientModule> | null = null;

function load(): Promise<ClientModule> | null {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN_WEB) {
    ready ??= import("./client").then((m) => {
      m.initClientSentry(process.env.NEXT_PUBLIC_SENTRY_DSN_WEB as string);
      return m;
    });
    return ready;
  }
  return null;
}

export function startSentryWhenIdle() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN_WEB && typeof window !== "undefined") {
    const start = () => void load();
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(start, { timeout: 5000 });
    else setTimeout(start, 3000);
  }
}

/** For error boundaries: report a caught render error (no-op without a DSN). */
export function reportClientError(error: unknown) {
  void load()?.then((m) => m.captureClientError(error));
}
