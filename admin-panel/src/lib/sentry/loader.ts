/**
 * Lazy browser hook. NEXT_PUBLIC_SENTRY_DSN_ADMIN is pinned to a literal in
 * next.config.ts (`env`, "" when unset), so with no DSN every branch below is
 * statically dead and the SDK chunk is never emitted. Keep the env read
 * lexically inside each `if`.
 */
type ClientModule = typeof import("./client");

let ready: Promise<ClientModule> | null = null;

function load(): Promise<ClientModule> | null {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN_ADMIN) {
    ready ??= import("./client").then((m) => {
      m.initClientSentry(process.env.NEXT_PUBLIC_SENTRY_DSN_ADMIN as string);
      return m;
    });
    return ready;
  }
  return null;
}

/** Called once from instrumentation-client.ts. */
export function startSentry() {
  void load();
}

/** For error boundaries: report a caught render error (no-op without a DSN). */
export function reportClientError(error: unknown) {
  void load()?.then((m) => m.captureClientError(error));
}
