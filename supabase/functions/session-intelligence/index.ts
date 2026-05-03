import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { history, lang } = await req.json()
    const apiKey = Deno.env.get("GEMINI_API_KEY")
    const isRw = lang?.startsWith('rw')

    if (!apiKey) throw new Error("GEMINI_API_KEY not found")

    const chatContent = (history || []).map((m: any) => `${m.role}: ${m.content}`).join('\n')

    const prompt = `
      You are a Clinical Intelligence Agent for Humura AI.
      Analyze the following chat history between a patient and an AI companion:
      
      HISTORY:
      ${chatContent}

      TASK:
      Provide a structured clinical summary for a mental health professional.
      Language: ${isRw ? 'Kinyarwanda' : 'English'}.

      Output EXCLUSIVELY as JSON:
      {
        "primary_concerns": ["concise concern 1", "concise concern 2"],
        "emotional_state": "one word summary (e.g. Anxious, Improving)",
        "clinical_flags": ["any signs of self-harm, trauma, or severe depression"],
        "suggested_focus": "The specific topic the doctor should focus on in the next session",
        "patient_sentiment_score": number (1-10)
      }
    `

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 }
        })
      }
    )

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
    const cleanJson = text.replace(/```json|```/g, '').trim()
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
