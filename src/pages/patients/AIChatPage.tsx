import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SendHorizontal, AlertCircle, Loader2, Mic, MicOff,
  ImagePlus, Square, Edit2, X, Trash2,
  CheckCircle, RefreshCcw, ChevronLeft, PhoneCall,
  Smile, Sparkles, HeartHandshake, Wind, Sun, Activity, Copy,
  ShieldAlert, Stethoscope
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

interface Message {
  role: 'user' | 'model';
  content: string;
  translated?: string;
  image?: string;
  timestamp: Date;
  clinicalFlag?: {
    title: string;
    doctorName: string;
    risk: 'low' | 'medium' | 'high';
    task: string;
  };
}

interface QuickMood {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label_en: string;
  label_rw: string;
  score: number;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

const QUICK_MOODS: QuickMood[] = [
  {
    id: 'calm',
    icon: Wind,
    label_en: 'Calm',
    label_rw: 'Amahoro',
    score: 4,
    colorClass: 'text-[#2563EB]',
    bgClass: 'bg-[#EFF6FF]',
    borderClass: 'border-[#D6E7FF]'
  },
  {
    id: 'anxious',
    icon: Activity,
    label_en: 'Anxious',
    label_rw: 'Impungenge',
    score: 1,
    colorClass: 'text-[#CA8A04]',
    bgClass: 'bg-[#FEFCE8]',
    borderClass: 'border-[#FEF08A]'
  },
  {
    id: 'hopeful',
    icon: Sun,
    label_en: 'Hopeful',
    label_rw: 'Ibyiringiro',
    score: 4,
    colorClass: 'text-[#7C3AED]',
    bgClass: 'bg-[#F5F2FF]',
    borderClass: 'border-[#E4DCFB]'
  },
  {
    id: 'happy',
    icon: Smile,
    label_en: 'Happy',
    label_rw: 'Uwishimye',
    score: 5,
    colorClass: 'text-[#D97706]',
    bgClass: 'bg-[#FEF8E7]',
    borderClass: 'border-[#FCE9B6]'
  },
  {
    id: 'grateful',
    icon: HeartHandshake,
    label_en: 'Grateful',
    label_rw: 'Gukenguruka',
    score: 5,
    colorClass: 'text-[#059669]',
    bgClass: 'bg-[#EDF9F3]',
    borderClass: 'border-[#D1F2E2]'
  },
  {
    id: 'excited',
    icon: Sparkles,
    label_en: 'Excited',
    label_rw: 'Amashyushyu',
    score: 5,
    colorClass: 'text-[#DC2626]',
    bgClass: 'bg-[#FFF0F0]',
    borderClass: 'border-[#FFD9D9]'
  }
];

const AFFIRMATIONS = [
  "You are worthy of healing. Every small step forward is progress worth celebrating.",
  "Healing is not linear. Be patient with yourself.",
  "Your feelings are valid. You deserve care, patience, and compassion.",
  "Today, choose to be kind to yourself. You are doing your best.",
  "You are stronger than you know. Keep going — one breath at a time."
];

const isStrictlyNonHealthQuery = (text: string): boolean => {
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

const HUMURA_SYSTEM_PROMPT = (lang: string) => {
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

export default function AIChatPage() {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [affirmation] = useState(() => AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
  const [profile, setProfile] = useState<any>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHistory();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
          .then(({ data }) => setProfile(data));
      }
    });

    // Check if coming from dashboard thought bar with prefilled thought
    const prefilled = sessionStorage.getItem('humura_prefilled_prompt');
    if (prefilled) {
      sessionStorage.removeItem('humura_prefilled_prompt');
      setTimeout(() => {
        sendMessage(prefilled);
      }, 300);
    }
  }, []);

  const loadHistory = () => {
    const saved = localStorage.getItem('humura_chat_history_v6');
    if (saved) {
      const parsed = JSON.parse(saved);
      setMessages(parsed.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
        clinicalFlag: m.clinicalFlag
      })));
    } else {
      setMessages([{
        role: 'model',
        content: isRw
          ? "Muraho! Ndi Humura AI, mugenzi wawe mu rugendo rwo gutura umutwaro no kugarura umutuzo mu mutwe. Niteguye kukumva no kugufasha mu buryo bwa CBT. Umeze ute ubu?"
          : "Hello! I am Humura AI, your compassionate companion in this journey of healing and emotional clarity. I'm here to listen and support you with evidence-based CBT exercises. How are you feeling right now?",
        timestamp: new Date()
      }]);
    }
  };

  const saveHistory = (msgs: Message[]) =>
    localStorage.setItem('humura_chat_history_v6', JSON.stringify(msgs));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  interface ClinicalAssessment {
    detected: boolean;
    category: string;
    title: string;
    title_rw: string;
    risk: 'low' | 'medium' | 'high';
    taskDescription: string;
    taskDescription_rw: string;
  }

  const detectPatientStruggle = (text: string): ClinicalAssessment | null => {
    const t = text.toLowerCase();

    // 1. Crisis / Severe Distress / Self-harm
    if (/(suicid|kill (my)?self|want to die|don't want to live|end my life|cut myself|self.?harm|overdos|kwiyahura|gupfa|nshaka gupfa|kwigirira nabi|sinshaka kubaho|ndumva napfa|kwiyica)/i.test(t)) {
      return {
        detected: true,
        category: 'crisis',
        title: 'Acute Crisis & Immediate Risk',
        title_rw: 'Ikibazo cyihutirwa cyane',
        risk: 'high',
        taskDescription: 'Urgent Clinical Outreach: Direct contact required to activate crisis stabilization protocol.',
        taskDescription_rw: 'Ubutabazi bwihuse: Hamagara umurwayi mu buryo butaziguye kugira ngo ahabwe ubutabazi bwihutirwa.'
      };
    }

    // 2. Anxiety & Panic Attack Episodes
    if (/(panic attack|can't breathe|hyperventilat|heart (racing|pounding)|chest tightness|terrified|paralyzed by fear|severe anxiety|anxiety is killing|impungenge zikabije|ubwoba bukabije|umutima urateragura|guhinda umushyitsi|ubwoba bwinshi)/i.test(t)) {
      return {
        detected: true,
        category: 'anxiety',
        title: 'Acute Panic & Anxiety Episode',
        title_rw: "Impungenge zikabije n'igihunga",
        risk: 'medium',
        taskDescription: 'Anxiety Assessment: Review panic triggers and guide diaphragmatic grounding exercises.',
        taskDescription_rw: "Isesengura ry'impungenge: Suzuma imvano y'ubwoba maze umufashe mu myitozo yo guhumeka neza."
      };
    }

    // 3. Depression, Hopelessness & Severe Sorrow
    if (/(hopeless|worthless|empty inside|crying (all day|constantly|every day)|can't get out of bed|no reason to live|depressed|severe depression|kwiheba|agahinda gakabije|nta byiringiro|ndumva ntacyo maze|kurira buri munsi|umubabaro mwinshi)/i.test(t)) {
      return {
        detected: true,
        category: 'depression',
        title: 'Depressive State & Hopelessness',
        title_rw: 'Agahinda gakabije no kwiheba',
        risk: 'medium',
        taskDescription: 'Depression Protocol: Evaluate depressive symptoms, assess safety, and schedule clinical check-in.',
        taskDescription_rw: "Gukurikirana agahinda: Suzuma imiterere y'akababaro maze umushyirireho gahunda yo kuganira."
      };
    }

    // 4. Insomnia & Severe Sleep Disruption
    if (/(insomnia|cannot sleep|can't sleep|haven't slept|sleeping problem|chronic nightmare|night terrors|awake all night|ibitotsi|sinzira|gusinzira|sinsinzira|kudasinzira)/i.test(t)) {
      return {
        detected: true,
        category: 'insomnia',
        title: 'Sleep Disruption & Insomnia',
        title_rw: "Kubura ibitotsi n'umunaniro",
        risk: 'medium',
        taskDescription: 'Sleep Hygiene Intervention: Assess sleep hygiene, rule out secondary distress, and review bedtime routine.',
        taskDescription_rw: "Gufasha gusinzira: Suzuma ingeso zo kuryama n'impamvu zituma abura ibitotsi."
      };
    }

    // 5. Trauma & Flashbacks
    if (/(trauma|flashback|reliving the|assault|abuse|haunted by|ptsd|horrific memory|ihungabana|ibikomere byo ku mutima|amateka ankurikirana|ibyahise bimbabaza)/i.test(t)) {
      return {
        detected: true,
        category: 'trauma',
        title: 'Trauma Recall & Emotional Shock',
        title_rw: "Ihungabana n'ibikomere byo ku mutima",
        risk: 'medium',
        taskDescription: 'Trauma Evaluation: Check emotional stability, establish grounding anchors, and monitor dissociation.',
        taskDescription_rw: "Kuvura ihungabana: Suzuma ituze ry'umurwayi maze umufashe kwisana umutima."
      };
    }

    // 6. Grief & Loss
    if (/(lost my (mother|father|mom|dad|child|son|daughter|brother|sister|husband|wife|friend)|passed away|grieving|profound grief|mourning|died recently|gupfusha|uwapfuye|umubabaro w'uwapfuye|ikiriyo)/i.test(t)) {
      return {
        detected: true,
        category: 'grief',
        title: 'Acute Grief & Bereavement',
        title_rw: "Agahinda k'umubabaro n'ikiriyo",
        risk: 'medium',
        taskDescription: 'Bereavement Support: Provide empathetic validation, assess coping mechanisms, and offer gentle check-in.',
        taskDescription_rw: "Gufasha mu kababaro: Muhe umwanya wo kurira no gutuza, umufashe kwakira ibyabaye."
      };
    }

    // 7. Acute Burnout & Breakdown
    if (/(overwhelmed|breaking down|breakdown|burnout|can't handle (life|anymore)|at my breaking point|byandenze|kunanirwa kwihangana|guhangayika bikabije|umutwe wanjye ugiye guturika)/i.test(t)) {
      return {
        detected: true,
        category: 'stress',
        title: 'Acute Emotional Exhaustion',
        title_rw: 'Umunaniro ukabije mu bitekerezo',
        risk: 'medium',
        taskDescription: 'De-escalation & Coping Plan: Review daily stressors and develop boundary management strategies.',
        taskDescription_rw: 'Kugabanya umunaniro: Fasha umurwayi kumenya ibimunaniza no kubishyiriraho imbibi.'
      };
    }

    return null;
  };

  const flagIssueAndAssignDoctor = async (
    struggle: ClinicalAssessment,
    userText: string
  ): Promise<{ title: string; doctorName: string; risk: 'low' | 'medium' | 'high'; task: string } | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // 1. Retrieve current patient record
      const { data: patientRow } = await supabase
        .from('patients')
        .select('id, doctor_id, primary_concern')
        .eq('id', user.id)
        .maybeSingle();

      let assignedDoctorId = patientRow?.doctor_id;
      let assignedDoctorName = isRw ? 'Muganga wawe' : 'Assigned Doctor';

      // 2. If no assigned doctor, automatically link with primary available doctor
      if (!assignedDoctorId) {
        const { data: doctors } = await supabase
          .from('profiles')
          .select('id, full_name, specialty')
          .eq('role', 'doctor')
          .limit(1);

        if (doctors && doctors.length > 0) {
          assignedDoctorId = doctors[0].id;
          assignedDoctorName = doctors[0].full_name || 'Dr. Mutesi Alice';
        }
      } else {
        const { data: docProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', assignedDoctorId)
          .maybeSingle();
        if (docProfile?.full_name) {
          assignedDoctorName = docProfile.full_name;
        }
      }

      // 3. Upsert patient profile in patients table
      const concernTitle = `[AI Flagged] ${struggle.title}`;
      await supabase
        .from('patients')
        .upsert({
          id: user.id,
          doctor_id: assignedDoctorId,
          primary_concern: concernTitle,
          self_harm_flag: struggle.risk === 'high',
          status: 'active'
        });

      // 4. Ensure patient caseload record exists for assigned doctor
      if (assignedDoctorId) {
        await supabase
          .from('patient_caseload')
          .upsert({
            patient_id: user.id,
            doctor_id: assignedDoctorId,
            status: 'active'
          }, { onConflict: 'doctor_id,patient_id' });
      }

      // 5. Dispatch task & alert to crisis_events via backend trigger
      const baseUrl = (import.meta.env.VITE_RENDER_BACKEND_URL || 'https://humura-ai-1.onrender.com').replace(/\/$/, '');
      const taskText = isRw ? struggle.taskDescription_rw : struggle.taskDescription;
      
      const triggerPayload = {
        patientId: user.id,
        doctorId: assignedDoctorId,
        type: 'AI_detected',
        lastMsg: `[AI Flagged Struggle: ${struggle.title}] Patient shared: "${userText.slice(0, 160)}". Assigned Task: ${taskText}`,
        location: {
          doctorId: assignedDoctorId,
          doctorName: assignedDoctorName,
          issueCategory: struggle.category,
          riskLevel: struggle.risk,
          clinicalTask: taskText,
          patientExcerpt: userText.slice(0, 200),
          flaggedAt: new Date().toISOString()
        }
      };

      // Call backend trigger with timeout protection
      const triggerCtrl = new AbortController();
      const triggerTimeout = setTimeout(() => triggerCtrl.abort(), 4000);
      try {
        await fetch(`${baseUrl}/api/crisis/trigger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: triggerCtrl.signal,
          body: JSON.stringify(triggerPayload)
        });
      } catch (triggerErr) {
        console.warn('Backend trigger notice:', triggerErr);
      } finally {
        clearTimeout(triggerTimeout);
      }

      // 6. Archive to ai_insights_archive for clinical records
      await supabase
        .from('ai_insights_archive')
        .insert({
          user_id: user.id,
          insight_type: 'clinical_flag',
          summary: struggle.title,
          recommendations: [taskText],
          metadata: {
            doctor_id: assignedDoctorId,
            doctor_name: assignedDoctorName,
            risk_level: struggle.risk,
            category: struggle.category,
            patient_input: userText.slice(0, 300)
          }
        });

      return {
        title: isRw ? struggle.title_rw : struggle.title,
        doctorName: assignedDoctorName,
        risk: struggle.risk,
        task: taskText
      };
    } catch (err) {
      console.error('Error flagging struggle:', err);
      return null;
    }
  };

  const handleSelectQuickMood = async (mood: QuickMood) => {
    setSelectedMood(mood.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('mood_logs').insert({
          user_id: user.id,
          mood: mood.id,
          score: mood.score,
          created_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Mood log error:', err);
    }

    const content = isRw
      ? `Ubu numva nmeze: ${mood.label_rw}`
      : `My current feeling right now is: ${mood.label_en}`;
    await sendMessage(content);
  };

  const sendMessage = async (overrideContent?: string) => {
    const msgContent = overrideContent ?? input;
    if (!msgContent.trim() && !previewImage) return;
    setError(null);

    const userMsg: Message = { 
      role: 'user', 
      content: msgContent, 
      image: previewImage || undefined, 
      timestamp: new Date() 
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setPreviewImage(null);
    setIsLoading(true);

    const controller = new AbortController();
    setAbortController(controller);

    // Detect clinical struggle in background parallel to AI generation
    const detectedStruggle = detectPatientStruggle(userMsg.content);

    // Pre-Analysis Guardrail: Skip strictly non-health questions with gentle redirection
    if (isStrictlyNonHealthQuery(userMsg.content)) {
      setIsLoading(false);
      setAbortController(null);
      const refusalReply = isRw
        ? "Ndi Humura AI, umufasha wihariye w'ubuzima bwo mu mutwe n'imitekerereze mu Rwanda. Nshinzwe gusa gufasha mu bibazo byerekeye ubuzima, umutuzo wo mu mutwe, no kukuyobora ku rubuga rwa Humura AI. Sinshobora gusubiza ibibazo bitajyanye n'ubuzima. Mbwira, waba hari ikibazo cy'ubuzima wifuza ko tuganiraho cyangwa ubufasha ku mikorere ya Humura AI?"
        : "I am Humura AI, dedicated exclusively to mental health, emotional wellness, and your healthcare journey. I cannot assist with non-health topics like coding, homework, or general trivia. How are you feeling today, or is there a health concern or question about navigating Humura AI that I can help you with?";

      addAIMessage(refusalReply, newMessages, null);
      return;
    }

    try {
      const baseUrl = (import.meta.env.VITE_RENDER_BACKEND_URL || 'https://humura-ai-1.onrender.com').replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: userMsg.content,
          image: userMsg.image,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          lang: i18n.language,
          userId: (await supabase.auth.getSession()).data.session?.user?.id
        })
      });

      if (!response.ok) throw new Error('Backend offline');
      const data = await response.json();
      if (data.reply && data.reply.includes('usage limit')) {
        throw new Error('Backend rate limited');
      }

      let flagInfo: any = null;
      if (detectedStruggle) {
        flagInfo = await flagIssueAndAssignDoctor(detectedStruggle, userMsg.content);
      }

      addAIMessage(data.reply, newMessages, flagInfo);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error('No API Key');

        const fallbackRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: HUMURA_SYSTEM_PROMPT(i18n.language) }]
              },
              contents: (() => {
                const raw = newMessages.slice(-10).map(m => ({
                  role: m.role === 'model' ? 'model' : 'user',
                  parts: [{ text: m.content || '...' }]
                }));
                const deduped = raw.filter((msg, i) => i === 0 || msg.role !== raw[i - 1].role);
                const startUser = deduped[0]?.role === 'user' ? deduped : deduped.slice(1);
                return startUser.length ? startUser : [{ role: 'user', parts: [{ text: userMsg.content }] }];
              })()
            })
          }
        );

        if (!fallbackRes.ok) {
          const errorData = await fallbackRes.json().catch(() => ({}));
          throw new Error(`Gemini error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await fallbackRes.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

        let flagInfo: any = null;
        if (detectedStruggle) {
          flagInfo = await flagIssueAndAssignDoctor(detectedStruggle, userMsg.content);
        }

        addAIMessage(
          reply || (isRw ? "Ndi hano kugutega amatwi. Komeza unsangize." : "I am here with you. Please tell me more."),
          newMessages,
          flagInfo
        );
      } catch (fe: any) {
        if (fe.name !== 'AbortError') {
          const isQuota = fe.message?.includes('429') || fe.message?.includes('rate limited');
          if (isQuota) {
            setError(isRw ? "Wageze ku mupaka wa buri munsi (Quota). Gerageza nyuma y'isaha 1." : "You've reached the usage limit. Please try again shortly.");
          } else {
            setError(isRw ? `Ibibazo by'itumanaho: ${fe.message}` : `Connection notice: ${fe.message}`);
          }
        }
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleSend = () => editingId !== null ? saveEdit() : sendMessage();
  const stopGeneration = () => { abortController?.abort(); setAbortController(null); setIsLoading(false); };
  const deleteMessage = (idx: number) => { const u = messages.filter((_, i) => i !== idx); setMessages(u); saveHistory(u); };
  const startEdit = (idx: number) => { setEditingId(idx); setInput(messages[idx].content); };
  
  const saveEdit = () => {
    if (editingId === null) return;
    const u = [...messages];
    u[editingId] = { ...u[editingId], content: input, timestamp: new Date() };
    setMessages(u); saveHistory(u); setEditingId(null); setInput('');
  };

  const addAIMessage = (content: string, currentMsgs: Message[], clinicalFlag?: any) => {
    const final = [
      ...currentMsgs, 
      { 
        role: 'model' as const, 
        content, 
        timestamp: new Date(),
        clinicalFlag: clinicalFlag || undefined
      }
    ];
    setMessages(final); 
    saveHistory(final);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = e => audioChunksRef.current.push(e.data);
      recorder.onstop = () => { 
        setInput(isRw ? "[Ubutumwa bw'ijwi]" : "[Voice Message]"); 
        stream.getTracks().forEach(t => t.stop()); 
      };
      recorder.start();
      setIsRecording(true);
    } catch { }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const initials = profile?.full_name ? profile.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'U';

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F8F6] text-[#08352A] font-poppins">

      {/* ── STICKY TOP HEADER ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#DFEBE5] px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/patient/dashboard')}
              className="p-1.5 -ml-1 text-[#5E8E81] hover:text-[#08352A] rounded-xl hover:bg-[#F4F8F6] transition-colors"
              title="Back to Dashboard"
            >
              <ChevronLeft size={22} />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#08352A] flex items-center justify-center text-white font-black text-xs shadow-xs">
                H
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-extrabold text-[#08352A] leading-tight">
                  Humura AI Companion
                </h1>
                <p className="text-[10px] font-semibold text-[#21B48D] flex items-center gap-1.5 leading-none mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#21B48D] animate-pulse" />
                  <span>24/7 AI CBT · Confidential</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Pill Switcher */}
            <div className="flex items-center bg-[#F4F8F6] border border-[#DCEBE3] rounded-full p-0.5">
              {['en', 'rw'].map(lang => (
                <button
                  key={lang}
                  onClick={() => i18n.changeLanguage(lang)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                    i18n.language?.startsWith(lang)
                      ? 'bg-[#08352A] text-white shadow-xs'
                      : 'text-[#5E8E81] hover:text-[#08352A]'
                  }`}
                >
                  {lang === 'en' ? 'EN' : 'RW'}
                </button>
              ))}
            </div>

            {/* Clear History Button */}
            <button
              onClick={() => {
                setMessages([]);
                localStorage.removeItem('humura_chat_history_v6');
                loadHistory();
                setSelectedMood(null);
              }}
              className="p-2 text-[#8DB4A8] hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
              title={isRw ? 'Siba ibiganiro byose' : 'Clear chat history'}
            >
              <Trash2 size={16} />
            </button>
          </div>

        </div>
      </div>

      {/* ── HOTLINE 114 CRISIS CALLOUT BANNER ── */}
      <div className="bg-[#EBF7F2] border-b border-[#D4EDE1] px-4 py-2 text-center text-[11px] font-semibold text-[#185343] flex items-center justify-center gap-2">
        <PhoneCall size={13} className="text-[#21B48D]" />
        <span>
          {isRw
            ? 'Ukeneye ubutabazi bwihuse? Hamagara umurongo utishyurwa: 114 (Rwanda National Mental Health Hotline)'
            : 'In immediate distress? Call Rwanda Toll-Free 114 anytime for emergency clinical support.'}
        </span>
      </div>

      {/* ── CHAT MESSAGES BODY ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto space-y-5">

          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                {!isUser ? (
                  <div className="w-8 h-8 rounded-xl bg-[#08352A] flex-shrink-0 flex items-center justify-center text-xs font-black text-white shadow-xs mt-1">
                    H
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-[#21B48D] flex-shrink-0 flex items-center justify-center text-xs font-black text-white shadow-xs mt-1">
                    {initials}
                  </div>
                )}

                <div className={`flex flex-col max-w-[85%] sm:max-w-[75%]`}>
                  <div
                    className={`p-4 sm:p-5 rounded-3xl text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#08352A] text-white rounded-tr-xs shadow-xs'
                        : 'bg-white border border-[#DFEBE5] text-[#08352A] rounded-tl-xs shadow-xs'
                    }`}
                  >
                    {msg.image && (
                      <img src={msg.image} className="w-full rounded-2xl mb-3 object-cover max-h-60" />
                    )}
                    <p className="font-normal whitespace-pre-wrap">{msg.content}</p>

                    {/* Care Coordination & Flagged Struggle Indicator */}
                    {msg.clinicalFlag && (
                      <div className="mt-3.5 p-3 rounded-2xl bg-[#EAF5F0] border border-[#CDE5DA] flex items-start gap-2.5">
                        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                          msg.clinicalFlag.risk === 'high' 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-[#08352A] text-[#21B48D]'
                        }`}>
                          <ShieldAlert size={14} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-[#08352A] uppercase tracking-wider">
                              {isRw ? "Ubufasha bw'ubuvuzi" : 'Care Coordination'}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              msg.clinicalFlag.risk === 'high'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {msg.clinicalFlag.risk === 'high' ? (isRw ? 'Byihutirwa' : 'High Priority') : (isRw ? 'Gukurikiranwa' : 'Active Care')}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-[#08352A] mt-1">
                            {isRw
                              ? `Iki kibazo (${msg.clinicalFlag.title}) cyanditswe kandi kishyikirijwe muganga wawe (${msg.clinicalFlag.doctorName || 'Muganga'}) kugira ngo agukurikirane.`
                              : `This struggle (${msg.clinicalFlag.title}) has been flagged and assigned to ${msg.clinicalFlag.doctorName || 'your assigned doctor'} for follow-up.`}
                          </p>
                          <p className="text-[11px] text-[#4F776B] mt-0.5">
                            {isRw
                              ? 'Muganga wawe yakiriye ubu butumwa mu itsinda ry\'ubuvuzi mu ibanga.'
                              : 'Your care specialist has been briefed so you receive continuous, personalized support.'}
                          </p>
                        </div>
                      </div>
                    )}

                    <p
                      className={`text-[10px] font-semibold mt-2.5 ${
                        isUser ? 'text-white/60 text-right' : 'text-[#8DB4A8]'
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Message Action Utilities */}
                  <div className={`flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'flex-row-reverse' : ''}`}>
                    {isUser && (
                      <button
                        onClick={() => startEdit(idx)}
                        className="text-[10px] font-bold text-[#5E8E81] hover:text-[#08352A] flex items-center gap-1 uppercase"
                      >
                        <Edit2 size={10} /> Edit
                      </button>
                    )}
                    <button
                      onClick={() => copyToClipboard(msg.content, idx)}
                      className="text-[10px] font-bold text-[#5E8E81] hover:text-[#21B48D] flex items-center gap-1 uppercase"
                    >
                      <Copy size={10} /> {copiedIdx === idx ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={() => deleteMessage(idx)}
                      className="text-[10px] font-bold text-[#5E8E81] hover:text-red-500 flex items-center gap-1 uppercase"
                    >
                      <Trash2 size={10} /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* ── QUICK MOOD PILL SELECTORS (LUCIDE ICONS INSTEAD OF EMOJIS) ── */}
          {messages.length === 1 && !selectedMood && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 ml-11 mt-4"
            >
              <p className="text-xs font-bold text-[#5E8E81] uppercase tracking-wider">
                {isRw ? 'Hitamo uko umerewe muri uyu mwanya:' : 'Check in: how are you feeling right now?'}
              </p>

              <div className="flex flex-wrap gap-2.5">
                {QUICK_MOODS.map(mood => {
                  const Icon = mood.icon;
                  return (
                    <button
                      key={mood.id}
                      onClick={() => handleSelectQuickMood(mood)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs ${mood.bgClass} ${mood.borderClass}`}
                    >
                      <Icon size={16} className={mood.colorClass} />
                      <span className={mood.colorClass}>{isRw ? mood.label_rw : mood.label_en}</span>
                    </button>
                  );
                })}
              </div>

              {/* Affirmation Card */}
              <div className="p-4 rounded-3xl bg-white border border-[#DFEBE5] shadow-xs max-w-lg">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#21B48D] mb-1">
                  {isRw ? 'Ijambo ry’Uyu Munsi' : 'Daily Grounding Affirmation'}
                </p>
                <p className="text-xs sm:text-sm italic text-[#08352A] leading-relaxed">
                  "{affirmation}"
                </p>
              </div>
            </motion.div>
          )}

          {isLoading && (
            <div className="flex items-center gap-3 ml-11 text-[#5E8E81]">
              <Loader2 size={16} className="animate-spin text-[#21B48D]" />
              <p className="text-xs font-bold text-[#21B48D]">
                {isRw ? 'Humura AI iri gutegura ubufasha...' : 'Humura AI is responding thoughtfully...'}
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── BOTTOM INPUT CAPSULE BAR ── */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-[#DFEBE5] px-4 py-3.5 shadow-xs">
        <div className="max-w-3xl mx-auto">
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-1.5 mb-2.5">
              <p className="text-red-500 text-xs font-bold flex items-center gap-1.5">
                <AlertCircle size={13} /> {error}
              </p>
              <button
                onClick={handleSend}
                className="text-xs font-bold text-[#08352A] hover:text-[#21B48D] flex items-center gap-1 uppercase hover:underline"
              >
                <RefreshCcw size={11} /> {isRw ? 'Ongera ugerageze' : 'Try Again'}
              </button>
            </motion.div>
          )}

          {/* Input Capsule Bar */}
          <div className="flex items-center gap-2 bg-[#F4F8F6] border border-[#DCEBE3] rounded-full p-1.5 relative shadow-xs focus-within:border-[#21B48D] focus-within:ring-2 focus-within:ring-[#21B48D]/20 transition-all">
            {previewImage && (
              <div className="absolute -top-16 left-4 p-2 bg-white border border-[#DFEBE5] rounded-2xl shadow-xl flex items-center gap-2">
                <img src={previewImage} className="w-10 h-10 rounded-xl object-cover" />
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1 bg-red-50 text-red-500 rounded-full"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-[#5E8E81] hover:text-[#08352A] transition-colors rounded-full"
              title="Upload image"
            >
              <ImagePlus size={18} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const r = new FileReader();
                  r.onloadend = () => setPreviewImage(r.result as string);
                  r.readAsDataURL(file);
                }
              }}
            />

            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={isRw ? 'Andika icyo utekereza cyangwa uko umeze...' : 'Share what is on your mind with Humura AI...'}
              className="flex-1 px-2 py-2.5 bg-transparent outline-none text-xs sm:text-sm font-medium text-[#08352A] placeholder-[#8DB4A8]"
            />

            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2.5 rounded-full transition-all ${
                isRecording ? 'text-red-500 animate-pulse bg-red-50' : 'text-[#5E8E81] hover:text-[#08352A]'
              }`}
              title="Voice recording"
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {isLoading ? (
              <button
                onClick={stopGeneration}
                className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-100 transition-all cursor-pointer"
                title="Stop generation"
              >
                <Square size={13} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() && !previewImage}
                className="w-10 h-10 bg-[#08352A] hover:bg-[#154E3F] text-white rounded-full flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:grayscale cursor-pointer flex-shrink-0"
                title="Send message"
              >
                {editingId !== null ? <CheckCircle size={17} /> : <SendHorizontal size={17} />}
              </button>
            )}
          </div>

          <p className="mt-2 text-center text-[10px] text-[#78A99B] font-medium">
            {isRw
              ? 'Humura AI igufasha gukora imyitozo ya CBT. Ntisimbura umuganga. Mu kaga, hamagara 114.'
              : 'Humura AI provides supportive CBT guidance. Does not replace professional clinical evaluation. Hotline: 114.'}
          </p>
        </div>
      </div>

    </div>
  );
}
