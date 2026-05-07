-- Update RLS policy for professional_videos to allow users with role = 'doctor' to upload
DROP POLICY IF EXISTS "Professionals can upload their own videos" ON public.professional_videos;

CREATE POLICY "Professionals can upload their own videos" 
ON public.professional_videos FOR INSERT 
WITH CHECK (
    auth.uid() = professional_id AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (plan_type = 'professional' OR role = 'doctor')
    )
);
