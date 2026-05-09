-- Migration: Fix Professional Videos RLS Policy
-- This ensures that users with role = 'doctor' or plan_type = 'professional' can upload videos.

-- 1. Ensure public profiles are viewable by everyone (critical for the EXISTS subquery in the RLS check)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- 2. Drop the old upload policy if it exists
DROP POLICY IF EXISTS "Professionals can upload their own videos" ON public.professional_videos;

-- 3. Create the updated, robust upload policy
CREATE POLICY "Professionals can upload their own videos" 
ON public.professional_videos FOR INSERT 
WITH CHECK (
    auth.uid() = professional_id AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'doctor' OR plan_type = 'professional')
    )
);

-- 4. Ensure select, update, and delete policies are correctly defined
DROP POLICY IF EXISTS "Anyone can view professional videos" ON public.professional_videos;
CREATE POLICY "Anyone can view professional videos" 
ON public.professional_videos FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Professionals can update their own videos" ON public.professional_videos;
CREATE POLICY "Professionals can update their own videos" 
ON public.professional_videos FOR UPDATE 
USING (auth.uid() = professional_id);

DROP POLICY IF EXISTS "Professionals can delete their own videos" ON public.professional_videos;
CREATE POLICY "Professionals can delete their own videos" 
ON public.professional_videos FOR DELETE 
USING (auth.uid() = professional_id);
