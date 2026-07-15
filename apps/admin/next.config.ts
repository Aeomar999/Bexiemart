import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Point Turbopack to the actual monorepo root to ignore C:\Users\Jerry\package-lock.json
  turbopack: {
    root: path.join(__dirname, "../../"),
  },
  async rewrites() {
    const backendUrl = process.env.INTERNAL_API_URL || "http://localhost:3000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
