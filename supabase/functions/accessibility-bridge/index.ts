import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { text, targetLang } = await req.json()
    const apiKey = Deno.env.get("GEMINI_API_KEY")

    if (!apiKey) throw new Error("GEMINI_API_KEY not found")

    const prompt = `
      You are an Accessibility Expert for Humura AI.
      INPUT TEXT: "${text}"
      TARGET LANGUAGE: ${targetLang === 'rw' ? 'Kinyarwanda' : 'English'}

      TASK:
      1. Translate the text if necessary.
      2. Simplify the text into "Plain Language" (easy to understand for everyone).
      3. Extract "Sign Language Concepts" (key nouns and verbs in sequence for a sign language user).
      4. Convert the simplified text into Unicode Braille patterns.

      Respond EXCLUSIVELY in JSON:
      {
        "simplified_text": "string",
        "sign_concepts": ["concept1", "concept2"],
        "braille_unicode": "string using unicode braille chars (U+2800 to U+28FF)",
        "tone_summary": "one word describing the emotional tone"
      }
    `

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 }
        })
      }
    )

    const data = await response.json()
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
    const cleanJson = resultText.replace(/```json|```/g, '').trim()
    const result = JSON.parse(cleanJson)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
