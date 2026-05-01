-- Humura Clinical Handshake Schema
-- Decouples bookings and chat threads with secure tokens

-- 1. Extend Sessions Table
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending', -- pending, confirmed, cancelled, active, completed
ADD COLUMN IF NOT EXISTS session_token uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 2. Create Chat Threads Table
CREATE TABLE IF NOT EXISTS public.chat_threads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
    patient_id uuid REFERENCES auth.users(id),
    doctor_id uuid REFERENCES auth.users(id),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(booking_id)
);

-- 3. Create Messages Table for Clinical Chat
CREATE TABLE IF NOT EXISTS public.clinical_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id uuid REFERENCES public.chat_threads(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES auth.users(id),
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Enable Realtime (Defensive Check)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        -- Check for sessions table
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'sessions'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
        END IF;

        -- Check for clinical_messages table
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'clinical_messages'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.clinical_messages;
        END IF;
    END IF;
END $$;

-- 5. RLS Policies (Security Handshake)
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own threads" ON public.chat_threads
FOR SELECT USING (
    auth.uid() = patient_id OR auth.uid() = doctor_id
);
