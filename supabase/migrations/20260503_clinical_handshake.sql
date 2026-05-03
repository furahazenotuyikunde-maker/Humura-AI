-- Migration: Clinical Handshake Infrastructure
-- 1. Create Patient Caseload Table
CREATE TABLE IF NOT EXISTS public.patient_caseload (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES auth.users(id),
  patient_id UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'pending')),
  -- Ensure a patient can only have one active connection with a specific doctor
  UNIQUE(doctor_id, patient_id)
);

-- 2. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_caseload;

-- 3. RLS Policies
ALTER TABLE public.patient_caseload ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view their caseload" ON public.patient_caseload
    FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Patients can view their assignments" ON public.patient_caseload
    FOR SELECT USING (auth.uid() = patient_id);

-- 4. Index for performance
CREATE INDEX IF NOT EXISTS idx_caseload_doctor ON public.patient_caseload(doctor_id);
CREATE INDEX IF NOT EXISTS idx_caseload_patient ON public.patient_caseload(patient_id);
