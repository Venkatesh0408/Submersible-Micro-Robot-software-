/// <reference types="vite/client" />
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Client-side Supabase client. Reads the public anon key (safe to expose).
// Until VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set, the client is null so
// the app still runs (Continue as Guest works) and real sign-in is simply disabled.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
    ? createClient(url as string, anonKey as string, {
          auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
          },
      })
    : null;

// Where OAuth / magic-link providers redirect back to.
export const authRedirectTo = `${window.location.origin}/auth/callback`;
