-- Fix Session Status Constraints to allow clinical handshake states
DO $$
BEGIN
    -- 1. Drop the old constraint if it exists
    -- The name is likely 'sessions_status_check' based on the error message
    ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_status_check;

    -- 2. Add the new expanded constraint
    ALTER TABLE public.sessions 
    ADD CONSTRAINT sessions_status_check 
    CHECK (status IN ('scheduled', 'confirmed', 'active', 'completed', 'missed', 'cancelled', 'pending'));

    -- 3. Ensure the default is 'scheduled'
    ALTER TABLE public.sessions ALTER COLUMN status SET DEFAULT 'scheduled';
END $$;
