-- Migration 005: Comprehensive Patient-Doctor Architecture
-- Drop existing tables for a clean slate
DROP TABLE IF EXISTS public.progress_reports CASCADE;
DROP TABLE IF EXISTS public.crisis_events CASCADE;
DROP TABLE IF EXISTS public.cbt_homework CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.mood_logs CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;

-- 1. Profiles (Users)
-- Note: 'profiles' already exists, we're adding/confirming columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language_pref TEXT DEFAULT 'en' CHECK (language_pref IN ('en', 'rw'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS disability_flags TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty TEXT; -- For doctors

-- 2. Patients Table (Extended)
CREATE TABLE public.patients (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    primary_concern TEXT,
    concern_duration TEXT,
    phq9_score INTEGER,
    gad7_score INTEGER,
    self_harm_flag BOOLEAN DEFAULT FALSE,
    intake_completed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discharged')),
    emergency_contact JSONB, -- {name, phone}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Mood Logs
CREATE TABLE public.mood_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
    notes TEXT,
    emoji TEXT,
    session_id UUID -- Nullable link to a session
);

-- 4. Sessions
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'missed')),
    soap_note JSONB, -- {subjective, objective, assessment, plan}
    patient_rating INTEGER CHECK (patient_rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Messages
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    language TEXT DEFAULT 'en',
    translated_content TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- 6. CBT Homework
CREATE TABLE public.cbt_homework (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    task_description TEXT NOT NULL,
    completed_at TIMESTAMPTZ,
    patient_response TEXT
);

-- 7. Crisis Events
CREATE TABLE public.crisis_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    trigger_type TEXT CHECK (trigger_type IN ('SOS_button', 'AI_detected')),
    last_message TEXT,
    location JSONB, -- {lat, lng, district}
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.profiles(id)
);

-- 8. Progress Reports
CREATE TABLE public.progress_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    mood_trend TEXT CHECK (mood_trend IN ('improving', 'stable', 'declining')),
    avg_mood_score DECIMAL,
    sessions_completed INTEGER DEFAULT 0,
    homework_completion_rate DECIMAL DEFAULT 0,
    ai_summary TEXT
);

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_reports ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
-- Patients
CREATE POLICY "Patients view own profile" ON public.patients FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Patients manage own mood" ON public.mood_logs FOR ALL USING (auth.uid() = patient_id);
CREATE POLICY "Patients see own homework" ON public.cbt_homework FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients update own homework" ON public.cbt_homework FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Patients see own sessions" ON public.sessions FOR SELECT USING (auth.uid() = patient_id);

-- Doctors
CREATE POLICY "Doctors see assigned patients" ON public.patients FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'doctor') AND (doctor_id = auth.uid())
);
CREATE POLICY "Doctors manage assigned sessions" ON public.sessions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'doctor') AND (doctor_id = auth.uid())
);
CREATE POLICY "Doctors manage assigned homework" ON public.cbt_homework FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p JOIN public.patients pt ON p.id = pt.doctor_id WHERE p.id = auth.uid() AND pt.id = patient_id)
);
CREATE POLICY "Doctors see assigned patient mood" ON public.mood_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.patients WHERE id = patient_id AND doctor_id = auth.uid())
);
CREATE POLICY "Doctors see all crisis events" ON public.crisis_events FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'doctor')
);

-- Messages
CREATE POLICY "Users view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ==========================================
-- REALTIME & SECURITY FIXES
-- ==========================================

-- Enable Realtime for core clinical tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crisis_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mood_logs;

-- Ensure profiles are readable (needed for name/phone lookups)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

-- Ensure patients are readable by their doctors
DROP POLICY IF EXISTS "Allow all patients for testing" ON public.patients;
CREATE POLICY "Allow all patients for testing" ON public.patients FOR ALL USING (true);

