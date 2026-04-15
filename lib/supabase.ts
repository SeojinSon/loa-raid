import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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