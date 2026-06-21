import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Tree-shake icon barrels so each route only bundles the icons it imports
    // instead of pulling the whole lucide-react package.
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
