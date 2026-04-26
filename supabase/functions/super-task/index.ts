
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { checkRateLimit } from "../_shared/rateLimiter.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // 1. Check Rate Limit (Global)
  const { allowed, count } = await checkRateLimit()
  if (!allowed) {
    console.warn(`Rate limit exceeded: ${count} requests in the last minute.`)
    return new Response(
      JSON.stringify({ 
        error: "Rate limit exceeded. The system is limited to 20 requests per minute to ensure stability. Please try again in a moment.",
        reply: "Too many requests. Please wait a minute before trying again."
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
    )
  }

  try {
    const { userMessage, history, lang, apiKey: bodyApiKey } = await req.json()
    const apiKey = bodyApiKey || Deno.env.get("GEMINI_API_KEY")
    
    const isRw = lang?.startsWith('rw')
    const languageName = isRw ? 'Kinyarwanda' : 'English'

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found in environment or request body")
    }

    // Format history for Gemini API
    const formattedHistory = (history || []).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }))

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 40000)

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            ...(formattedHistory.slice(-6)),
            { role: 'user', parts: [{ text: userMessage }] }
          ],
          systemInstruction: {
            parts: [{ text: `You are Humura AI v3, a next-gen mental health companion for the people of Rwanda. 
            STRICT RULE: You MUST respond ONLY in ${languageName}. 
            Do NOT mix languages. Do NOT provide translations in parentheses. 
            If the user speaks a different language, gently steer back to ${languageName}.
            You possess deep emotional intelligence and cultural awareness. 
            Always lead with empathy and validation. 
            For any sign of crisis, gently provide the Rwanda 114 hotline.` }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          }
        })
      })

      clearTimeout(timeoutId)

      const data = await response.json()
      
      if (!response.ok) {
        console.error("Gemini API Error:", data)
        const isQuotaError = response.status === 429 || data.error?.message?.toLowerCase().includes('quota')
        
        if (isQuotaError) {
          return new Response(
            JSON.stringify({ 
              reply: isRw 
                ? "Gerageza nyuma gato cyangwa niba ukeneye ubufasha bwihutirwa hamagara 114 (Rwanda Biomedical Centres)" 
                : "Try again later or if you want immediate support call 114 (Rwanda Biomedical Centres)" 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
        throw new Error(data.error?.message || "Failed to fetch from Gemini API")
      }

      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here to listen. Could you tell me more?"

      return new Response(
        JSON.stringify({ reply }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        throw new Error("AI response timed out. Please try a shorter message.")
      }
      throw fetchError
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
