-- Migration: Bulletproof Fix for Professional Video Uploads
-- 1. Create a security definer function to check professional status.
-- Using SECURITY DEFINER guarantees that this function runs with system-level privileges to query public.profiles,
-- preventing any recursive RLS lookups or policy conflicts during the INSERT evaluation.
CREATE OR REPLACE FUNCTION public.check_is_professional(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id 
        AND (role = 'doctor' OR role = 'admin' OR plan_type = 'professional')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions explicitly to ensure the DB roles can execute it
GRANT EXECUTE ON FUNCTION public.check_is_professional(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_professional(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.check_is_professional(uuid) TO service_role;

-- 2. Drop ALL existing policies on professional_videos to ensure a clean slate
DROP POLICY IF EXISTS "Professionals can upload their own videos" ON public.professional_videos;
DROP POLICY IF EXISTS "Anyone can view professional videos" ON public.professional_videos;
DROP POLICY IF EXISTS "Professionals can update their own videos" ON public.professional_videos;
DROP POLICY IF EXISTS "Professionals can delete their own videos" ON public.professional_videos;

-- 3. Explicitly re-enable RLS on the table just to be certain
ALTER TABLE public.professional_videos ENABLE ROW LEVEL SECURITY;

-- 4. Recreate clean, optimized policies

-- SELECT Policy: Open for viewing
CREATE POLICY "Anyone can view professional videos" 
ON public.professional_videos FOR SELECT 
USING (true);

-- INSERT Policy: Uses our bulletproof security definer function to bypass any RLS side-effects on the profile lookup
CREATE POLICY "Professionals can upload their own videos" 
ON public.professional_videos FOR INSERT 
WITH CHECK (
    auth.uid() = professional_id AND 
    public.check_is_professional(auth.uid())
);

-- UPDATE Policy: Owner can edit
CREATE POLICY "Professionals can update their own videos" 
ON public.professional_videos FOR UPDATE 
USING (auth.uid() = professional_id);

-- DELETE Policy: Owner can remove
CREATE POLICY "Professionals can delete their own videos" 
ON public.professional_videos FOR DELETE 
USING (auth.uid() = professional_id);

-- 5. Ensure public profiles are also readable by everyone as a general safeguard
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);
