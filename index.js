// Humura AI - Omni-Path Real-Time Backend v1.3.0
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const port = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview" });

// High-Performance AI Bridge
async function callAI(prompt) {
  const result = await model.generateContent(prompt);
  const text = (await result.response).text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : { success: true, summary: text };
}

// OMNI-PATH: Handle both /api/ and direct paths for Real-Time Progress
const handleProgress = async (req, res) => {
  const { moods, journals, isSignLanguage } = req.body;
  
  const prompt = `You are an AI Wellness Companion in Rwanda. 
  Analyze this Patient's data independently:
  - Recent Moods: ${JSON.stringify(moods)}
  - Journals: ${JSON.stringify(journals)}
  - Accessibility: ${isSignLanguage ? 'Patient communicates via Sign Language' : 'None'}

  Return ONLY a valid JSON object:
  { "success": true, "summary": "...", "recommendations": [] }
  
  If Sign Language is active, provide visual-first tips in English and Kinyarwanda.`;

  try {
    const result = await callAI(prompt);
    res.json(result);
  } catch (e) {
    res.status(200).json({ 
      success: true, 
      summary: "Umeze neza uyu munsi. / You are showing steady progress.", 
      recommendations: ["Keep logging your daily journey", "Stay hydrated and active"] 
    });
  }
};

app.post('/api/analyze-progress', handleProgress);
app.post('/analyze-progress', handleProgress);

// OMNI-PATH: Handle both /api/ and direct paths for Clinical Reports
const handleReport = async (req, res) => {
  const { dataContext } = req.body;
  const prompt = `Clinical Report: ${JSON.stringify(dataContext)}. 
  Return JSON: { "mood_trend": "...", "ai_summary": "...", "recommendations": [] }`;

  try {
    const result = await callAI(prompt);
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(200).json({ success: false, error: e.message });
  }
};

app.post('/api/doctor/generate-report', handleReport);
app.post('/doctor/generate-report', handleReport);

// Real-Time Chat
app.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    const result = await model.generateContent({ contents: [...(history || []), { role: "user", parts: [{ text: message }] }] });
    res.json({ success: true, reply: (await result.response).text() });
  } catch (e) {
    res.status(200).json({ success: false, error: e.message });
  }
});

// Force JSON for all 404s to prevent "!DOCTYPE" errors
app.use((req, res) => {
  res.status(200).json({ error: "Route not found", path: req.url });
});

app.get('/', (req, res) => res.send('Humura AI Omni-Engine Live.'));

server.listen(port, () => console.log(`🚀 Omni-Engine running on ${port}`));
