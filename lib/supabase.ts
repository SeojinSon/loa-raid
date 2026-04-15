import { createClient } from "@supabase/supabase-js";

const isDiscord = typeof window !== "undefined" && window.location.hostname.includes("discordsays.com");

const supabaseUrl = isDiscord
  ? `${window.location.origin}/api/supabase`
  : process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);