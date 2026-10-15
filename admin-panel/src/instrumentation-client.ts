// Runs in the browser before hydration. NEXT_PUBLIC_SENTRY_DSN_ADMIN is pinned to a literal in next.config.ts,
// so with no DSN this whole block is dead code and nothing (not even the loader) is bundled.
if (process.env.NEXT_PUBLIC_SENTRY_DSN_ADMIN) {
  void import("./lib/sentry/loader").then((m) => m.startSentry());
}

export {};
