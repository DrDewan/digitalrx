import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Actions are used for every mutation in this app.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
