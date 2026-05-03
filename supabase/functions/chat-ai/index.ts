import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function checkUserRateLimit(supabase: any, userId: string) {
  if (!userId) return { allowed: true, count: 0, limit: 20 };

  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', userId)
      .maybeSingle()

    const plan = profile?.plan_type || 'free'
    const limit = plan === 'pro' ? 500 : 20

    const { count, error: countError } = await supabase
      .from('chat_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('role', 'user')
      .gt('created_at', oneHourAgo)

    if (countError) throw countError

    const currentCount = count || 0
    return { allowed: currentCount < limit, count: currentCount, limit };
  } catch (err) {
    console.error('[RateLimit Error]', err);
    return { allowed: true, count: 0, limit: 20 };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { messages, userId } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

    // 1. Check User Quota
    const { allowed, count, limit } = await checkUserRateLimit(supabase, userId)
    if (!allowed) {
      return new Response(JSON.stringify({ 
        error: "user_quota_exceeded", 
        message: `User limit reached: ${count}/${limit}`,
        limit 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429,
      })
    }

    // 2. Call Gemini
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          })),
        }),
      }
    )

    const data = await geminiResponse.json()
    if (data.error) {
      // If it's a Gemini limit, return 429 but NOT user_quota_exceeded
      return new Response(JSON.stringify({ error: "provider_limit", message: data.error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429,
      })
    }

    const reply = data.candidates[0].content.parts[0].text

    // 3. Log successful message
    await supabase.from('chat_logs').insert([
      { user_id: userId, role: 'user', content: messages[messages.length - 1].content },
      { user_id: userId, role: 'model', content: reply }
    ])

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "server_error", message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
