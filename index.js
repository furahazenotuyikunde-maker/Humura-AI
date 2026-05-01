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
app.use(express.json()); // Body parser MUST be before routes

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

// 5. AI Chat Endpoint
app.get('/chat', (req, res) => {
  res.json({ status: "Chat endpoint is live. Use POST to send messages.", version: "1.0.4" });
});

app.post('/chat', async (req, res) => {
  console.log(`[DEBUG] Incoming POST /chat from ${req.headers.origin}`);
  try {
    const { message, history, lang } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "No message provided or invalid format" });
    }
    const chatHistory = (history || []).map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    const result = await model.generateContent({
      contents: [
        ...chatHistory,
        { role: "user", parts: [{ text: message }] }
      ]
    });
    const response = await result.response;
    return res.status(200).json({ success: true, reply: response.text() });
  } catch (error) {
    console.error("[CHAT ERROR]", error);
    return res.status(500).json({ error: error.message || "Chat failed" });
  }
});

// 6. Progress Tracker Endpoint
app.post('/analyze-progress', async (req, res) => {
  try {
    const { moods, lang } = req.body;
    if (!moods || moods.length === 0) {
      return res.status(400).json({ error: "No mood data provided" });
    }

    // High-performance bilingual prompt for Gemini 3
    const prompt = `
      Analyze this 7-day mood history: ${JSON.stringify(moods)}
      
      Task: Provide a "Weekly Wellness Recommendation".
      Requirement: The response MUST be bilingual (English and Kinyarwanda combined).
      Example format: "Summary: You are doing well. / Incamake: Umeze neza."
      
      Format: Return ONLY a JSON object:
      {
        "summary": "Bilingual summary here...",
        "recommendations": [
          "Bilingual tip 1...",
          "Bilingual tip 2...",
          "Bilingual tip 3..."
        ]
      }
    `;

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (modelError) {
      console.warn("Primary model failed, falling back to gemini-1.5-flash");
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      result = await fallbackModel.generateContent(prompt);
    }

    const response = await result.response;
    const rawText = response.text();
    
    // Deep-Clean: Extract only the JSON block even if AI adds extra text
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No valid JSON found in AI response");
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return res.status(200).json({ success: true, ...parsed });
  } catch (error) {
    console.error("[PROGRESS ERROR]", error);
    return res.status(500).json({ 
      success: false, 
      summary: "Incamake ntibashije kuboneka / Summary unavailable.",
      recommendations: ["Komeza wandika uko wiyumva / Keep logging your mood."]
    });
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
