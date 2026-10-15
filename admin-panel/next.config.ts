import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin the public DSN to a literal ("" when unset) so the lazy Sentry import is statically dead without it.
  env: { NEXT_PUBLIC_SENTRY_DSN_ADMIN: process.env.NEXT_PUBLIC_SENTRY_DSN_ADMIN || "" },
  // Keep the SDK (and its OpenTelemetry deps) out of the server bundle; they are traced into .next/standalone.
  serverExternalPackages: ["@sentry/nextjs", "@sentry/node"],
};

export default nextConfig;
