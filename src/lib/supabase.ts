import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-domain-so-app-doesnt-crash.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (supabaseUrl === 'https://placeholder-domain-so-app-doesnt-crash.supabase.co') {
  console.warn('Supabase env vars missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Vercel or your .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

