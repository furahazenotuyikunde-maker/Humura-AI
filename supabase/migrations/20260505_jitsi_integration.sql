-- Migration to support Jitsi Video Sessions in the main sessions table
ALTER TABLE sessions 
  ADD COLUMN IF NOT EXISTS video_room_url TEXT,
  ADD COLUMN IF NOT EXISTS video_started_at TIMESTAMP;

-- Ensure video_sessions table is still usable or migrated if needed, 
-- but following user's instructions to move to sessions table columns.
