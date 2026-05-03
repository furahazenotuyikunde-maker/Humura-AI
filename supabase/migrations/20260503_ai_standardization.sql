-- Migration 20260503_ai_standardization: Update AI Bridge and Create Insights Archive

-- 1. Update the AI Bridge to use Gemini 2.5 Flash Preview
CREATE OR REPLACE FUNCTION public.fn_ai_accessibility_bridge(
  p_text TEXT, 
  p_lang TEXT DEFAULT 'en'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_api_key TEXT := 'YOUR_GEMINI_API_KEY_HERE'; 
  v_response http_response;
  v_payload JSONB;
  v_result JSONB;
  v_prompt TEXT;
BEGIN
  v_prompt := 'You are an Accessibility Expert for Humura AI. ' ||
              'INPUT TEXT: "' || p_text || '" ' ||
              'TARGET LANGUAGE: ' || CASE WHEN p_lang = 'rw' THEN 'Kinyarwanda' ELSE 'English' END || ' ' ||
              'TASK: 1. Translate if needed. 2. Simplify to Plain Language. 3. Extract Sign Language Concepts. 4. Convert to Unicode Braille. ' ||
              'Respond ONLY with a JSON object: {"simplified_text": "...", "sign_concepts": [...], "braille_unicode": "...", "tone": "..."}';

  SELECT * INTO v_response FROM http_post(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview:generateContent?key=' || v_api_key,
    jsonb_build_object(
      'contents', jsonb_build_array(
        jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_prompt)))
      )
    )::TEXT,
    'application/json'
  );

  v_payload := v_response.content::JSONB;
  v_result := (v_payload->'candidates'->0->'content'->'parts'->0->>'text')::JSONB;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- 2. Create AI Insights Archive table
CREATE TABLE IF NOT EXISTS public.ai_insights_archive (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL, -- e.g., 'progress', 'clinical', 'accessibility'
    summary TEXT,
    recommendations JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS and add policies
ALTER TABLE public.ai_insights_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights" ON public.ai_insights_archive 
    FOR SELECT USING (auth.uid() = user_id);

-- 4. Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_type ON public.ai_insights_archive (user_id, insight_type);
