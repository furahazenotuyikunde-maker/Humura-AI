-- Create video_sessions table
CREATE TABLE IF NOT EXISTS video_sessions (
  id uuid default gen_random_uuid() primary key,
  doctor_id uuid references auth.users(id),
  patient_id uuid references auth.users(id),
  room_url text,
  room_name text,
  status text default 'waiting' 
    check (status in ('waiting','active','ended')),
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- Enable Realtime on this table
ALTER PUBLICATION supabase_realtime ADD TABLE video_sessions;
