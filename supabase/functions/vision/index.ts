// AUDITED — Multipart Vision Function (Production Safe)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Parse Multipart Form Data
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const prompt = formData.get('prompt') as string;
    const lang = formData.get('lang') as string;
    const bodyApiKey = formData.get('apiKey') as string;

    const apiKey = bodyApiKey || Deno.env.get("GEMINI_API_KEY");
    const isRw = lang?.startsWith('rw');

    if (!apiKey) throw new Error("GEMINI_API_KEY not found.");
    if (!imageFile) {
      return new Response(JSON.stringify({ error: "No image data provided. Ensure your camera is active." }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      });
    }

    // 2. Convert File to Base64 for Gemini
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // 3. Call Gemini 3 Flash Preview
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`

    console.log('[GEMINI] ▶ Multipart Request Fired | size=' + arrayBuffer.byteLength);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt || "Analyze this image." },
            { inline_data: { mime_type: imageFile.type || 'image/jpeg', data: base64Data } }
          ]
        }]
      })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || "Google API Error");

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis generated."

    return new Response(JSON.stringify({ reply }), {
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
