import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Suppress middleware deprecation warning until proxy is stable
    // The current middleware implementation works fine
  },
};

export default nextConfig;
