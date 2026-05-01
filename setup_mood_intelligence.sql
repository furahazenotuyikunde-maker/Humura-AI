-- HUMURA AI - MOOD INTELLIGENCE SCHEMA SETUP
-- This ensures the Progress Page, Real-time Sync, and AI recommendations work perfectly.

-- 1. Reset the table with a standard, high-compatibility structure
DROP TABLE IF EXISTS public.mood_logs;

CREATE TABLE public.mood_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(),
    mood TEXT NOT NULL,
    emoji TEXT,
    score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Standard column for week tracking (App handles this automatically)
    week_number INTEGER
);

-- 2. Enable Real-Time Sync (Instant UI updates)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  
  ALTER PUBLICATION supabase_realtime ADD TABLE mood_logs;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 3. Security Policies
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage own moods" 
ON public.mood_logs FOR ALL 
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
