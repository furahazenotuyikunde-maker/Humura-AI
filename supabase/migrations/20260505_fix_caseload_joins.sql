-- Migration: Fix Caseload Schema and Joins
-- This migration ensures that patient_caseload has explicit foreign keys to public tables,
-- which helps PostgREST perform joins correctly.

-- 1. Add foreign keys to public.profiles for better join support
ALTER TABLE public.patient_caseload 
  DROP CONSTRAINT IF EXISTS patient_caseload_patient_id_fkey,
  ADD CONSTRAINT patient_caseload_patient_id_fkey 
    FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.patient_caseload 
  DROP CONSTRAINT IF EXISTS patient_caseload_doctor_id_fkey,
  ADD CONSTRAINT patient_caseload_doctor_id_fkey 
    FOREIGN KEY (doctor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Ensure all existing patients in caseload have a record in the clinical patients table
-- This prevents the foreign key constraint from failing on existing data
INSERT INTO public.patients (id, status, created_at)
SELECT DISTINCT patient_id, 'active', NOW()
FROM public.patient_caseload
ON CONFLICT (id) DO NOTHING;

-- 3. Add an explicit foreign key to patients table for clinical_info joins
-- Note: patients.id is the same as profiles.id
ALTER TABLE public.patient_caseload
  DROP CONSTRAINT IF EXISTS patient_caseload_patient_clinical_fkey,
  ADD CONSTRAINT patient_caseload_patient_clinical_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

-- 3. Ensure the patients table has a row for any assigned patient
-- This trigger will automatically create a basic record in public.patients 
-- if a patient is added to a caseload but doesn't have clinical info yet.
CREATE OR REPLACE FUNCTION public.ensure_patient_record()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.patients (id, status, created_at)
    VALUES (NEW.patient_id, 'active', NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_patient_record ON public.patient_caseload;
CREATE TRIGGER trigger_ensure_patient_record
    BEFORE INSERT ON public.patient_caseload
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_patient_record();
