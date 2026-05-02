-- 007_user_journals.sql
-- Migration to support daily journaling for users

CREATE TABLE IF NOT EXISTS public.journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mood_emoji TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;

-- Policies for user access
CREATE POLICY "Users can view their own journals" ON public.journals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journals" ON public.journals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journals" ON public.journals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journals" ON public.journals
    FOR DELETE USING (auth.uid() = user_id);

-- Add real-time support
ALTER PUBLICATION supabase_realtime ADD TABLE public.journals;
