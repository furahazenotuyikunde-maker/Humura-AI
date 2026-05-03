// Humura AI - Production Backend (Render Web Service) - v1.0.7
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { callGemini } = require('./lib/gemini');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });


dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});
const port = process.env.PORT || 3001;

// 1. Setup Middleware
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 2. Initialize Clients
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


// 3. Socket.io Presence & Logic
const onlineDoctors = new Set();

io.on('connection', async (socket) => {
  console.log('User connected:', socket.id);
  
  // Custom authentication (mocked here, should use JWT)
  const userId = socket.handshake.query.userId;
  const role = socket.handshake.query.role;

  if (userId) {
    socket.join(`user:${userId}`);
    
    if (role === 'doctor') {
      onlineDoctors.add(userId);
      console.log(`Doctor ${userId} is online`);
      
      // Update DB
      await supabase.from('doctor_profiles')
        .update({ is_available: true, last_seen_at: new Date().toISOString() })
        .eq('user_id', userId);
        
      // Broadcast to all
      io.emit('doctor:online', { doctor_id: userId });
    }
  }

  socket.on('join_doctor_room', (doctorId) => {
    socket.join(`doctor:${doctorId}`);
  });

  socket.on('join_patient_room', (patientId) => {
    socket.join(`patient:${patientId}`);
  });

  socket.on('disconnect', async () => {
    if (userId && role === 'doctor') {
      onlineDoctors.delete(userId);
      console.log(`Doctor ${userId} is offline`);
      
      await supabase.from('doctor_profiles')
        .update({ is_available: false, last_seen_at: new Date().toISOString() })
        .eq('user_id', userId);
        
      io.emit('doctor:offline', { doctor_id: userId });
    }
    console.log('User disconnected');
  });
});

// Helper: Broadcast to User Room
const notifyUser = (userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

// --- Endpoints ---

// 4a. Intake Acknowledgement (Gemini 2.5 Flash)
app.post('/api/ai/intake-ack', async (req, res) => {
  try {
    const { moodScore, lang } = req.body;
    const prompt = `A patient in Rwanda selected mood ${moodScore}/5. 
    Write one warm sentence acknowledging how they feel. 
    Language: ${lang === 'rw' ? 'Kinyarwanda' : 'English'}. Max 12 words.`;
    
    const text = await callGemini(prompt);
    return res.status(200).json({ ack: text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 4b. Fetch Real Available Doctors
app.get('/api/doctors/available', async (req, res) => {
  try {
    const { concern, language, available_now } = req.query;
    
    let query = supabase.from('doctors_public').select('*');
    
    if (concern) {
      query = query.contains('specialisations', [concern]);
    }
    if (language) {
      query = query.contains('languages', [language]);
    }
    if (available_now === 'true') {
      query = query.eq('is_available', true);
    }
    
    // Safety limit and ordering
    query = query.lt('caseload_count', 25)
                 .order('is_available', { ascending: false })
                 .order('rating_avg', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 4c. Patient-Doctor Assignment
app.post('/api/patients/assign-doctor', async (req, res) => {
  try {
    const { patientId, doctorId } = req.body;

    // 1. Update patient record
    const { error: patientErr } = await supabase
      .from('patients')
      .update({ doctor_id: doctorId, status: 'active' })
      .eq('id', patientId);
    
    if (patientErr) throw patientErr;

    // 2. Increment doctor caseload
    // We fetch current count first as Supabase JS client doesn't have an 'increment' operator in one go easily
    const { data: profile } = await supabase.from('doctor_profiles').select('caseload_count').eq('user_id', doctorId).single();
    await supabase.from('doctor_profiles').update({ caseload_count: (profile?.caseload_count || 0) + 1 }).eq('user_id', doctorId);

    // 3. Fetch patient info for notification
    const { data: patientProfile } = await supabase.from('profiles').select('full_name').eq('id', patientId).single();
    const { data: patientIntake } = await supabase.from('patients').select('primary_concern').eq('id', patientId).single();

    // 4. Notify Doctor via Socket
    notifyUser(doctorId, 'patient:assigned', {
      patient_id: patientId,
      patient_name: patientProfile?.full_name || "New Patient",
      concern_type: patientIntake?.primary_concern || "General Support"
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 4d. Fetch Doctor's Live Patients
app.get('/api/doctor/patients', async (req, res) => {
  try {
    const { doctorId } = req.query;
    
    const { data, error } = await supabase
      .from('patients')
      .select(`
        id,
        status,
        primary_concern,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('doctor_id', doctorId);

    if (error) throw error;
    
    // Map to a cleaner format
    const formatted = data.map(p => ({
      id: p.id,
      name: p.profiles?.full_name,
      concern_type: p.primary_concern,
      status: p.status,
      unread: 0, // In a real app, calculate from messages
      risk_level: "low" // In a real app, fetch from crisis_events
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 4c. SOS / Crisis Trigger (Parallel Actions < 3s)
app.post('/api/crisis/trigger', async (req, res) => {
  const { patientId, type, location, lastMsg, doctorId } = req.body;

  try {
    // 1. DB Log + Socket Notification (Critical Path)
    const [event] = await Promise.all([
      supabase.from('crisis_events').insert([{
        patient_id: patientId,
        trigger_type: type || 'SOS_BUTTON',
        location: location,
        last_message: lastMsg,
        risk_level: 'high'
      }]).select().single(),
      
      // Notify Doctor Room
      io.to(`doctor:${doctorId}`).emit('patient:sos_triggered', {
        patient_id: patientId,
        risk_level: "high",
        location: location,
        last_message: lastMsg
      })
    ]);

    // 2. Parallel Mock SMS Alerts
    console.log(`[Twilio Mock] SMS to Doctor: 🚨 CRISIS — Patient needs help NOW.`);
    console.log(`[Twilio Mock] SMS to Emergency Contact: Patient requested emergency support. Call 114.`);

    // 3. Async AI Risk Assessment (Non-blocking)
    const assessRisk = async () => {
      try {
        const prompt = `Patient in Rwanda triggered SOS. Last message: "${lastMsg}". 
        Return JSON only: { "risk_level": "low"|"medium"|"high", "reason": "string" }`;
        const result = await callGemini(prompt);
        const assessment = JSON.parse(result.replace(/```json|```/g, '').trim());
        
        await supabase.from('crisis_events').update({ risk_level: assessment.risk_level }).eq('id', event.data.id);
        io.to(`doctor:${doctorId}`).emit('patient:risk_updated', { patient_id: patientId, risk_level: assessment.risk_level });
      } catch (err) { console.error("Async Risk Assess Error:", err); }
    };
    assessRisk();

    return res.status(200).json({ success: true, eventId: event.data?.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 4d. CBT Homework Observation
app.post('/api/ai/homework-observation', async (req, res) => {
  try {
    const { task, response } = req.body;
    const prompt = `CBT task: '${task}'. Patient response: '${response}'. 
    Write a 2-sentence clinical observation for the doctor. Evidence-based and empathetic.`;
    
    const text = await callGemini(prompt);
    return res.status(200).json({ observation: text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 4e. Translation Helper
app.post('/api/ai/translate', async (req, res) => {
  try {
    const { message, targetLang } = req.body;
    const prompt = `Translate to ${targetLang === 'rw' ? 'Kinyarwanda' : 'English'} in a warm mental health tone: "${message}"`;
    
    const text = await callGemini(prompt);
    return res.status(200).json({ translated: text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 4f. Live Session: Notify Patient to Join
app.post('/api/session/notify-start', async (req, res) => {
  try {
    const { patientId, sessionId, doctorName } = req.body;
    
    if (!patientId) return res.status(400).json({ error: "Missing patientId" });

    console.log(`[SESSION] 🔔 Notifying patient ${patientId} to join session ${sessionId}`);

    // Notify Patient via Socket
    notifyUser(patientId, 'session:started', {
      sessionId,
      doctorName: doctorName || "Your Doctor",
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({ success: true, message: "Patient notified" });
  } catch (error) {
    console.error("Session Notify Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// 4f. Doctor Dashboard Generate Report
app.post('/api/doctor/generate-report', async (req, res) => {
  try {
    const { patientId } = req.body;

    // 1. Fetch real-time data context from DB to ensure accuracy
    const [moodLogs, journals, patientInfo] = await Promise.all([
      supabase.from('mood_logs').select('*').eq('patient_id', patientId).order('logged_at', { ascending: false }).limit(14),
      supabase.from('user_journals').select('*').eq('user_id', patientId).order('created_at', { ascending: false }).limit(5),
      supabase.from('patients').select('*').eq('id', patientId).single()
    ]);

    const dataContext = {
      primary_concern: patientInfo.data?.primary_concern,
      phq9: patientInfo.data?.phq9_score,
      gad7: patientInfo.data?.gad7_score,
      mood_history: moodLogs.data?.map(m => ({ score: m.mood_score, energy: m.energy_level, date: m.logged_at })),
      recent_journals: journals.data?.map(j => j.content)
    };

    const prompt = `You are a professional clinical AI assistant for mental health professionals in Rwanda. 
    Analyze this patient's real-time data and generate a clinical progress report.
    
    PATIENT DATA:
    - Primary Concern: ${dataContext.primary_concern}
    - Baseline Scores: PHQ9=${dataContext.phq9}, GAD7=${dataContext.gad7}
    - Recent Mood History: ${JSON.stringify(dataContext.mood_history)}
    - Recent Journal Thoughts: ${JSON.stringify(dataContext.recent_journals)}

    Return a JSON object only:
    {
      "mood_trend": "improving" | "stable" | "declining",
      "avg_mood_score": number,
      "ai_summary": "A 2-3 sentence clinical overview of the patient's current state.",
      "recommendations": ["specific clinical step 1", "specific clinical step 2"]
    }`;

    const text = await callGemini(prompt);
    const reportData = JSON.parse(text.replace(/```json|```/g, '').trim());
    
    // Save the generated report
    const { data: savedReport, error: insertError } = await supabase.from('progress_reports').insert([{
      patient_id: patientId,
      mood_trend: reportData.mood_trend,
      avg_mood_score: reportData.avg_mood_score,
      ai_summary: reportData.ai_summary,
      recommendations: reportData.recommendations
    }]).select().single();

    if (insertError) throw insertError;

    return res.status(200).json({ success: true, report: savedReport });
  } catch (error) {
    console.error("Report Generation Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// 4g. Main AI Chat (Gemini 2.5 Flash)
app.post('/chat', async (req, res) => {
  try {
    const { message, history, image, lang } = req.body;
    if (!message) return res.status(400).json({ error: "No message" });

    const isRw = lang && lang.startsWith('rw');
    const languageName = isRw ? 'Kinyarwanda' : 'English';

    // Format history — support both {role,content} and {role,parts} shapes
    const chatHistory = (history || []).map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content || (m.parts && m.parts[0]?.text) || '' }]
    }));

    let parts = [{ text: message }];
    if (image) {
      parts.push({
        inlineData: {
          data: image.split(',')[1],
          mimeType: "image/jpeg"
        }
      });
    }

    const response = await geminiModel.generateContent({
      systemInstruction: {
        parts: [{ text: `You are Humura AI, a compassionate mental health companion for people in Rwanda.
CRITICAL: Respond EXCLUSIVELY in ${languageName}. Never mix languages.
Lead with empathy and validation. For any crisis signs, gently provide the Rwanda 114 hotline.
Keep responses concise (under 200 words) and human.` }]
      },
      contents: [
        ...chatHistory,
        { role: "user", parts }
      ]
    });

    const reply = (await response.response).text();

    // Save to Supabase for Clinical Visibility
    if (req.body.userId) {
      await supabase.from('messages').insert([
        { sender_id: req.body.userId, receiver_id: '00000000-0000-0000-0000-000000000000', content: message },
        { sender_id: '00000000-0000-0000-0000-000000000000', receiver_id: req.body.userId, content: reply }
      ]);
    }

    // Auto-Crisis Detection
    const isCrisis = /suicide|kill|harm|die|death|help now|emergency/i.test(message + reply);

    return res.status(200).json({ success: true, reply, isCrisis });

  } catch (error) {
    console.error("Chat Error:", error.message);
    const isRateLimit = error.message?.includes('429') || error.message?.toLowerCase().includes('quota');
    if (isRateLimit) {
      return res.status(200).json({
        success: true,
        reply: "You've reached the usage limit. Please try again in 1 hour, or call 114 for immediate support."
      });
    }
    return res.status(500).json({ error: error.message });
  }
});

app.get('/chat', (req, res) => res.json({ status: "Chat is live." }));

app.get('/', (req, res) => res.json({ message: 'Humura AI Backend v1.1.0 Unified Live!', engine: 'Gemini 2.5 Flash' }));

// Patient Dashboard: Direct Gemini Analysis (no DB lookup blocking)
const handleAnalyzeProgress = async (req, res) => {
  try {
    const { moods, journals, isSignLanguage, currentMood, currentMoodEmoji, currentMoodLabel } = req.body;

    const journalContext = journals && journals.length > 0
      ? `Patient's recent journal entries (read these carefully, they contain the patient's real thoughts):\n${journals.map((j, i) => `- Entry ${i+1}: "${j}"`).join('\n')}`
      : 'No journal entries yet.';

    const moodContext = currentMood
      ? `The patient just logged they are feeling ${currentMoodEmoji || ''} "${currentMoodLabel || currentMood}" RIGHT NOW.`
      : `Recent mood pattern: ${JSON.stringify(moods || [])}`;

    const prompt = `You are Humura AI — a compassionate, bilingual mental health companion serving patients in Rwanda.

CURRENT EMOTIONAL STATE:
${moodContext}

MOOD HISTORY (last 7 days): ${JSON.stringify(moods || [])}

${journalContext}

Sign Language User: ${isSignLanguage ? 'YES — include visual/video-based tips in English and Kinyarwanda' : 'NO'}

YOUR TASK:
1. Read the journal entries carefully. Reference specific things the patient wrote to show you truly listened.
2. Acknowledge the current mood (${currentMoodLabel || currentMood || 'general'}) warmly and by name.
3. Connect the mood with what they wrote in their journal — find the emotional thread.
4. Give 3 practical, specific recommendations based on BOTH their mood AND their journal content.
5. If they wrote about stress, loneliness, or crisis — prioritize coping strategies and support resources.
6. Keep a warm, human tone — like a trusted counselor, not a robot.

Respond ONLY with this exact JSON (no markdown, no extra text):
{
  "success": true,
  "summary": "2-3 sentences in ${lang === 'rw' ? 'Kinyarwanda' : 'English'} that reference their specific mood and journal content to show you truly heard them",
  "recommendations": [
    "specific recommendation 1 in ${lang === 'rw' ? 'Kinyarwanda' : 'English'}",
    "specific recommendation 2 in ${lang === 'rw' ? 'Kinyarwanda' : 'English'}",
    "specific recommendation 3 in ${lang === 'rw' ? 'Kinyarwanda' : 'English'}"
  ]
}`;

    const result = await geminiModel.generateContent(prompt);
    const text = (await result.response).text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Gemini returned no JSON");
    const parsed = JSON.parse(jsonMatch[0]);
    res.json(parsed);
  } catch (error) {
    console.error("analyze-progress error:", error.message);
    
    // Friendly rate-limit message
    const isRateLimit = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('Too Many Requests');
    if (isRateLimit) {
      return res.status(200).json({
        success: false,
        rateLimited: true,
        summary: "You have reached your daily AI analysis limit. Please try again in 1 hour.",
        summaryRw: "Wageze ku mupaka wa buri munsi. Ongera ugerageze nyuma y'isaha imwe.",
        recommendations: []
      });
    }

    res.status(500).json({ success: false, error: error.message });
  }
};

app.post('/api/analyze-progress', handleAnalyzeProgress);

// ─── Sign Language: Camera Image Analysis ───────────────────────────────────
app.post('/analyze-sign', upload.single('image'), async (req, res) => {
  try {
    const prompt = req.body.prompt || 'Analyze this sign language gesture and return JSON: {"detectedSign": "...", "explanation": "..."}';
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    const result = await geminiModel.generateContent([
      { text: prompt },
      { inlineData: { mimeType, data: base64Image } }
    ]);

    const text = (await result.response).text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const reply = jsonMatch ? jsonMatch[0] : text;

    res.json({ success: true, reply });
  } catch (error) {
    console.error('analyze-sign error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// NOTE: /chat is defined above (line ~342) — this duplicate removed to avoid Express route shadowing.

server.listen(port, () => console.log(`🚀 Humura AI Backend running on port ${port}`));
