import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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