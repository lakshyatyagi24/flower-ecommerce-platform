const OG_ASSETS = [
  "./src/app/fonts/**",
  "./node_modules/next/dist/compiled/@vercel/og/*.wasm",
  "./node_modules/next/dist/compiled/@vercel/og/*.ttf",
];

// Security (incident 2026-10-15): Next 14.2.x has no patched release for the image-optimiser advisories
// (e.g. GHSA-2xp9-vwfh-vxw4, AVIF RCE). A bare "res.cloudinary.com/**" pattern lets anyone point /_next/image at
// THEIR OWN Cloudinary account, so restrict the path to our cloud when its name is known at build time
// (CLOUDINARY_CLOUD_NAME build arg; see Dockerfile). Unset (local dev, tests) keeps the permissive pattern.
const CLOUD = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
const CLOUDINARY_PATH = /^[A-Za-z0-9_-]+$/.test(CLOUD) ? `/${CLOUD}/**` : "/**";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Pin the public DSN to a literal ("" when unset) so the lazy Sentry import is statically dead without it.
  env: { NEXT_PUBLIC_SENTRY_DSN_WEB: process.env.NEXT_PUBLIC_SENTRY_DSN_WEB || "" },
  async headers() {
    // /_next/static/* is already `immutable` (content-hashed). Files copied verbatim from public/ are not
    // hashed, so cache them for a day and let stale copies serve for a week while revalidating.
    return [
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      {
        source: "/logo.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
  images: {
    // Optimised variants are cached for a week (Next's default is 60 s, which re-encodes constantly).
    minimumCacheTTL: 604800,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: CLOUDINARY_PATH },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Loads src/instrumentation.ts (server-side Sentry; a no-op without SENTRY_DSN_WEB). Not needed on Next 15+.
    instrumentationHook: true,
    // Keep the SDK (and its OpenTelemetry deps) out of the webpack server bundle; they are traced into .next/standalone.
    serverComponentsExternalPackages: ["@sentry/nextjs", "@sentry/node"],
    // The generated OG images read the Cormorant TTF with fs at request time, and next/og loads
    // yoga.wasm / resvg.wasm / the default Noto font next to its own bundle via a runtime-built
    // file URL that the file tracer cannot follow. List them all so the standalone output
    // (Docker) is guaranteed to contain them.
    outputFileTracingIncludes: {
      "/products/[slug]/opengraph-image": OG_ASSETS,
      "/products/[slug]/twitter-image": OG_ASSETS,
    },
  },
};

export default nextConfig;
