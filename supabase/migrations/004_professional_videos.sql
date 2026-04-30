-- Migration 004: Professional Videos
-- 1. Update plan_type to include 'professional'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_type_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_type_check CHECK (plan_type IN ('free', 'pro', 'professional'));

-- 2. Create professional_videos table
CREATE TABLE IF NOT EXISTS public.professional_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title_en TEXT NOT NULL,
    title_rw TEXT NOT NULL,
    description_en TEXT,
    description_rw TEXT,
    video_url TEXT NOT NULL, -- YouTube ID or full URL
    thumbnail_url TEXT,
    category TEXT, -- e.g., 'Anxiety', 'Depression', etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.professional_videos ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Anyone can view professional videos" 
ON public.professional_videos FOR SELECT 
USING (true);

CREATE POLICY "Professionals can upload their own videos" 
ON public.professional_videos FOR INSERT 
WITH CHECK (
    auth.uid() = professional_id AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND plan_type = 'professional'
    )
);

CREATE POLICY "Professionals can update their own videos" 
ON public.professional_videos FOR UPDATE 
USING (auth.uid() = professional_id);

CREATE POLICY "Professionals can delete their own videos" 
ON public.professional_videos FOR DELETE 
USING (auth.uid() = professional_id);
