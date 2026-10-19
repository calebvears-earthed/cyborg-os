import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy instantiation · env vars read at request time, not module load.
// Prevents `next build` from blowing up when envs aren't set.

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

function getUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  return url;
}

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anon) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  _supabase = createClient(getUrl(), anon);
  return _supabase;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  _supabaseAdmin = createClient(getUrl(), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _supabaseAdmin;
}

// Back-compat exports via Proxy so existing imports keep working
export const supabase = new Proxy({} as SupabaseClient, {
  get: (_, prop) => (getSupabase() as any)[prop],
});
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get: (_, prop) => (getSupabaseAdmin() as any)[prop],
});

export type MemoryType = "user" | "project" | "feedback" | "reference";

export interface Memory {
  id: string;
  type: MemoryType;
  name: string;
  description: string;
  content: string;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  job_id: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  client: string;
  address: string | null;
  status: "lead" | "quoted" | "signed" | "scheduled" | "installing" | "complete" | "cancelled";
  bom: Record<string, any>;
  cash: Record<string, any>;
  dates: Record<string, any>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
