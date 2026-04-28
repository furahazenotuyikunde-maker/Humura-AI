-- Create mood_logs table
CREATE TABLE IF NOT EXISTS public.mood_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT NULL, -- Allowing null for Guest access
    mood TEXT NOT NULL,
    emoji TEXT,
    score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert and select (Guest-Ready)
CREATE POLICY "Enable insert for all" ON public.mood_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all" ON public.mood_logs FOR SELECT USING (true);
