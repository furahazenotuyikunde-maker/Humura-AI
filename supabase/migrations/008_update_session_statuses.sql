-- Migration 008: Update session statuses to include confirmed and pending
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_status_check;
ALTER TABLE public.sessions ADD CONSTRAINT sessions_status_check CHECK (status IN ('pending', 'scheduled', 'confirmed', 'active', 'completed', 'missed'));
