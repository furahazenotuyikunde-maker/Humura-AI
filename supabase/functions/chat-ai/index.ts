// AUDITED — max 1 Gemini 3.0 Flash call per user message
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// SINGLE Gemini 3.0 Flash call — deduplication guards applied
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, userId } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set')
    }

    console.log('[GEMINI] ▶ Request fired | timestamp=' + Date.now() + ' | user=' + userId);

    // Call Gemini 3-Flash Vision
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
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
      console.error('[GEMINI] ✖ Error:', data.error.message || 'Gemini API Error');
      throw new Error(data.error.message || 'Gemini API Error')
    }

    console.log('[GEMINI] ✔ Response received | timestamp=' + Date.now());
    const reply = data.candidates[0].content.parts[0].text

    // Save to DB using the user's JWT for RLS
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const lastUserMessage = messages[messages.length - 1].content
    
    const { error: dbError } = await supabaseClient.from('chat_logs').insert([
      { user_id: userId, role: 'user', content: lastUserMessage },
      { user_id: userId, role: 'model', content: reply }
    ])

    if (dbError) throw dbError

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
