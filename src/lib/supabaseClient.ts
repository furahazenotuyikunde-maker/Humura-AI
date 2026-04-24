import { createClient } from '@supabase/supabase-js'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseKey) {
  console.warn("⚠️ Humura AI: VITE_SUPABASE_ANON_KEY is missing in your .env file!");
} else {
  console.log("✅ Humura AI: Supabase key loaded successfully.");
}

export const supabase = createClient(supabaseUrl, supabaseKey)
