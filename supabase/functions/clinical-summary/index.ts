import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing in Supabase Secrets.')

    let body: any = {}
    try {
      body = await req.json()
    } catch (e) {
      console.log('No JSON body provided, using defaults.')
    }

    const patientName = body.patientName || "Valued Patient"
    const moodHistory = body.moodHistory || []
    const journalSnippet = body.journalSnippet || "No recent journal entries provided."
    const phq9 = body.phq9 || "N/A"
    const gad7 = body.gad7 || "N/A"

    const prompt = `
      You are a Clinical AI Assistant for mental health professionals in Rwanda. 
      Generate a professional SOAP note for the following patient:
      
      Patient: ${patientName}
      PHQ-9 Score: ${phq9}/27
      GAD-7 Score: ${gad7}/21
      Recent Moods: ${JSON.stringify(moodHistory)}
      Recent Journal Context: "${journalSnippet}"

      Format the response as a structured SOAP note:
      S (Subjective): Patient's self-reported feelings and journal themes.
      O (Objective): Observations based on mood scores and trends.
      A (Assessment): Clinical impression of current state.
      P (Plan): 3 specific clinical recommendations for the next session.

      Language: Professional English. Keep it concise and clinical.
    `

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 600 }
        }),
      }
    )

    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Gemini API Error')
    
    const report = data.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to generate report."

    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Function Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
