/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // The generated OG images read the Cormorant TTF with fs at request time; make sure
    // the standalone output (Docker) contains it.
    outputFileTracingIncludes: {
      "/opengraph-image": ["./src/app/fonts/**"],
      "/twitter-image": ["./src/app/fonts/**"],
      "/products/[slug]/opengraph-image": ["./src/app/fonts/**"],
      "/products/[slug]/twitter-image": ["./src/app/fonts/**"],
    },
  },
};

export default nextConfig;
