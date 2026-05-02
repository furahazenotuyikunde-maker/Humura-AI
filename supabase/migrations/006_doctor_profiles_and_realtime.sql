-- 1. Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create doctor_profiles table
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialisations  TEXT[]    DEFAULT '{}',
    languages        TEXT[]    DEFAULT '{"en"}',
    bio              TEXT,
    years_experience INT       DEFAULT 0,
    is_available     BOOLEAN   DEFAULT false,
    caseload_count   INT       DEFAULT 0,
    rating_avg       NUMERIC(3,1) DEFAULT 0.0,
    session_count    INT       DEFAULT 0,
    last_seen_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create View for public doctor information
CREATE OR REPLACE VIEW public.doctors_public AS
    SELECT
      p.id,
      p.full_name AS name,
      p.language_pref AS language,
      dp.specialisations,
      dp.languages,
      dp.bio,
      dp.years_experience,
      dp.is_available,
      dp.caseload_count,
      dp.rating_avg,
      dp.session_count,
      p.avatar_url
    FROM public.profiles p
    JOIN public.doctor_profiles dp ON dp.user_id = p.id
    WHERE p.role = 'doctor';

-- 4. RLS Policies
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can view doctor profiles
CREATE POLICY "Public can view doctor profiles" ON public.doctor_profiles
    FOR SELECT USING (true);

-- Doctors can update their own profile
CREATE POLICY "Doctors can update own profile" ON public.doctor_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 5. Enable Realtime for doctor_profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_profiles;
