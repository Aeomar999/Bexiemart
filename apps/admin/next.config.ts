import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Point Turbopack to the actual monorepo root to ignore C:\Users\Jerry\package-lock.json
  turbopack: {
    root: path.join(__dirname, "../../"),
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://localhost:3000/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
