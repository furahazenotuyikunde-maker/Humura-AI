-- Migration 003: Setup User Profiles and Rate Limiting
-- 1. Create profiles table to track plans
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'pro')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create rate_limit_logs to track ALL attempts (including rejected ones)
CREATE TABLE IF NOT EXISTS public.rate_limit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add index for fast counting
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_time ON public.rate_limit_logs (user_id, created_at);

-- 4. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "System can manage all profiles" ON public.profiles FOR ALL USING (true); -- Internal use
CREATE POLICY "Users can only see their own logs" ON public.rate_limit_logs FOR SELECT USING (auth.uid() = user_id);
