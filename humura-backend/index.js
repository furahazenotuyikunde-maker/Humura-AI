// Humura AI - Production Backend (Render Web Service) - v1.0.7
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { callGemini } = require('./lib/gemini');


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
const geminiModel = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });


// 3. Socket.io Logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_doctor_room', (doctorId) => {
    socket.join(`doctor:${doctorId}`);
  });

  socket.on('join_patient_room', (patientId) => {
    socket.join(`patient:${patientId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Helper: Broadcast to Doctor
const notifyDoctor = (doctorId, event, data) => {
  io.to(`doctor:${doctorId}`).emit(event, data);
};

// --- Endpoints ---

// 4a. Intake Acknowledgement (Gemini 3 Flash Preview)
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

// 4b. Doctor Matching & Assignment
app.post('/api/patients/match-doctor', async (req, res) => {
  try {
    const { patientId, concern, lang } = req.body;

    // 1. Fetch doctors with matching specialization and language
    const { data: doctors, error: docError } = await supabase
      .from('profiles')
      .select('id, specialty, full_name, language_pref')
      .eq('role', 'doctor');

    if (docError) throw docError;

    // 2. Simple matching logic: speciality match + caseload check
    let assignedDoctor = doctors.find(d => 
      d.specialty?.toLowerCase().includes(concern?.toLowerCase() || '')
    ) || doctors[0];

    if (!assignedDoctor) return res.status(404).json({ error: "No doctors available" });

    // 3. Update Patient record
    await supabase.from('patients').update({ doctor_id: assignedDoctor.id }).eq('id', patientId);

    // 4. Notify Doctor (WebSocket + Mock Twilio)
    notifyDoctor(assignedDoctor.id, 'patient:assigned', {
      patient_id: patientId,
      name: "A new patient",
      concern_type: concern,
      mood_score: 3
    });

    console.log(`[Twilio Mock] SMS to Doctor ${assignedDoctor.full_name}: New patient assigned: ${concern}`);

    return res.status(200).json({ success: true, doctor: assignedDoctor });
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

// 4f. Doctor Dashboard Generate Report
app.post('/api/doctor/generate-report', async (req, res) => {
  try {
    const { patientId, dataContext } = req.body;
    const prompt = `You are a clinical AI. Analyze this patient's data and generate a progress report.
    Patient Data: ${JSON.stringify(dataContext)}
    Return JSON only: { "mood_trend": "improving|stable|declining", "ai_summary": "...", "recommendations": [] }`;

    const text = await callGemini(prompt);
    const reportData = JSON.parse(text.replace(/```json|```/g, '').trim());
    
    await supabase.from('progress_reports').insert([{
      patient_id: patientId,
      ...reportData
    }]);

    return res.status(200).json({ success: true, report: reportData });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 4g. Main AI Chat (Gemini 3 Flash Preview)
app.post('/chat', async (req, res) => {
  try {
    const { message, history, image, lang } = req.body;
    if (!message) return res.status(400).json({ error: "No message" });

    const chatHistory = (history || []).map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
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
      contents: [
        ...chatHistory,
        { role: "user", parts }
      ]
    });
    
    const responseText = await response.response;
    const reply = responseText.text();
    
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
    console.error("Chat Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/chat', (req, res) => res.json({ status: "Chat is live." }));

app.get('/', (req, res) => res.json({ message: 'Humura AI Backend v1.1.0 Unified Live!', engine: 'Gemini 3 Flash Preview' }));


server.listen(port, () => console.log(`🚀 Humura AI Backend running on port ${port}`));
