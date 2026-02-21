import { createClient as supabaseCreateClient } from "@supabase/supabase-js";

let client: ReturnType<typeof supabaseCreateClient> | null = null;

export function createClient() {
  if (client) return client;
  client = supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return client;
}
