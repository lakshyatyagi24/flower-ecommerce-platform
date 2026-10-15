import { DENY_URLS, IGNORED_ERRORS, isExpectedClientError, scrubEvent, type AnyEvent } from "./scrub";

/**
 * Shared Sentry options for the storefront (server and browser). Pure: no SDK
 * import here, so it can be built into either entry without pulling Sentry
 * into the first-load bundle.
 */
/**
 * `tracePropagationTargets` limits which outgoing requests get sentry-trace/baggage headers. It is deliberately
 * explicit (own API only) so those headers never reach Razorpay, Resend or Cloudinary.
 */
export function buildOptions(
  dsn: string,
  env: Record<string, string | undefined>,
  tracePropagationTargets: Array<string | RegExp> = [],
) {
  return {
    dsn,
    environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV || "production",
    release: env.SENTRY_RELEASE || env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
    ignoreErrors: IGNORED_ERRORS,
    tracePropagationTargets,
    denyUrls: DENY_URLS,
    maxBreadcrumbs: 30,
    beforeSend<T extends AnyEvent>(event: T, hint?: { originalException?: unknown }) {
      if (isExpectedClientError(hint?.originalException)) return null;
      return scrubEvent(event);
    },
    beforeSendTransaction<T extends AnyEvent>(event: T) {
      return scrubEvent(event);
    },
  };
}
