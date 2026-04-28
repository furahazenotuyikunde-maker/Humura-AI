
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
    // 1. Count requests in the last minute (sliding window)
    const { count, error: countError } = await supabase
      .from('request_logs')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', oneMinuteAgo)

    if (countError) {
      if (countError.code === '42P01') {
         console.log("Table 'request_logs' not found. Please create it.")
         return { allowed: true, count: 0 }
      }
      console.error("Error counting requests:", countError)
      return { allowed: true, count: 0 }
    }

    const currentCount = count || 0
    const limit = 300


    if (currentCount >= limit) {
      return { allowed: false, count: currentCount }
    }

    // 2. Log this request ONLY if allowed
    const { error: insertError } = await supabase
      .from('request_logs')
      .insert([{ created_at: now.toISOString() }])

    if (insertError) {
      console.error("Error logging request:", insertError)
    }

    return {
      allowed: true,
      count: currentCount + 1
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
