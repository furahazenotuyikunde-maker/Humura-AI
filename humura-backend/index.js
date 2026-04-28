// Humura AI - Production Backend (Render Web Service)
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();
const app = express();
const port = process.env.PORT || 3001;

// 1. Setup Middleware
app.use(cors({ origin: "*" })); // Allow all origins for simplicity in dev
app.use(express.json());

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
    return res.status(500).json({ error: error.message });
  }
});

// 5. AI Chat Endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message, history, lang } = req.body;
    const isRw = lang?.startsWith('rw');

    if (!message) return res.status(400).json({ error: "Message is required" });

    // Format history for Gemini
    const contents = (history || []).map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Add current message
    contents.push({ role: 'user', parts: [{ text: message }] });

    const chatResult = await model.generateContent({
      contents,
      systemInstruction: {
        parts: [{
          text: `You are Humura AI, a compassionate mental health assistant in Rwanda. Support the user in ${isRw ? 'Kinyarwanda' : 'English'}. Be warm and empathetic.`
        }]
      }
    });

    const chatResponse = await chatResult.response;
    return res.status(200).json({ success: true, reply: chatResponse.text() });
  } catch (error) {
    console.error("[CHAT ERROR]", error);
    return res.status(500).json({ error: error.message });
  }
});

// 6. Progress Tracker Endpoint
app.post('/analyze-progress', async (req, res) => {
  try {
    const { moods, lang } = req.body;
    const isRw = lang?.startsWith('rw');

    if (!moods || !Array.isArray(moods)) {
      return res.status(400).json({ error: "Mood data is required" });
    }

    const moodSummary = moods.map(m => `${m.date}: ${m.mood}`).join(', ');

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `Analyze these moods: [${moodSummary}]. Respond in ${isRw ? 'Kinyarwanda' : 'English'} in JSON:
          { "summary": "2-sentence warm overview", "recommendations": ["tip 1", "tip 2", "tip 3"] }`
        }]
      }]
    });

    const response = await result.response;
    const aiText = response.text().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(aiText);

    return res.status(200).json({ 
      success: true, 
      summary: parsed.summary, 
      recommendations: parsed.recommendations 
    });
  } catch (error) {
    console.error("[PROGRESS ERROR]", error);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => res.send('Humura AI Backend is Live!'));
app.listen(port, () => console.log(`Backend running on port ${port}`));
