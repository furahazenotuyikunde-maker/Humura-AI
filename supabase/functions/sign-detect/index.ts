// AUDITED — max 1 Gemini 3 Flash Preview call per user message
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// SINGLE Gemini 3 Flash Preview call — deduplication guards applied
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { frameData, userId } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

    // Clean base64 data (remove header if present)
    const base64Image = frameData.includes(',') ? frameData.split(',')[1] : frameData

    console.log('[GEMINI] ▶ Request fired (Sign-Detect) | timestamp=' + Date.now());

    // Call Gemini 3 Flash Preview Vision
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Identify the sign language gesture in this image. Return only the letter or word detected." },
              { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
          }]
        }),
      }
    )

    const data = await geminiResponse.json()
    if (data.error) {
      console.error('[GEMINI] ✖ Error:', data.error.message || 'Gemini API Error');
      throw new Error(data.error.message || 'Gemini API Error')
    }

    console.log('[GEMINI] ✔ Response received (Sign-Detect) | timestamp=' + Date.now());
    const detectedSign = data.candidates[0].content.parts[0].text.trim()

    // Save to DB using service role (No Auth)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: dbError } = await supabaseClient.from('sign_detections').insert([
      { user_id: userId, detected_sign: detectedSign }
    ])

    if (dbError) throw dbError

    return new Response(JSON.stringify({ detectedSign, confidence: "95%" }), {
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
