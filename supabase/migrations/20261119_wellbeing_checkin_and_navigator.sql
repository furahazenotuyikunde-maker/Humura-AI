-- ==============================================================================
-- ADDITIVE MIGRATION: Wellbeing Check-In and Support Navigator
-- Non-destructive update: Creates new tables with RLS and adds indexes
-- ==============================================================================

-- 1. Wellbeing Check-Ins (Voluntary, Non-diagnostic self-reflection tracker)
CREATE TABLE IF NOT EXISTS public.wellbeing_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 1 AND 5),
    primary_feeling TEXT NOT NULL,
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
    sleep_quality TEXT,
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
    reflection_note TEXT,
    context_tags TEXT[] DEFAULT '{}',
    share_with_clinician BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for speedy chronological lookups per user
CREATE INDEX IF NOT EXISTS idx_wellbeing_checkins_user_created 
    ON public.wellbeing_checkins(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.wellbeing_checkins ENABLE ROW LEVEL SECURITY;

-- Policy: Patients can view and manage their own check-ins
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'wellbeing_checkins' AND policyname = 'Users can view own wellbeing checkins'
    ) THEN
        CREATE POLICY "Users can view own wellbeing checkins"
            ON public.wellbeing_checkins FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'wellbeing_checkins' AND policyname = 'Users can insert own wellbeing checkins'
    ) THEN
        CREATE POLICY "Users can insert own wellbeing checkins"
            ON public.wellbeing_checkins FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'wellbeing_checkins' AND policyname = 'Clinicians can view shared checkins of their patients'
    ) THEN
        CREATE POLICY "Clinicians can view shared checkins of their patients"
            ON public.wellbeing_checkins FOR SELECT
            USING (
                share_with_clinician = true AND (
                    EXISTS (
                        SELECT 1 FROM public.patient_caseload pc
                        WHERE pc.doctor_id = auth.uid() AND pc.patient_id = wellbeing_checkins.user_id
                    ) OR EXISTS (
                        SELECT 1 FROM public.patients p
                        WHERE p.doctor_id = auth.uid() AND p.id = wellbeing_checkins.user_id
                    )
                )
            );
    END IF;
END $$;


-- 2. Support Navigator Requests (Connecting users to trusted human help)
CREATE TABLE IF NOT EXISTS public.support_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_doctor_id UUID REFERENCES auth.users(id),
    support_type TEXT NOT NULL, -- 'clinician', 'peer', 'urgent_crisis', 'specialized'
    urgency_level TEXT DEFAULT 'routine', -- 'routine', 'same_day', 'urgent_crisis'
    preferred_channel TEXT DEFAULT 'video', -- 'video', 'phone', 'chat', 'in_person'
    contact_details TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'in_review', 'connected', 'resolved'
    confidentiality_acknowledged BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for patient lookups and triage workflow
CREATE INDEX IF NOT EXISTS idx_support_requests_patient 
    ON public.support_requests(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_requests_status 
    ON public.support_requests(status, urgency_level);

-- Enable RLS
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'support_requests' AND policyname = 'Patients can manage their own support requests'
    ) THEN
        CREATE POLICY "Patients can manage their own support requests"
            ON public.support_requests FOR ALL
            USING (auth.uid() = patient_id)
            WITH CHECK (auth.uid() = patient_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'support_requests' AND policyname = 'Clinicians can view and update support requests'
    ) THEN
        CREATE POLICY "Clinicians can view and update support requests"
            ON public.support_requests FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role IN ('doctor', 'admin')
                )
            );
    END IF;
END $$;

-- Enable Realtime for instant clinician triage
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE support_requests;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
