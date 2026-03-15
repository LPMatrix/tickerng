import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Prevent Next from using a parent workspace root (fixes MODULE_NOT_FOUND and /_app errors)
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
