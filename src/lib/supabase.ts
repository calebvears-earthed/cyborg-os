import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-safe · uses anon key · subject to RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-only · uses service role · bypasses RLS · NEVER expose client-side
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Memory types matching the memory system taxonomy
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
