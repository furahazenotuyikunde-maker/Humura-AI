
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
    const { userMessage, history } = await req.json()
    const apiKey = Deno.env.get("GEMINI_API_KEY")

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found in environment")
    }

    // Format history for Gemini API
    // Gemini 1.5/2.x history format: [{ role: 'user' | 'model', parts: [{ text: string }] }]
    const formattedHistory = (history || []).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }))

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          ...formattedHistory,
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        systemInstruction: {
          parts: [{ text: "You are Humura AI, a compassionate mental health support assistant for people in Rwanda. Respond in the same language as the user (English or Kinyarwanda). Validate feelings first, then provide gentle, evidence-based support. Keep responses warm and clear. For crisis signals, provide Rwanda hotline 114." }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      })
    })

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
