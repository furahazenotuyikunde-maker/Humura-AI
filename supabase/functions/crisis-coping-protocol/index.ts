import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { riskType, currentEnvironment, lang } = await req.json()
    const apiKey = Deno.env.get("GEMINI_API_KEY")
    const isRw = lang?.startsWith('rw')

    if (!apiKey) throw new Error("GEMINI_API_KEY not found")

    const prompt = `
      You are an Emergency Crisis Response Agent for Humura AI in Rwanda.
      A patient is experiencing a high-risk moment: "${riskType}".
      Environment context: "${currentEnvironment || 'Unknown'}".

      TASK:
      Generate a 3-step "Immediate Safety Protocol" that is actionable, grounded, and culturally appropriate.
      Include a grounding exercise (e.g. 5-4-3-2-1 technique or breathing).
      
      Language: ${isRw ? 'Kinyarwanda' : 'English'}.

      Output EXCLUSIVELY as JSON:
      {
        "immediate_action": "The very first thing they should do right now",
        "grounding_exercise": "A step-by-step grounding technique",
        "support_reminder": "Empathy-filled reminder about the 114 hotline",
        "visual_cue": "A short description of a calming mental image"
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
