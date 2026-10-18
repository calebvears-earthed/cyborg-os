-- CYBORG OS V2 · ATLAS BRAIN SCHEMA
-- Paste the entire contents of this file into Supabase SQL Editor and hit RUN
-- Safe to re-run · uses IF NOT EXISTS everywhere

-- ============ EXTENSIONS ============
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============ MEMORIES ============
-- Atlas's long-term memory. Mirrors the file-based memory system.
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('user', 'project', 'feedback', 'reference')),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS memories_type_idx ON memories(type);
CREATE INDEX IF NOT EXISTS memories_name_idx ON memories(name);
CREATE INDEX IF NOT EXISTS memories_embedding_idx ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============ CONVERSATIONS ============
-- Every chat message · persisted across sessions
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  job_id UUID,
  tool_name TEXT,
  tool_input JSONB,
  tool_output JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversations_session_idx ON conversations(session_id, created_at);
CREATE INDEX IF NOT EXISTS conversations_job_idx ON conversations(job_id) WHERE job_id IS NOT NULL;

-- ============ JOBS ============
-- The Jobs module · every project lives as a record here
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client TEXT NOT NULL,
  address TEXT,
  entity TEXT NOT NULL CHECK (entity IN ('EHV', 'EE', 'PE')),
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'quoted', 'signed', 'scheduled', 'installing', 'complete', 'cancelled')),
  bom JSONB DEFAULT '{}'::jsonb,
  cash JSONB DEFAULT '{}'::jsonb,
  dates JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status);
CREATE INDEX IF NOT EXISTS jobs_entity_idx ON jobs(entity);
CREATE INDEX IF NOT EXISTS jobs_client_idx ON jobs(client);

-- ============ CONTEXT POINTERS ============
-- Pointers to external resources (OneDrive files, Outlook threads, etc)
CREATE TABLE IF NOT EXISTS context_pointers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  namespace TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  linked_memory_id UUID REFERENCES memories(id) ON DELETE SET NULL,
  linked_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(namespace, key)
);

CREATE INDEX IF NOT EXISTS context_pointers_namespace_idx ON context_pointers(namespace);

-- ============ UPDATED_AT TRIGGERS ============
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_memories ON memories;
CREATE TRIGGER set_timestamp_memories
  BEFORE UPDATE ON memories
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_jobs ON jobs;
CREATE TRIGGER set_timestamp_jobs
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

-- ============ ROW LEVEL SECURITY ============
-- For now · service role bypass only (Caleb-only app)
-- When members portal lands later, add proper auth policies

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_pointers ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by server-side code)
-- Anon key gets read-only on conversations for the current session (temporary · tighten later)

DROP POLICY IF EXISTS "service_role_all_memories" ON memories;
CREATE POLICY "service_role_all_memories" ON memories
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_conversations" ON conversations;
CREATE POLICY "service_role_all_conversations" ON conversations
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_jobs" ON jobs;
CREATE POLICY "service_role_all_jobs" ON jobs
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_pointers" ON context_pointers;
CREATE POLICY "service_role_all_pointers" ON context_pointers
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ============ SEED JOBS (optional · comment out if not wanted) ============
INSERT INTO jobs (client, address, entity, status, dates, notes) VALUES
  ('Shivelec · Sunrise Homes', '43-45 West Avenue, Edinburgh SA 5111', 'EHV', 'signed',
   '{"install_target": "Dec 2026 - Jan 2027", "sapn_spec_ref": "500051641"}'::jsonb,
   '500 kVA Wilson Mk 7 padmount LILO · $144k ex GST'),
  ('Malieke', '15 Martello St, Mount Barker SA 5251', 'EE', 'scheduled',
   '{"install_dates": "21-23 Oct 2026", "energise": "24 Oct 2026"}'::jsonb,
   '10.45 kW solar + 24.96 kWh battery · $16,999 paid · $8,210 rebate expected'),
  ('Woods + Graham', 'Paech Road, Mount Barker SA 5251', 'EE', 'signed',
   '{"install_target": "mid-November 2026"}'::jsonb,
   '10.45 kW solar + 41.60 kWh battery · $9,224 rebate expected')
ON CONFLICT DO NOTHING;

-- ============ DONE ============
-- Schema is live. Atlas can now read + write memories, conversations, jobs.
-- Run SELECT COUNT(*) FROM jobs; to verify seed data landed.
