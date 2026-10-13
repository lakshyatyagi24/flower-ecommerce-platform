/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
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
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // The generated OG images read the Cormorant TTF with fs at request time; make sure
    // the standalone output (Docker) contains it.
    outputFileTracingIncludes: {
      "/products/[slug]/opengraph-image": ["./src/app/fonts/**"],
      "/products/[slug]/twitter-image": ["./src/app/fonts/**"],
    },
  },
};

export default nextConfig;
