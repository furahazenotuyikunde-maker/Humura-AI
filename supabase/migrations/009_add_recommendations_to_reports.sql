-- Migration 009: Add recommendations to progress_reports
ALTER TABLE public.progress_reports ADD COLUMN IF NOT EXISTS recommendations TEXT[] DEFAULT '{}';

-- Add RLS Policies for progress_reports
DROP POLICY IF EXISTS "Patients view own reports" ON public.progress_reports;
CREATE POLICY "Patients view own reports" ON public.progress_reports FOR SELECT USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors manage assigned patient reports" ON public.progress_reports;
CREATE POLICY "Doctors manage assigned patient reports" ON public.progress_reports FOR ALL USING (
    EXISTS (SELECT 1 FROM public.patients WHERE id = patient_id AND doctor_id = auth.uid())
);

