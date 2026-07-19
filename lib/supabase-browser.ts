import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The ONLY Supabase client in the frontend. It exists solely so the /reset-password page can
// consume the password-recovery link (Supabase puts a recovery session in the URL hash) and call
// auth.updateUser({ password }). Everything else in this app talks to the backend API, not Supabase.
//
// detectSessionInUrl:true is what turns the "#access_token=…&type=recovery" fragment into a live
// session on load. Created lazily so a missing env var only bites on the reset page, not app-wide.

let client: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  client = createClient(url, anon, {
    auth: { detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
  });
  return client;
}
