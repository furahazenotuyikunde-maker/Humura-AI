-- Create chat_logs table
CREATE TABLE IF NOT EXISTS public.chat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'model')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sign_detections table
CREATE TABLE IF NOT EXISTS public.sign_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    detected_sign TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sign_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only see their own chat logs" 
ON public.chat_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own chat logs" 
ON public.chat_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only see their own detections" 
ON public.sign_detections FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own detections" 
ON public.sign_detections FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only see their own progress" 
ON public.user_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only upsert their own progress" 
ON public.user_progress FOR ALL 
USING (auth.uid() = user_id);
