
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userMessage, history, apiKey: bodyApiKey } = await req.json()
    const apiKey = bodyApiKey || Deno.env.get("GEMINI_API_KEY")

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
            parts: [{ text: "You are Humura AI v3, a next-gen mental health companion for the people of Rwanda. You possess deep emotional intelligence and cultural awareness. When responding to sign language or text, always lead with empathy and validation. Use the power of Gemini 3 to see the person behind the symptoms. For any sign of crisis, gently provide the Rwanda 114 hotline." }]
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
