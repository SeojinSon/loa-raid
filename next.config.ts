import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;",
          },
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/supabase/:path*",
        destination: `https://${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace("https://", "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;