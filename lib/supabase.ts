import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client for use in the browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get session on server-side if needed, though most logic here is Edge Functions
