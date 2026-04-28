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

// 3. Initialize Gemini 3 Flash
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
  try {
    const { message, history, lang } = req.body;
    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }
    const chatHistory = (history || []).map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    const result = await model.generateContent([
      ...chatHistory,
      { role: "user", parts: [{ text: message }] }
    ]);
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
app.get('/', (req, res) => res.json({ message: 'Humura AI Backend is Live!', version: "1.0.4" }));

// 8. Catch-all 404 Route (JSON)
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

app.listen(port, () => console.log(`🚀 Humura AI Backend running on port ${port}`));
