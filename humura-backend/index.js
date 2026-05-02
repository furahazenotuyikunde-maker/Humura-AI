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
