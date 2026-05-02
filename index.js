// Humura AI - Real-Time Clinical Backend v1.2.0
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
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// Direct Real-Time AI Call
async function callAI(prompt) {
  const result = await model.generateContent(prompt);
  return (await result.response).text();
}

// 1. Real-Time Progress Analysis
app.post('/api/analyze-progress', async (req, res) => {
  const { moods, journals, isSignLanguage } = req.body;
  const prompt = `Analyze this mood data instantly: ${JSON.stringify(moods)}. Journals: ${JSON.stringify(journals)}.
  ${isSignLanguage ? 'CRITICAL: User uses Sign Language. Provide visual/video-first tips.' : ''}
  Return JSON: { "summary": "...", "recommendations": [] }`;

  try {
    const response = await callAI(prompt);
    res.json(JSON.parse(response.match(/\{[\s\S]*\}/)[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2. Real-Time Clinical Report
app.post('/api/doctor/generate-report', async (req, res) => {
  const { dataContext } = req.body;
  const prompt = `Clinical AI: Generate a real-time progress report for this data: ${JSON.stringify(dataContext)}.
  Return JSON: { "mood_trend": "...", "ai_summary": "...", "recommendations": [] }`;

  try {
    const response = await callAI(prompt);
    res.json(JSON.parse(response.match(/\{[\s\S]*\}/)[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3. Real-Time Chat
app.post('/chat', async (req, res) => {
  const { message, history } = req.body;
  try {
    const result = await model.generateContent({ contents: [...(history || []), { role: "user", parts: [{ text: message }] }] });
    res.json({ reply: (await result.response).text() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => res.send('Humura AI Real-Time Engine Live.'));

server.listen(port, () => console.log(`🚀 Real-Time Engine on ${port}`));
