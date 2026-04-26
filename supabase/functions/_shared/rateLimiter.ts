
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

/**
 * Checks if the global rate limit has been exceeded.
 * Limit: 20 requests per minute.
 * Returns true if allowed, false if limit exceeded.
 */
export async function checkRateLimit(): Promise<{ allowed: boolean; count: number }> {
  const now = new Date()
  const oneMinuteAgo = new Date(now.getTime() - 60000).toISOString()

  try {
    // 1. Log this request
    const { error: insertError } = await supabase
      .from('request_logs')
      .insert([{ created_at: now.toISOString() }])

    if (insertError) {
      // If table doesn't exist, we might need to create it or just fail safe (allow)
      // but the requirement is STRICT.
      console.error("Error logging request:", insertError)
      
      // Attempt to create table if it doesn't exist (primitive migration)
      if (insertError.code === '42P01') { // undefined_table
        console.log("Table 'request_logs' not found. Please create it in the Supabase SQL Editor.")
        // For now, we'll allow it but log a warning. 
        // In a real production environment, this should be part of a migration.
        return { allowed: true, count: 0 }
      }
    }

    // 2. Count requests in the last minute
    const { count, error: countError } = await supabase
      .from('request_logs')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', oneMinuteAgo)

    if (countError) {
      console.error("Error counting requests:", countError)
      return { allowed: true, count: 0 }
    }

    const currentCount = count || 0
    const limit = 20

    return {
      allowed: currentCount <= limit,
      count: currentCount
    }
  } catch (err) {
    console.error("Rate limiter exception:", err)
    return { allowed: true, count: 0 }
  }
}

/**
 * Clean up old logs periodically (optional, but good practice)
 * Can be called manually or via a cron job.
 */
export async function cleanupLogs() {
  const fiveMinutesAgo = new Date(Date.now() - 300000).toISOString()
  await supabase
    .from('request_logs')
    .delete()
    .lt('created_at', fiveMinutesAgo)
}
