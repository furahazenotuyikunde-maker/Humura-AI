-- Migration 005: Doctor Dashboard Schema (Robust Version)
-- Drop existing tables to ensure clean schema application
DROP TABLE IF EXISTS public.progress_reports CASCADE;
DROP TABLE IF EXISTS public.crisis_events CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;

-- 1. Update profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS disability_flags TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Data Migration: Map plan_type to role
UPDATE public.profiles SET role = 'doctor' WHERE plan_type = 'professional';
UPDATE public.profiles SET role = 'patient' WHERE role IS NULL;

-- 2. Create patients table
CREATE TABLE public.patients (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    diagnosis TEXT,
    program_id TEXT,
    risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'at-risk', 'discharged')),
    age INTEGER,
    location TEXT,
    preferred_language TEXT DEFAULT 'rw',
    emergency_contact JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create sessions table
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date TIMESTAMPTZ DEFAULT NOW(),
    type TEXT DEFAULT 'chat' CHECK (type IN ('chat', 'voice')),
    soap_note JSONB, -- {subjective, objective, assessment, plan}
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create messages table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    translated_content TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

-- 5. Create crisis_events table
CREATE TABLE public.crisis_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
    resolved_at TIMESTAMPTZ,
    notes TEXT,
    location JSONB -- {lat, lng}
);

-- 6. Create progress_reports table
CREATE TABLE public.progress_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    mood_trend TEXT CHECK (mood_trend IN ('improving', 'stable', 'declining')),
    ai_summary TEXT,
    engagement_score INTEGER,
    recommended_steps TEXT[]
);

-- Enable RLS for all
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_reports ENABLE ROW LEVEL SECURITY;

-- 7. Policies
-- Patients
CREATE POLICY "Patients can see their own data" ON public.patients FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Patients can see their sessions" ON public.sessions FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients can see their messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Patients can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Doctors
CREATE POLICY "Doctors can manage their patients" ON public.patients FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'doctor') AND (doctor_id = auth.uid() OR doctor_id IS NULL)
);

CREATE POLICY "Doctors can manage sessions" ON public.sessions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'doctor') AND doctor_id = auth.uid()
);

CREATE POLICY "Doctors can manage reports" ON public.progress_reports FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'doctor')
);

CREATE POLICY "Crisis alerts are public to doctors" ON public.crisis_events FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'doctor')
);
