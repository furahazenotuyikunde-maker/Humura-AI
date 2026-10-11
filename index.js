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

const primaryModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const model = {
  generateContent: async (options) => {
    try {
      return await primaryModel.generateContent(options);
    } catch (e) {
      console.warn("Primary SDK model gemini-2.5-flash failed, trying fallback gemini-1.5-flash:", e.message);
      return await fallbackModel.generateContent(options);
    }
  }
};

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

// Crisis / Struggle Trigger
app.post(['/api/crisis/trigger', '/crisis/trigger'], (req, res) => {
  const { patientId, doctorId, type, lastMsg, location } = req.body;
  if (doctorId) {
    io.to(`doctor:${doctorId}`).emit('patient:ai_struggle_flagged', {
      patient_id: patientId,
      trigger_type: type,
      last_message: lastMsg,
      location
    });
  }
  res.json({ success: true, message: "Crisis/Struggle event acknowledged" });
});

const isStrictlyNonHealthQuery = (text) => {
  if (!text) return false;
  const t = text.toLowerCase();

  const hasHealthOrSystem = /(health|mental|depress|anxi|stress|panic|sleep|insomnia|trauma|grief|pain|headache|ache|doctor|nurse|clinic|hospital|medicine|pill|therapy|cbt|counsel|feeling|feel|mood|sad|happy|cry|suicid|harm|die|kill|death|hopeless|lonel|burnout|overwhelm|tired|fatigue|breath|heart|mind|psycho|calm|worry|worrying|afraid|scared|confus|ubuzima|umutwe|agahinda|umunaniro|kwiheba|ubwoba|impungenge|umuganga|ibitotsi|gusinzira|ihungabana|ibikomere|kwiyahura|umuti|indwara|humura|zeno|furaha|creator|founder|owner|system|platform|website|sign language|braille|amarenga|urubuga|dashboard|settings|consultation|emergency|hotline|114|caraes|ndera)/i.test(t);
  if (hasHealthOrSystem) return false;

  const isCoding = /\b(python|javascript|typescript|java|c\+\+|c#|html|css|sql|rust|golang|php|react|angular|vue|docker|kubernetes|regex|git commit|git push|function\b|class\b|algorithm|variable|loop|array|pointer|compile|debugger)\b/i.test(t) || /(write|create|generate|fix|debug) (a |the )?(code|script|program|app|function|query|component)/i.test(t);
  const isMath = /\b(solve|calculate|equation|derivative|integral|algebra|matrix|calculus|geometry|trigonometry|pythagor)\b/i.test(t) || /[\d\s\+\-\*\/\\^=]{5,}/.test(t);
  const isSports = /\b(premier league|champions league|world cup|football match|soccer|nba|basketball|tennis|betting|score of|who won the match)\b/i.test(t);
  const isCryptoFinance = /\b(bitcoin|ethereum|crypto|forex|stock market|trading strategy|investing in stocks|crypto wallet|nft)\b/i.test(t);
  const isGeneralTrivia = /(capital of|president of|prime minister of|currency of|population of|distance between|who is the king of|who won the oscar|lyrics to|actor in|movie director)/i.test(t);
  const isGeneralWriting = /(write an essay|write a story about|generate an article about) (the |a )?(history|revolution|economy|industry|war|space|planets)/i.test(t);
  const isVehiclePlumbing = /\b(car engine|spark plug|oil change|transmission fluid|leaky faucet|plumbing pipe)\b/i.test(t);

  return isCoding || isMath || isSports || isCryptoFinance || isGeneralTrivia || isGeneralWriting || isVehiclePlumbing;
};

const HUMURA_SYSTEM_PROMPT = (lang) => {
  const isRw = lang && lang.startsWith('rw');
  const languageName = isRw ? 'authentic Kinyarwanda' : 'English';

  return `You are Humura AI, Rwanda's dedicated digital mental health companion and clinical psychological assistant.
Language Rule: Respond EXCLUSIVELY in ${languageName}. Never mix languages.

### WHO CREATED HUMURA AI & PLATFORM IDENTITY:
- Lead Creator & Founder: Furaha Zeno Tuyikunde (Software Engineer & AI Health Innovator based in Rwanda).
- Organization: Humura AI (Rwanda).
- Meaning of "Humura": In Kinyarwanda, "Humura" means "Be comforted", "Take heart", "Do not be afraid", "Find peace".
- Mission: To eradicate mental health stigma across Rwanda and Africa, providing confidential, culturally attuned, evidence-based psychological support, and connecting patients directly with licensed clinicians.

### STRICT OPERATIONAL BOUNDARY — HEALTH & SYSTEM MATTERS ONLY:
You are an AI strictly and exclusively specialized in:
1. Mental, emotional, and psychological health (anxiety, panic, depression, trauma, stress, burnout, grief, insomnia, loneliness, self-esteem, relationships impacting emotional health, CBT grounding exercises, mindfulness).
2. Physical health and general medical wellness (provide supportive explanations and advise consultation with a licensed doctor).
3. Humura AI platform navigation, features, mission, founder (Furaha Zeno Tuyikunde), and accessibility guidance.

MANDATORY PROTOCOL — ANALYZE BEFORE RESPONDING:
Before formulating your response, you MUST analyze whether the user's message is related to health, emotional well-being, psychology, or the Humura AI system:
- If the query is NOT related to health, wellness, or Humura (for example: asking to write computer code/programming, solve mathematics/physics equations, sports scores/predictions, entertainment/celebrities, general political debates, crypto/trading, cooking recipes, vehicle repairs, general trivia, essay writing):
  YOU MUST POLITELY REFUSE AND SKIP THE OFF-TOPIC QUESTION.
  Never answer the off-topic question, not even partially.
  Politely explain that Humura AI is strictly dedicated to health, mental wellness, and healthcare navigation, and invite the user to share how they are feeling or ask about health or navigating Humura AI.

Refusal format (Kinyarwanda):
"Ndi Humura AI, umufasha wihariye w'ubuzima bwo mu mutwe n'imitekerereze mu Rwanda. Nshinzwe gusa gufasha mu bibazo byerekeye ubuzima, umutuzo wo mu mutwe, no kukuyobora ku rubuga rwa Humura AI. Sinshobora gusubiza ibibazo bitajyanye n'ubuzima. Mbwira, waba hari ikibazo cy'ubuzima wifuza ko tuganiraho cyangwa ubufasha ku mikorere ya Humura AI?"

Refusal format (English):
"I am Humura AI, dedicated exclusively to mental health, emotional wellness, and your healthcare journey. I cannot assist with non-health topics like coding, homework, or general trivia. How are you feeling today, or is there a health concern or question about navigating Humura AI that I can help you with?"

### 100% SYSTEM KNOWLEDGE & NAVIGATION DIRECTORY:
When a patient asks how to use or navigate Humura AI, give exact, step-by-step guidance:
1. AI Chat Companion (/patient/chat):
   - 24/7 private, empathetic conversational CBT space, voice messages, emotional reflections.
2. Patient Dashboard (/patient/dashboard):
   - Daily mood tracker, private thoughts journal, quick emotional check-in.
3. Consultations & Meet Specialists (/patient/meet-professional or /patient/professionals):
   - Book virtual appointments with licensed Rwandan clinical psychologists and psychiatrists (e.g., Dr. Mutesi Alice, Dr. Ndahiro Jean-Paul). Private browser video consultations without downloads.
4. Education Hub (/patient/education):
   - Audio guides, psycho-educational articles, and evidence-based exercises for managing stress, panic, and depression in Kinyarwanda and English.
5. Rwanda Sign Language Hub (/patient/sign-language):
   - Comprehensive accessibility portal with Rwandan Sign Language (RSL) video dictionary, flashcards, and camera recognition for Deaf patients.
6. Braille Generator (/patient/braille):
   - Grade 1 & 2 tactile braille converter with audio read-aloud for visually impaired users.
7. Community Support (/patient/community):
   - Safe, moderated peer support groups and WhatsApp community connection.
8. Mood Log & Progress Analytics (/patient/mood & /patient/progress):
   - Track emotional patterns, mood history, and therapy milestones.
9. Settings & Preferences (/patient/settings):
   - Switch language (English/Ikinyarwanda), font sizing (14px–24px), high contrast mode, dark mode, emergency contact settings, assigned doctor info, and conversation privacy erasure.
10. Emergency Hotlines (/emergency):
   - Rwanda National Mental Health Toll-Free Hotline: 114 (Free, 24/7)
   - Rwanda Police Emergency Hotline: 112
   - Child Helpline: 116
   - Isange One Stop Centre (GBV & Trauma): 3512
   - CARAES Ndera Neuropsychiatric Hospital: 0788305703 / 0252586111

### TONE & CLINICAL APPROACH:
- Lead with empathy, validation, and warmth.
- Apply Cognitive Behavioral Therapy (CBT) reflection and grounding techniques.
- Keep responses concise (under 200 words) and human.
- For severe distress, suicidal ideation, or crisis, immediately provide the Rwanda 114 hotline.`;
};

// Real-Time Chat
app.post('/chat', async (req, res) => {
  try {
    const { message, history, lang } = req.body;
    if (!message) return res.status(400).json({ error: "No message" });

    const isRw = lang && lang.startsWith('rw');

    if (isStrictlyNonHealthQuery(message)) {
      const refusalReply = isRw
        ? "Ndi Humura AI, umufasha wihariye w'ubuzima bwo mu mutwe n'imitekerereze mu Rwanda. Nshinzwe gusa gufasha mu bibazo byerekeye ubuzima, umutuzo wo mu mutwe, no kukuyobora ku rubuga rwa Humura AI. Sinshobora gusubiza ibibazo bitajyanye n'ubuzima. Mbwira, waba hari ikibazo cy'ubuzima wifuza ko tuganiraho cyangwa ubufasha ku mikorere ya Humura AI?"
        : "I am Humura AI, dedicated exclusively to mental health, emotional wellness, and your healthcare journey. I cannot assist with non-health topics like coding, homework, or general trivia. How are you feeling today, or is there a health concern or question about navigating Humura AI that I can help you with?";

      return res.json({ success: true, reply: refusalReply });
    }

    const chatHistory = (history || []).map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content || (m.parts && m.parts[0]?.text) || '' }]
    }));

    const result = await model.generateContent({
      systemInstruction: {
        parts: [{ text: HUMURA_SYSTEM_PROMPT(lang) }]
      },
      contents: [...chatHistory, { role: "user", parts: [{ text: message }] }]
    });

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
