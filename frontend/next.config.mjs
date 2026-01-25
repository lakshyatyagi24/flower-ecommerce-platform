const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "3000", pathname: "/**" },
      { protocol: "http", hostname: "localhost", port: "3001", pathname: "/**" },
      { protocol: "https", hostname: "**" },
    ],
    domains: ["localhost"],
  },
};

export default nextConfig;
