const nextConfig = {
  images: {
    // allow loading images served from the dev frontend origin
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/assets/**",
      },
    ],
  },
};

export default nextConfig;
