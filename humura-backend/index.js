// Humura AI - Production Backend (Render Web Service) - v1.0.4
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require("@google/generative-ai");
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// 1. Setup Middleware
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '10mb' })); // Increased limit for image base64 data
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 2. Setup Multer (for Image Analysis)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// 3. Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// 4. Image Analysis Endpoint (Multipart)
app.post('/analyze-sign', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image received" });
    const { prompt } = req.body;
    const imagePart = { inlineData: { data: req.file.buffer.toString("base64"), mimeType: req.file.mimetype } };
    const result = await model.generateContent([prompt || "Analyze this image.", imagePart]);
    const response = await result.response;
    return res.status(200).json({ success: true, reply: response.text() });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Image analysis failed" });
  }
});

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase (Service Role for internal limit checks)
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// 5. AI Chat Endpoint
app.get('/chat', (req, res) => {
  res.json({ status: "Chat endpoint is live. Use POST to send messages.", version: "1.0.4" });
});

app.post('/chat', async (req, res) => {
  try {
    const { message, history, image, userId } = req.body;

    // 1. Rate Limit Check (Hourly)
    if (userId) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      // Get Plan
      const { data: profile } = await supabase.from('profiles').select('plan_type').eq('id', userId).maybeSingle();
      const plan = profile?.plan_type || 'free';
      const limit = plan === 'pro' ? 500 : 20;

      // Count
      const { count, error: countError } = await supabase
        .from('chat_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('role', 'user')
        .gt('created_at', oneHourAgo);

      if (!countError && count >= limit) {
        return res.status(429).json({ 
          error: "quota_exceeded", 
          message: `You've reached your hourly limit of ${limit} messages.` 
        });
      }
    }
    
    // Map history exactly as v1.0.4
    const chatHistory = (history || []).map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(m.content || "") }]
    }));

    // 2. Prepare current parts
    let parts = [{ text: String(message || "") }];
    if (image && image.data && image.mimeType) {
      parts.push({
        inlineData: { data: image.data, mimeType: image.mimeType }
      });
    }

    const persona = `You are Humura AI, a warm, empathetic mental health support companion. Always validate emotions before advice. Keep responses concise (2-4 sentences). Never diagnose. If in crisis, tell them to call 114 (Rwanda's crisis line) immediately. Be non-judgmental.`;

    // 3. Call Model with Persona
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: persona }] },
        { role: "model", parts: [{ text: "Understood. I am Humura AI, here to support you with empathy and care." }] },
        ...chatHistory,
        { role: "user", parts }
      ]
    });

    const response = await result.response;
    return res.status(200).json({ success: true, reply: response.text() });
  } catch (error) {
    console.error("[GEMINI ERROR]", error);
    const errorMessage = error.response?.data?.error?.message || error.message || "Internal Server Error";
    return res.status(500).json({ error: errorMessage });
  }
});

// 6. Progress Tracker Endpoint
app.post('/analyze-progress', async (req, res) => {
  try {
    const { moods, lang } = req.body;
    if (!moods || moods.length === 0) {
      return res.status(400).json({ error: "No mood data provided" });
    }
    const prompt = `Analyze this week's mood data and return a JSON object with "summary" (string) and "recommendations" (array of 3 strings). Mood data: ${JSON.stringify(moods)}. Language: ${lang || 'en'}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);
    return res.status(200).json({ success: true, ...parsed });
  } catch (error) {
    console.error("[PROGRESS ERROR]", error);
    return res.status(500).json({ error: error.message || "Progress analysis failed" });
  }
});

// 7. Health Check
app.get('/', (req, res) => res.json({ 
  message: 'Humura AI Backend is Live!', 
  version: "1.0.5",
  endpoints: ["GET /", "GET /chat", "POST /chat", "POST /analyze-sign", "POST /analyze-progress"]
}));

// 8. Catch-all 404 Route (JSON)
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

app.listen(port, () => console.log(`🚀 Humura AI Backend running on port ${port}`));
