
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
    const { imageBase64, mimeType, prompt, apiKey: bodyApiKey } = await req.json()
    const apiKey = bodyApiKey || Deno.env.get("GEMINI_API_KEY")

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found in environment or request body")
    }

    // Call Gemini 3 Flash Preview (Multimodal)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 40000)

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } }
            ]
          }],
          generationConfig: {
            temperature: 0.4,
            topP: 0.8,
            topK: 40,
          }
        })
      })

      clearTimeout(timeoutId)

      const data = await response.json()
      
      if (!response.ok) {
        console.error("Gemini Vision Error:", data)
        throw new Error(data.error?.message || "Failed to analyze image with Gemini Vision")
      }

      let reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis generated."
      
      // Robust JSON extraction: Find the first '{' and last '}' to strip away markdown if the AI includes it
      try {
        const firstBrace = reply.indexOf('{');
        const lastBrace = reply.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          reply = reply.substring(firstBrace, lastBrace + 1);
        }
      } catch (e) {
        console.warn("JSON extraction failed, returning raw string.");
      }

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
        throw new Error("Vision analysis timed out. Please try again.")
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
