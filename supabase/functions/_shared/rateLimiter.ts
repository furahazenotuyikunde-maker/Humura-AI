import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  resetTime?: string;
  plan: string;
}

/**
 * Checks if a user has exceeded their hourly message limit.
 * Free: 20/hr, Paid: 500/hr
 */
export async function checkUserRateLimit(userId: string, endpoint: string = 'chat'): Promise<RateLimitResult> {
  if (!userId) return { allowed: true, count: 0, limit: 20, plan: 'guest' };

  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()

  try {
    // 1. Get User Plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', userId)
      .maybeSingle()

    const plan = profile?.plan_type || 'free'
    const limit = plan === 'pro' ? 500 : 20

    // 2. Count user messages in the last hour from chat_logs
    const { count, error: countError } = await supabase
      .from('chat_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('role', 'user')
      .gt('created_at', oneHourAgo)

    if (countError) throw countError

    const currentCount = count || 0
    const allowed = currentCount < limit

    // 3. Log the attempt to rate_limit_logs
    await supabase.from('rate_limit_logs').insert([{ user_id: userId, endpoint }])

    return {
      allowed,
      count: currentCount,
      limit,
      plan
    }
  } catch (err) {
    console.error('[RateLimiter] Error checking limit:', err.message)
    return { allowed: true, count: 0, limit: 20, plan: 'unknown' }
  }
}
