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
const axios = require('axios');
const nodemailer = require('nodemailer');
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

const primaryModel = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const geminiModel = {
  generateContent: async (options) => {
    try {
      return await primaryModel.generateContent(options);
    } catch (e) {
      console.warn("Primary SDK model gemini-3-flash-preview failed, trying fallback gemini-1.5-flash:", e.message);
      return await fallbackModel.generateContent(options);
    }
  }
};

const handleApiError = (res, error) => {
  const isRateLimit = error.message?.includes('429') || error.message?.toLowerCase().includes('quota') || error.message?.includes('Too Many Requests');
  if (isRateLimit) {
    return res.status(500).json({ error: "You hit daily usage, try again in 1 hr." });
  }
  return res.status(500).json({ error: error.message });
};
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

// 4a. Intake Acknowledgement (Gemini 3 Flash)
app.post('/api/ai/intake-ack', async (req, res) => {
  try {
    const { moodScore, lang } = req.body;
    const prompt = `A patient in Rwanda selected mood ${moodScore}/5. 
    Write one warm sentence acknowledging how they feel. 
    Language: ${lang === 'rw' ? 'Kinyarwanda' : 'English'}. Max 12 words.`;
    
    const text = await callGemini(prompt);
    return res.status(200).json({ ack: text });
  } catch (error) {
    return handleApiError(res, error);
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
    return handleApiError(res, error);
  }
});

// 4c. Patient-Doctor Assignment (Clinical Handshake)
app.post('/api/patients/assign-doctor', async (req, res) => {
  try {
    const { patientId, doctorId } = req.body;

    // 1. Check if already active
    const { data: existing } = await supabase
      .from('patient_caseload')
      .select('*')
      .eq('patient_id', patientId)
      .eq('doctor_id', doctorId)
      .maybeSingle();

    if (existing && existing.status === 'active') {
      return res.status(200).json({ success: true, message: "Already assigned" });
    }

    // 2. Ensure a row exists in the patients table (Clinical Handshake)
    // This MUST happen before caseload insert due to foreign key constraints
    const { data: patientData } = await supabase.from('patients').select('*').eq('id', patientId).maybeSingle();
    
    if (!patientData) {
      await supabase.from('patients').insert([{
        id: patientId,
        doctor_id: doctorId,
        status: 'active',
        created_at: new Date().toISOString()
      }]);
    } else {
      await supabase.from('patients').update({ 
        doctor_id: doctorId, 
        status: 'active' 
      }).eq('id', patientId);
    }

    // 3. Reactivate or Create caseload record
    if (existing) {
      await supabase.from('patient_caseload').update({ status: 'active' }).eq('id', existing.id);
    } else {
      const { error: caseloadErr } = await supabase
        .from('patient_caseload')
        .insert([{ 
          patient_id: patientId, 
          doctor_id: doctorId, 
          status: 'active' 
        }]);

      if (caseloadErr) throw caseloadErr;
    }

    // 3. Increment doctor caseload count in profiles
    const { data: profile } = await supabase.from('doctor_profiles').select('caseload_count').eq('user_id', doctorId).single();
    await supabase.from('doctor_profiles').update({ caseload_count: (profile?.caseload_count || 0) + 1 }).eq('user_id', doctorId);

    // 4. Update primary patient record
    await supabase.from('patients').update({ doctor_id: doctorId, status: 'active' }).eq('id', patientId);

    // 5. Notify Doctor via Socket (Redundancy for Instant UI feedback)
    const { data: patientProfile } = await supabase.from('profiles').select('full_name').eq('id', patientId).single();
    notifyUser(doctorId, 'patient:assigned', {
      patient_id: patientId,
      patient_name: patientProfile?.full_name || "New Patient"
    });

    return res.status(200).json({ success: true, data: caseload });
  } catch (error) {
    console.error("Assignment Error:", error);
    return handleApiError(res, error);
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
    return handleApiError(res, error);
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
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        const assessment = jsonMatch ? JSON.parse(jsonMatch[0]) : { risk_level: 'medium', reason: 'Failed to parse AI response' };
        
        await supabase.from('crisis_events').update({ risk_level: assessment.risk_level }).eq('id', event.data.id);
        io.to(`doctor:${doctorId}`).emit('patient:risk_updated', { patient_id: patientId, risk_level: assessment.risk_level });
      } catch (err) { console.error("Async Risk Assess Error:", err); }
    };
    assessRisk();

    return res.status(200).json({ success: true, eventId: event.data?.id });
  } catch (error) {
    return handleApiError(res, error);
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
    return handleApiError(res, error);
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
    return handleApiError(res, error);
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
    return handleApiError(res, error);
  }
});

// 4g. Jitsi Video Session Routes (Zero-Cost, No API Key)
app.post('/api/sessions/:session_id/start-video', async (req, res) => {
  const { session_id } = req.params;
  const { doctorName } = req.body;

  try {
    // 1. Fetch session and patient info
    const { data: session, error: sessErr } = await supabase
      .from('sessions')
      .select('*, profiles:patient_id(full_name)')
      .eq('id', session_id)
      .single();

    if (sessErr || !session) throw new Error("Session not found");

    // 2. Generate unique room name
    const roomName = `humura-${session.id}-${Date.now()}`.replace(/[^a-zA-Z0-9-]/g, "");
    const roomUrl = `https://meet.jit.si/${roomName}`;

    // 3. Update sessions table
    await supabase.from('sessions')
      .update({ 
        video_room_url: roomUrl, 
        video_started_at: new Date().toISOString() 
      })
      .eq('id', session_id);

    // 4. Notify Patient via Socket
    notifyUser(session.patient_id, 'session:video_started', {
      session_id: session.id,
      video_room_url: roomUrl,
      room_name: roomName,
      doctor_name: doctorName || "Your Doctor"
    });

    console.log(`[VIDEO] 🎥 Jitsi Room Started: ${roomName} for Patient ${session.patient_id}`);

    return res.status(200).json({ 
      success: true, 
      video_room_url: roomUrl, 
      room_name: roomName 
    });
  } catch (error) {
    console.error("Jitsi Start Error:", error.message);
    return handleApiError(res, error);
  }
});

app.post('/api/video/end-room', async (req, res) => {
  const { sessionId } = req.body;
  try {
    await supabase.from('sessions')
      .update({ video_room_url: null })
      .eq('id', sessionId);

    return res.status(200).json({ success: true });
  } catch (error) {
    return handleApiError(res, error);
  }
});

// 4f. Doctor Dashboard Generate Report
app.post('/api/doctor/generate-report', async (req, res) => {
  try {
    const { patientId, email } = req.body;

    if (!patientId) return res.status(400).json({ error: "Missing patientId" });

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
      "ai_summary": "A 3-4 sentence clinical progress summary of the patient's current state.",
      "recommendations": ["specific clinical step 1", "specific clinical step 2"]
    }`;

    const text = await callGemini(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Gemini returned no JSON");
    const reportData = JSON.parse(jsonMatch[0]);
    
    // Save the generated report
    const { data: savedReport, error: insertError } = await supabase.from('progress_reports').insert([{
      patient_id: patientId,
      mood_trend: reportData.mood_trend,
      avg_mood_score: reportData.avg_mood_score,
      ai_summary: reportData.ai_summary,
      recommendations: reportData.recommendations
    }]).select().single();

    if (insertError) throw insertError;

    // Send email using nodemailer if provided
    if (email) {
      console.log(`[MAILER] 📧 Sending clinical report for patient ${patientId} to ${email}`);
      
      let transporter;
      
      // If no SMTP settings are provided, use Ethereal for testing
      if (!process.env.SMTP_HOST) {
        let testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false, 
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log(`[MAILER] No SMTP credentials. Using Ethereal Email test account: ${testAccount.user}`);
      } else {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      }

      const emailHtml = `
        <h2>Clinical Progress Report</h2>
        <p><strong>Patient:</strong> ${patientInfo.data?.profiles?.full_name || 'Patient'}</p>
        <p><strong>Mood Trend:</strong> ${reportData.mood_trend}</p>
        <p><strong>Average Mood Score:</strong> ${reportData.avg_mood_score}/10</p>
        
        <h3>Clinical AI Summary</h3>
        <p>${reportData.ai_summary}</p>
        
        <h3>Recommendations</h3>
        <ul>
          ${reportData.recommendations.map(r => `<li>${r}</li>`).join('')}
        </ul>
        <br/>
        <p><small>Confidential Clinical Document - Generated by Humura AI</small></p>
      `;

      let info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Humura AI" <reports@humura.ai>',
        to: email,
        subject: `Clinical Progress Report - ${patientInfo.data?.profiles?.full_name || 'Patient'}`,
        html: emailHtml,
      });

      console.log("[MAILER] Message sent: %s", info.messageId);
      if (!process.env.SMTP_HOST) {
        console.log("[MAILER] Preview URL: %s", nodemailer.getTestMessageUrl(info));
      }
    }

    return res.status(200).json({ 
      success: true, 
      report: savedReport,
      message: email ? `Report sent to ${email}` : "Report generated successfully"
    });
  } catch (error) {
    console.error("Report Generation Error:", error);
    return handleApiError(res, error);
  }
});

// 4g. Pre-Analysis Guardrail & Complete System Knowledge
const isStrictlyNonHealthQuery = (text) => {
  if (!text) return false;
  const t = text.toLowerCase();

  // If query touches health, emotional wellbeing, feelings, body, mental state, or Humura platform, it is ALLOWED
  const hasHealthOrSystem = /(health|mental|depress|anxi|stress|panic|sleep|insomnia|trauma|grief|pain|headache|ache|doctor|nurse|clinic|hospital|medicine|pill|therapy|cbt|counsel|feeling|feel|mood|sad|happy|cry|suicid|harm|die|kill|death|hopeless|lonel|burnout|overwhelm|tired|fatigue|breath|heart|mind|psycho|calm|worry|worrying|afraid|scared|confus|ubuzima|umutwe|agahinda|umunaniro|kwiheba|ubwoba|impungenge|umuganga|ibitotsi|gusinzira|ihungabana|ibikomere|kwiyahura|umuti|indwara|humura|zeno|furaha|creator|founder|owner|system|platform|website|sign language|braille|amarenga|urubuga|dashboard|settings|consultation|emergency|hotline|114|caraes|ndera)/i.test(t);
  if (hasHealthOrSystem) return false;

  // Patterns strictly unrelated to health, psychology, or system navigation
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

// 4g. Main AI Chat (Gemini 3 Flash)
app.post('/chat', async (req, res) => {
  try {
    const { message, history, image, lang } = req.body;
    if (!message) return res.status(400).json({ error: "No message" });

    const isRw = lang && lang.startsWith('rw');

    // 1. Mandatory Pre-Analysis Check: Refuse strictly off-topic questions
    if (isStrictlyNonHealthQuery(message)) {
      const refusalReply = isRw
        ? "Ndi Humura AI, umufasha wihariye w'ubuzima bwo mu mutwe n'imitekerereze mu Rwanda. Nshinzwe gusa gufasha mu bibazo byerekeye ubuzima, umutuzo wo mu mutwe, no kukuyobora ku rubuga rwa Humura AI. Sinshobora gusubiza ibibazo bitajyanye n'ubuzima. Mbwira, waba hari ikibazo cy'ubuzima wifuza ko tuganiraho cyangwa ubufasha ku mikorere ya Humura AI?"
        : "I am Humura AI, dedicated exclusively to mental health, emotional wellness, and your healthcare journey. I cannot assist with non-health topics like coding, homework, or general trivia. How are you feeling today, or is there a health concern or question about navigating Humura AI that I can help you with?";

      if (req.body.userId) {
        await supabase.from('messages').insert([
          { sender_id: req.body.userId, receiver_id: '00000000-0000-0000-0000-000000000000', content: message },
          { sender_id: '00000000-0000-0000-0000-000000000000', receiver_id: req.body.userId, content: refusalReply }
        ]);
      }

      return res.status(200).json({
        reply: refusalReply,
        flaggedIssue: null
      });
    }

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
        parts: [{ text: HUMURA_SYSTEM_PROMPT(lang) }]
      },
      contents: (() => {
        const raw = [...chatHistory, { role: "user", parts }];
        const deduped = raw.filter((msg, i) => i === 0 || msg.role !== raw[i - 1].role);
        return deduped[0]?.role === 'user' ? deduped : deduped.slice(1);
      })()
    });

    const reply = (await response.response).text();

    // Save to Supabase for Clinical Visibility
    if (req.body.userId) {
      await supabase.from('messages').insert([
        { sender_id: req.body.userId, receiver_id: '00000000-0000-0000-0000-000000000000', content: message },
        { sender_id: '00000000-0000-0000-0000-000000000000', receiver_id: req.body.userId, content: reply }
      ]);
    }

    // Clinical Struggle & Crisis Detection Engine
    const isCrisis = /suicide|kill|harm|die|death|help now|emergency|kwiyahura|gupfa|kwigirira nabi|sinshaka kubaho/i.test(message + reply);
    const isAnxiety = /panic|can't breathe|hyperventilat|heart (racing|pounding)|chest tightness|terrified|impungenge|ubwoba/i.test(message);
    const isDepression = /hopeless|worthless|empty inside|crying (all day|every day)|depressed|kwiheba|agahinda gakabije/i.test(message);
    const isInsomnia = /insomnia|cannot sleep|can't sleep|haven't slept|ibitotsi|sinzira|gusinzira|kubura ibitotsi|sinsinzira/i.test(message);
    const isTrauma = /trauma|flashback|assault|abuse|ptsd|ihungabana|ibikomere/i.test(message);
    const isGrief = /lost my|passed away|grieving|grief|gupfusha|uwapfuye|ikiriyo/i.test(message);

    let flaggedIssue = null;

    if (isCrisis || isAnxiety || isDepression || isInsomnia || isTrauma || isGrief) {
      const risk = isCrisis ? 'high' : 'medium';
      const category = isCrisis ? 'crisis' : isAnxiety ? 'anxiety' : isDepression ? 'depression' : isInsomnia ? 'insomnia' : isTrauma ? 'trauma' : 'grief';
      const title = isCrisis ? 'Acute Crisis & Immediate Risk' : isAnxiety ? 'Acute Panic & Anxiety Episode' : isDepression ? 'Depressive State & Hopelessness' : isInsomnia ? 'Sleep Disruption & Insomnia' : isTrauma ? 'Trauma Recall & Shock' : 'Acute Grief & Bereavement';
      const taskDesc = isCrisis
        ? 'Urgent Clinical Outreach: Direct contact required to activate crisis stabilization protocol.'
        : `Clinical Follow-up Task: Review ${category} symptoms with patient and adjust CBT care plan.`;

      if (req.body.userId) {
        try {
          // Look up assigned doctor
          const { data: patientRow } = await supabase.from('patients').select('doctor_id').eq('id', req.body.userId).maybeSingle();
          let doctorId = patientRow?.doctor_id;
          let doctorName = 'Care Specialist';

          if (!doctorId) {
            const { data: docs } = await supabase.from('profiles').select('id, full_name').eq('role', 'doctor').limit(1);
            if (docs && docs.length > 0) {
              doctorId = docs[0].id;
              doctorName = docs[0].full_name || 'Dr. Mutesi Alice';
            }
          } else {
            const { data: docProf } = await supabase.from('profiles').select('full_name').eq('id', doctorId).maybeSingle();
            if (docProf?.full_name) doctorName = docProf.full_name;
          }

          // Update patients record
          await supabase.from('patients').upsert({
            id: req.body.userId,
            doctor_id: doctorId,
            primary_concern: `[AI Flagged] ${title}`,
            self_harm_flag: isCrisis,
            status: 'active'
          });

          if (doctorId) {
            await supabase.from('patient_caseload').upsert({
              patient_id: req.body.userId,
              doctor_id: doctorId,
              status: 'active'
            }, { onConflict: 'doctor_id,patient_id' });
          }

          // Insert into crisis_events
          await supabase.from('crisis_events').insert([{
            patient_id: req.body.userId,
            trigger_type: 'AI_detected',
            last_message: `[AI Flagged Struggle: ${title}] Patient shared: "${message.slice(0, 160)}". Assigned Task: ${taskDesc}`,
            risk_level: risk,
            location: {
              doctorId,
              doctorName,
              issueCategory: category,
              riskLevel: risk,
              clinicalTask: taskDesc,
              patientExcerpt: message.slice(0, 200),
              timestamp: new Date().toISOString()
            }
          }]);

          if (doctorId) {
            io.to(`doctor:${doctorId}`).emit('patient:ai_struggle_flagged', {
              patient_id: req.body.userId,
              title,
              risk_level: risk,
              task: taskDesc
            });
          }

          flaggedIssue = { detected: true, title, risk, doctorName, task: taskDesc };
        } catch (dbErr) {
          console.error("Auto-flagging DB error:", dbErr);
        }
      }
    }

    return res.status(200).json({ success: true, reply, isCrisis, flaggedIssue });

  } catch (error) {
    console.error("Chat Error:", error.message);
    const isRateLimit = error.message?.includes('429') || error.message?.toLowerCase().includes('quota');
    if (isRateLimit) {
      return res.status(200).json({
        success: true,
        reply: "You've reached the usage limit. Please try again in 1 hour, or call 114 for immediate support."
      });
    }
    return handleApiError(res, error);
  }
});

app.get('/chat', (req, res) => res.json({ status: "Chat is live." }));

app.get('/', (req, res) => res.json({ message: 'Humura AI Backend v1.1.2 Unified Live!', engine: 'Gemini 2.5 Flash Preview' }));

// Patient Dashboard: Direct Gemini Analysis (no DB lookup blocking)
const handleAnalyzeProgress = async (req, res) => {
  try {
    const { moods, journals, isSignLanguage, currentMood, currentMoodEmoji, currentMoodLabel, lang } = req.body;
    const languageName = lang === 'rw' ? 'Kinyarwanda' : 'English';

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
  "summary": "2-3 sentences in ${languageName} that reference their specific mood and journal content to show you truly heard them",
  "recommendations": [
    "specific recommendation 1 in ${languageName}",
    "specific recommendation 2 in ${languageName}",
    "specific recommendation 3 in ${languageName}"
  ]
}`;

    const result = await geminiModel.generateContent(prompt);
    const text = (await result.response).text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Gemini returned no JSON");
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Safety Fallback
    if (!parsed.summary) {
      parsed.summary = lang === 'rw' 
        ? "Isesengura ryabonetse neza. Komeza ukoreshe porogaramu usangize ibyiyumvo byawe."
        : "Analysis completed successfully. Continue logging your thoughts to see more insights.";
    }

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

    return handleApiError(res, error);
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
    return handleApiError(res, error);
  }
});

// 4h. Clinical Caseload Intelligence
app.post('/api/doctor/query-caseload', async (req, res) => {
  try {
    const { doctorId, query } = req.body;

    // 1. Fetch real caseload data for context
    const { data: caseload, error: patientsErr } = await supabase
      .from('patient_caseload')
      .select(`
        *,
        patient:profiles!patient_id(full_name),
        clinical_info:patients!patient_id(
          primary_concern, phq9_score, gad7_score, status
        )
      `)
      .eq('doctor_id', doctorId);

    if (patientsErr) throw patientsErr;

    const caseloadSummary = caseload.map(p => {
      const patientInfo = Array.isArray(p.patient) ? p.patient[0] : p.patient;
      const clinical = Array.isArray(p.clinical_info) ? p.clinical_info[0] : p.clinical_info;
      return {
        name: patientInfo?.full_name,
        concern: clinical?.primary_concern,
        phq9: clinical?.phq9_score,
        gad7: clinical?.gad7_score,
        status: clinical?.status
      };
    });

    const prompt = `You are a Senior Clinical Data Assistant for Humura AI.
    DOCTOR ID: ${doctorId}
    CURRENT CASELOAD CONTEXT: ${JSON.stringify(caseloadSummary)}
    
    DOCTOR'S QUESTION: "${query}"
    
    TASK: Answer the doctor's question accurately using the context above. 
    If the question is about a specific patient not in the list, state that they aren't in the current assigned caseload.
    Provide concise, professional, and clinical answers.
    
    Respond ONLY with a JSON object:
    { "success": true, "reply": "string" }`;

    const result = await geminiModel.generateContent(prompt);
    const text = (await result.response).text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { success: true, reply: text };

    res.json(parsed);
  } catch (error) {
    return handleApiError(res, error);
  }
});

server.listen(port, () => console.log(`🚀 Humura AI Backend running on port ${port}`));
