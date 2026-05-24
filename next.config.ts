import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  transpilePackages: ["react-force-graph-2d", "force-graph"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
