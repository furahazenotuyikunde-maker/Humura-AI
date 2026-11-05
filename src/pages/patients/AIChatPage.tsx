import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SendHorizontal, AlertCircle, Loader2, Mic, MicOff,
  ImagePlus, Square, Edit2, X, Trash2,
  CheckCircle, RefreshCcw, ChevronLeft, PhoneCall,
  Smile, Sparkles, HeartHandshake, Wind, Sun, Activity, Copy,
  ShieldAlert, Stethoscope, ArrowRight, BarChart3, BookOpen,
  MapPin, Hand, Languages, Target
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
  actionIds?: ChatActionId[];
  clinicalShare?: {
    title: string;
    risk: 'low' | 'medium' | 'high';
    task: string;
    excerpt: string;
    status: 'pending' | 'sending' | 'sent' | 'dismissed' | 'error';
    statusMessage?: string;
  };
}

type ChatActionId =
  | 'breathing'
  | 'progress'
  | 'insights'
  | 'goal'
  | 'education'
  | 'professionals'
  | 'directory'
  | 'sign-language'
  | 'braille'
  | 'translator'
  | 'continue';

interface WellbeingContext {
  moods: { mood: string; score: number | null; createdAt: string }[];
  completedLessons: number;
  goals: string[];
}

const CHAT_ACTIONS: Record<ChatActionId, { title: string; description: string; path: string; icon: React.ComponentType<{ size?: number }> }> = {
  breathing: { title: 'Take a breathing break', description: 'A short guided pause to help you reset.', path: '/patient/chat', icon: Wind },
  progress: { title: 'View my progress', description: 'See your check-ins and wellbeing activity.', path: '/patient/progress', icon: BarChart3 },
  insights: { title: 'Explore AI insights', description: 'Review gentle reflections on your recent check-ins.', path: '/patient/progress#insights-heading', icon: Sparkles },
  goal: { title: 'Set a wellbeing goal', description: 'Choose a small step that feels right for you.', path: '/patient/progress#goals-heading', icon: Target },
  education: { title: 'Explore wellbeing resources', description: 'Find learning and practical wellbeing exercises.', path: '/patient/education', icon: BookOpen },
  professionals: { title: 'Find a professional', description: 'Explore options for additional human support.', path: '/patient/professionals', icon: HeartHandshake },
  directory: { title: 'Explore support services', description: 'Find care and support services in your area.', path: '/patient/centers', icon: MapPin },
  'sign-language': { title: 'Open sign language support', description: 'Explore accessible communication resources.', path: '/patient/sign-language', icon: Hand },
  braille: { title: 'Open Braille Generator', description: 'Convert text with Humura AI’s Braille tool.', path: '/patient/braille', icon: BookOpen },
  translator: { title: 'Open Translator', description: 'Get help with language access.', path: '/patient/translator', icon: Languages },
  continue: { title: 'Continue talking', description: 'Share more whenever you feel ready.', path: '/patient/chat', icon: HeartHandshake }
};

const getRecommendedActions = (text: string): ChatActionId[] => {
  const content = text.toLowerCase();
  const actions: ChatActionId[] = [];

  if (/(suicid|kill (my)?self|want to die|don't want to live|end my life|self.?harm|kwiyahura|nshaka gupfa|sinshaka kubaho)/i.test(content)) {
    return ['professionals', 'directory', 'continue'];
  }
  if (/(sign language|deaf|hard of hearing|amarenga|utumva)/i.test(content)) actions.push('sign-language');
  if (/(braille|blind|visually impair|impumyi)/i.test(content)) actions.push('braille');
  if (/(translate|translator|language|kinyarwanda|english|ururimi|gusemura)/i.test(content)) actions.push('translator');
  if (/(professional|therapist|counsel|doctor|someone to talk|muganga|inzobere)/i.test(content)) actions.push('professionals');
  if (/(support service|nearby|clinic|center|directory|service|serivisi|ivuriro)/i.test(content)) actions.push('directory');
  if (/(progress|pattern|trend|check.?in|goal|journey|insight|iterambere|intego)/i.test(content)) {
    actions.push('progress', 'insights', 'goal');
  }
  if (/(stress|anxious|anxiety|panic|overwhelm|calm|breath|tension|stressed|impungenge|ubwoba)/i.test(content)) {
    actions.push('breathing', 'education', 'continue');
  }
  if (/(learn|understand|resource|education|read about|amakuru|kwiga)/i.test(content)) actions.push('education');
  if (!actions.length) actions.push('continue', 'breathing', 'professionals');
  return [...new Set(actions)].slice(0, 3);
};

interface QuickMood {
  id: string;
  emoji: string;
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
    id: 'happy',
    emoji: '😊',
    icon: Wind,
    label_en: 'Great',
    label_rw: 'Neza cyane',
    score: 5,
    colorClass: 'text-[#D97706]',
    bgClass: 'bg-[#FEF8E7]',
    borderClass: 'border-[#FCE9B6]'
  },
  {
    id: 'calm',
    emoji: '🙂',
    icon: Smile,
    label_en: 'Good',
    label_rw: 'Neza',
    score: 4,
    colorClass: 'text-[#2563EB]',
    bgClass: 'bg-[#EFF6FF]',
    borderClass: 'border-[#D6E7FF]'
  },
  {
    id: 'neutral',
    emoji: '😐',
    icon: Activity,
    label_en: 'Okay',
    label_rw: 'Bisanzwe',
    score: 3,
    colorClass: 'text-[#6B7280]',
    bgClass: 'bg-[#F8F9FA]',
    borderClass: 'border-[#E5E7EB]'
  },
  {
    id: 'sad',
    emoji: '😔',
    icon: HeartHandshake,
    label_en: 'Low',
    label_rw: 'Nabi',
    score: 2,
    colorClass: 'text-[#7C3AED]',
    bgClass: 'bg-[#F5F2FF]',
    borderClass: 'border-[#E4DCFB]'
  },
  {
    id: 'anxious',
    emoji: '😟',
    icon: Sun,
    label_en: 'Stressed',
    label_rw: 'Impungenge',
    score: 2,
    colorClass: 'text-[#CA8A04]',
    bgClass: 'bg-[#FEFCE8]',
    borderClass: 'border-[#FEF08A]'
  }
];

const moodNameFromEmoji = (emoji: string | null, score: number | null) => {
  if (emoji === '😊' || emoji === '😁') return 'happy';
  if (emoji === '🙂') return 'calm';
  if (emoji === '😐') return 'neutral';
  if (emoji === '😔') return 'sad';
  if (emoji === '😟') return 'anxious';
  if (score === null) return 'unreported';
  return score >= 5 ? 'happy' : score >= 4 ? 'calm' : score >= 3 ? 'neutral' : 'sad';
};

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
- For severe distress, suicidal ideation, or crisis, immediately provide the Rwanda 114 hotline.

### CONNECTED WELLBEING COMPANION:
- Listen first; acknowledge the person's feelings without judgment, then ask one gentle open question when helpful.
- Offer CBT-informed reflection as an invitation, not a diagnosis: help separate a situation, thought, feeling, and possible next step.
- Suggest one or two practical next steps relevant to what the person shared. Use Humura AI features when relevant: /patient/progress, /patient/education, /patient/professionals, /patient/centers, /patient/sign-language, /patient/braille, and /patient/translator.
- If authorized wellbeing context is provided, use only that summary. Describe patterns as tentative (for example, "your recent check-ins suggest") and never infer a diagnosis. Do not ask for or reveal private journal entries.
- A mood check-in is optional. Respect a skip or refusal without repeatedly asking.
- You are an AI companion, not a replacement for a qualified professional. Do not claim to contact emergency services or a clinician. Never promise that a clinician has received an alert unless the platform confirms it.
- If there may be immediate danger, respond calmly, ask whether the person is in immediate danger when appropriate, encourage reaching a trusted person and local emergency support, and clearly show Rwanda hotline 114 / emergency 112. Never claim help has been dispatched.`;
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
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const [useWellbeingContext, setUseWellbeingContext] = useState(false);
  const [wellbeingContext, setWellbeingContext] = useState<WellbeingContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [moodSaveError, setMoodSaveError] = useState<string | null>(null);
  const [checkInSkipped, setCheckInSkipped] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHistory();
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) {
        console.error('Unable to load chat profile:', error);
        return;
      }
      if (user) {
        setChatUserId(user.id);
        try {
          setUseWellbeingContext(localStorage.getItem(`humura-chat-context-${user.id}`) === 'true');
        } catch (storageError) {
          console.warn('Chat personalization preference could not be loaded:', storageError);
        }
        supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
          .then(({ data }) => setProfile(data));
      }
    }).catch((error: unknown) => console.error('Unable to load chat profile:', error));

    // Check if coming from dashboard thought bar with prefilled thought
    const prefilled = sessionStorage.getItem('humura_prefilled_prompt');
    const prefilledFormat = sessionStorage.getItem('humura_prefilled_prompt_format');
    if (prefilled) {
      sessionStorage.removeItem('humura_prefilled_prompt');
      sessionStorage.removeItem('humura_prefilled_prompt_format');
      setTimeout(() => {
        sendMessage(prefilled, prefilledFormat === 'braille');
      }, 300);
    } else {
      sessionStorage.removeItem('humura_prefilled_prompt_format');
    }
  }, []);

  useEffect(() => {
    if (!chatUserId || !useWellbeingContext) {
      setWellbeingContext(null);
      return;
    }

    let active = true;
    const loadWellbeingContext = async () => {
      setContextLoading(true);
      try {
        let moodRows: any[] = [];
        const currentSchema = await supabase
          .from('mood_logs')
          .select('mood, score, created_at')
          .eq('user_id', chatUserId)
          .order('created_at', { ascending: false })
          .limit(7);

        if (!currentSchema.error) {
          moodRows = currentSchema.data || [];
        } else {
          const clinicalSchema = await supabase
            .from('mood_logs')
            .select('emoji, mood_score, logged_at')
            .eq('patient_id', chatUserId)
            .order('logged_at', { ascending: false })
            .limit(7);
          if (clinicalSchema.error) {
            console.warn('Mood context is unavailable:', clinicalSchema.error.message);
          } else {
            moodRows = (clinicalSchema.data || []).map((row: any) => ({
              mood: moodNameFromEmoji(row.emoji, row.mood_score),
              score: row.mood_score,
              created_at: row.logged_at
            }));
          }
        }

        const lessonsResult = await supabase
          .from('user_progress')
          .select('lesson_id')
          .eq('user_id', chatUserId)
          .limit(100);
        if (lessonsResult.error) {
          console.warn('Learning activity context is unavailable:', lessonsResult.error.message);
        }

        let goals: string[] = [];
        try {
          const savedGoals = localStorage.getItem(`humura-wellbeing-goals-${chatUserId}`);
          const parsedGoals: unknown = savedGoals ? JSON.parse(savedGoals) : [];
          if (Array.isArray(parsedGoals)) {
            goals = parsedGoals
              .filter((goal): goal is { title: string; progress: number; target: number } =>
                typeof goal?.title === 'string' &&
                typeof goal.progress === 'number' &&
                typeof goal.target === 'number' &&
                goal.progress < goal.target
              )
              .slice(0, 5)
              .map(goal => goal.title.slice(0, 100));
          }
        } catch (error) {
          console.warn('Personal wellbeing goals are unavailable:', error);
        }

        if (!active) return;
        setWellbeingContext({
          moods: moodRows.map((row: any) => ({
            mood: typeof row.mood === 'string' ? row.mood : 'unreported',
            score: typeof row.score === 'number' ? row.score : null,
            createdAt: row.created_at
          })),
          completedLessons: lessonsResult.data?.length || 0,
          goals
        });
      } catch (error) {
        console.error('Unable to load wellbeing context:', error);
        if (active) setWellbeingContext(null);
      } finally {
        if (active) setContextLoading(false);
      }
    };

    void loadWellbeingContext();
    return () => { active = false; };
  }, [chatUserId, useWellbeingContext]);

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

  const handleSelectQuickMood = async (mood: QuickMood) => {
    setMoodSaveError(null);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Mood check-in requires an authenticated patient:', userError);
      setMoodSaveError(isRw ? 'Injira muri konti yawe kugira ngo ubike uko wiyumva.' : 'Please sign in to save your check-in.');
      return;
    }

    const loggedAt = new Date().toISOString();
    let { error } = await supabase.from('mood_logs').insert({
      user_id: user.id,
      mood: mood.id,
      score: mood.score,
      created_at: loggedAt
    });

    if (error) {
      const currentSchemaError = error;
      const fallbackResult = await supabase.from('mood_logs').insert({
        patient_id: user.id,
        mood_score: mood.score,
        emoji: mood.emoji,
        logged_at: loggedAt
      });
      error = fallbackResult.error;
      if (error) console.error('Unable to save mood check-in:', currentSchemaError, error);
    }

    if (error) {
      setMoodSaveError(isRw ? 'Ntibyashobotse kubika uko wiyumva. Gerageza nanone.' : 'Your check-in could not be saved. Please try again.');
      return;
    }

    setSelectedMood(mood.id);
    setCheckInSkipped(true);
    if (useWellbeingContext) {
      setWellbeingContext((current) => ({
        moods: [{ mood: mood.id, score: mood.score, createdAt: loggedAt }, ...(current?.moods || [])].slice(0, 7),
        completedLessons: current?.completedLessons || 0,
        goals: current?.goals || []
      }));
    }
    const content = isRw
      ? `Ubu numva nmeze: ${mood.label_rw}`
      : `My current feeling right now is: ${mood.label_en}`;
    await sendMessage(content);
  };

  const sendMessage = async (overrideContent?: string, enteredInBraille = false) => {
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

    // Pre-Analysis Guardrail: Skip strictly non-health questions with gentle redirection
    if (isStrictlyNonHealthQuery(userMsg.content)) {
      setIsLoading(false);
      setAbortController(null);
      const refusalReply = isRw
        ? "Ndi Humura AI, umufasha wihariye w'ubuzima bwo mu mutwe n'imitekerereze mu Rwanda. Nshinzwe gusa gufasha mu bibazo byerekeye ubuzima, umutuzo wo mu mutwe, no kukuyobora ku rubuga rwa Humura AI. Sinshobora gusubiza ibibazo bitajyanye n'ubuzima. Mbwira, waba hari ikibazo cy'ubuzima wifuza ko tuganiraho cyangwa ubufasha ku mikorere ya Humura AI?"
        : "I am Humura AI, dedicated exclusively to mental health, emotional wellness, and your healthcare journey. I cannot assist with non-health topics like coding, homework, or general trivia. How are you feeling today, or is there a health concern or question about navigating Humura AI that I can help you with?";

      addAIMessage(refusalReply, newMessages, ['continue']);
      return;
    }

    try {
      const baseUrl = (import.meta.env.VITE_RENDER_BACKEND_URL || 'https://humura-ai-1.onrender.com').replace(/\/$/, '');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (useWellbeingContext && !session) {
        throw new Error('Please sign in again before using your progress to personalize chat.');
      }
      const response = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        signal: controller.signal,
        body: JSON.stringify({
          message: userMsg.content,
          image: userMsg.image,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          lang: i18n.language,
          inputFormat: enteredInBraille ? 'braille' : undefined,
          userId: session?.user.id,
          wellbeingContext: useWellbeingContext ? wellbeingContext : undefined
        })
      });

      if (!response.ok) throw new Error('Backend offline');
      const data = await response.json();
      if (data.reply && data.reply.includes('usage limit')) {
        throw new Error('Backend rate limited');
      }

      addAIMessage(data.reply, newMessages);
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
                parts: [{
                  text: `${HUMURA_SYSTEM_PROMPT(i18n.language)}${useWellbeingContext && wellbeingContext
                    ? `\n\n### PATIENT-AUTHORIZED WELLBEING CONTEXT\nUse this brief summary only to personalize this response. It contains no journal or conversation history. Do not repeat sensitive details unnecessarily. Describe any pattern as tentative and do not diagnose.\n${JSON.stringify(wellbeingContext)}`
                    : ''}${enteredInBraille
                    ? '\nThe latest user message was entered in uncontracted English Braille and accurately decoded into plain text. Respond directly to its meaning with supportive health guidance. Do not ask the user to retype or decode it.'
                    : ''}`
                }]
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

        addAIMessage(
          reply || (isRw ? "Ndi hano kugutega amatwi. Komeza unsangize." : "I am here with you. Please tell me more."),
          newMessages
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
  const toggleWellbeingContext = () => {
    const next = !useWellbeingContext;
    if (chatUserId) {
      try {
        localStorage.setItem(`humura-chat-context-${chatUserId}`, String(next));
      } catch (storageError) {
        console.warn('Chat personalization preference could not be saved:', storageError);
      }
    }
    setUseWellbeingContext(next);
  };
  const handleChatAction = (actionId: ChatActionId) => {
    if (actionId === 'breathing') {
      setInput(isRw
        ? 'Nyobora mu myitozo yo guhumeka ituje y’iminota itatu.'
        : 'Please guide me through a gentle three-minute breathing exercise.');
      inputRef.current?.focus();
      return;
    }
    if (actionId === 'continue') {
      inputRef.current?.focus();
      return;
    }
    navigate(CHAT_ACTIONS[actionId].path);
  };
  const deleteMessage = (idx: number) => { const u = messages.filter((_, i) => i !== idx); setMessages(u); saveHistory(u); };
  const startEdit = (idx: number) => { setEditingId(idx); setInput(messages[idx].content); };
  
  const saveEdit = () => {
    if (editingId === null) return;
    const u = [...messages];
    u[editingId] = { ...u[editingId], content: input, timestamp: new Date() };
    setMessages(u); saveHistory(u); setEditingId(null); setInput('');
  };

  const addAIMessage = (content: string, currentMsgs: Message[], actionIds?: ChatActionId[]) => {
    const lastUserMessage = [...currentMsgs].reverse().find(message => message.role === 'user');
    const detectedConcern = lastUserMessage ? detectPatientStruggle(lastUserMessage.content) : null;
    const final = [
      ...currentMsgs, 
      { 
        role: 'model' as const, 
        content, 
        timestamp: new Date(),
        clinicalFlag: undefined,
        actionIds: actionIds || (lastUserMessage ? getRecommendedActions(lastUserMessage.content) : ['continue']),
        clinicalShare: detectedConcern && lastUserMessage ? {
          title: isRw ? detectedConcern.title_rw : detectedConcern.title,
          risk: detectedConcern.risk,
          task: isRw ? detectedConcern.taskDescription_rw : detectedConcern.taskDescription,
          excerpt: lastUserMessage.content.slice(0, 300),
          status: 'pending' as const
        } : undefined
      }
    ];
    setMessages(final); 
    saveHistory(final);
  };

  const updateClinicalShare = (messageIndex: number, patch: Partial<NonNullable<Message['clinicalShare']>>) => {
    setMessages((current) => {
      const updated = current.map((message, index) => index === messageIndex && message.clinicalShare
        ? { ...message, clinicalShare: { ...message.clinicalShare, ...patch } }
        : message);
      saveHistory(updated);
      return updated;
    });
  };

  const shareClinicalConcern = async (messageIndex: number) => {
    const concern = messages[messageIndex]?.clinicalShare;
    if (!concern || concern.status === 'sending' || concern.status === 'sent') return;
    updateClinicalShare(messageIndex, { status: 'sending', statusMessage: undefined });

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Please sign in again before sharing a support request.');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.');

      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('doctor_id')
        .eq('id', user.id)
        .maybeSingle();
      if (patientError) throw patientError;
      let doctorId = patient?.doctor_id;
      if (!doctorId) {
        const { data: caseload, error: caseloadError } = await supabase
          .from('patient_caseload')
          .select('doctor_id')
          .eq('patient_id', user.id)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();
        if (caseloadError) throw caseloadError;
        doctorId = caseload?.doctor_id;
      }
      if (!doctorId) {
        updateClinicalShare(messageIndex, {
          status: 'error',
          statusMessage: isRw
            ? 'Nta nzobere ugenerwa ufite. Ushobora kureba inzobere cyangwa serivisi z’ubutabazi hano hepfo.'
            : 'You do not have an assigned professional yet. You can explore professionals or support services below.'
        });
        return;
      }

      const baseUrl = (import.meta.env.VITE_RENDER_BACKEND_URL || 'https://humura-ai-1.onrender.com').replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/crisis/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          patientId: user.id,
          doctorId,
          type: 'AI_detected',
          consentToShare: true,
          lastMsg: `Patient consented to share this support request: "${concern.excerpt}"`,
          location: {
            issueCategory: concern.title,
            riskLevel: concern.risk,
            clinicalTask: concern.task,
            consentedAt: new Date().toISOString()
          }
        })
      });
      const result = await response.json();
      if (!response.ok || result.success !== true || !result.eventId) {
        throw new Error(result.error || 'The support request could not be recorded.');
      }
      updateClinicalShare(messageIndex, {
        status: 'sent',
        statusMessage: isRw
          ? 'Ubusabe bwawe bwanditswe. Ibi ntibihamya ko inzobere yabubonye. Mu kaga kihutirwa, hamagara 114 cyangwa 112.'
          : 'Your request was recorded. This does not confirm a clinician has seen it. For immediate danger, call 114 or 112.'
      });
    } catch (error) {
      console.error('Unable to share the support request:', error);
      updateClinicalShare(messageIndex, {
        status: 'error',
        statusMessage: isRw
          ? 'Ntibyashobotse kohereza ubusabe. Ushobora gushaka ubufasha hano hepfo cyangwa guhamagara 114 mu kaga kihutirwa.'
          : 'We could not submit the request. You can find support below or call 114 in an emergency.'
      });
    }
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
              <div className="w-10 h-10 rounded-2xl bg-[#08352A] flex items-center justify-center text-white font-black text-xs shadow-xs">
                <Sparkles size={19} className="text-[#9BE0BD]" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-extrabold text-[#08352A] leading-tight">
                  Humura AI
                </h1>
                <p className="text-[10px] font-semibold text-[#5E8E81] flex items-center gap-1.5 leading-none mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#21B48D] animate-pulse" />
                  <span>Your AI-powered wellbeing companion</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {chatUserId && (
              <button
                type="button"
                role="switch"
                aria-checked={useWellbeingContext}
                aria-label={useWellbeingContext ? 'Stop using my progress data in chat' : 'Allow my progress data to personalize chat'}
                title="Only your check-ins, completed lessons, and goals are included. Journal entries are never used."
                onClick={toggleWellbeingContext}
                className={`hidden md:flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold transition-colors md:text-xs ${
                  useWellbeingContext
                    ? 'border-[#B9D9C5] bg-[#EDF7F0] text-[#245F43]'
                    : 'border-[#DCEBE3] bg-white text-[#678173] hover:bg-[#F4F8F6]'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${useWellbeingContext ? 'bg-[#258157]' : 'bg-[#A3B4A8]'}`} />
                Use my progress
              </button>
            )}
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
                setCheckInSkipped(false);
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

                    {/* Legacy flags are shown with an explicit delivery caveat. */}
                    {msg.clinicalFlag && (
                      <div className="mt-3.5 flex items-start gap-2.5 rounded-2xl border border-[#CDE5DA] bg-[#EAF5F0] p-3">
                        <div className="mt-0.5 shrink-0 rounded-lg bg-[#08352A] p-1.5 text-[#21B48D]">
                          <ShieldAlert size={14} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-[10px] font-black uppercase tracking-wider text-[#08352A]">{isRw ? 'Icyitonderwa ku butumwa bwabanje' : 'Previous support notice'}</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-[#4F776B]">
                            {isRw
                              ? `Ikibazo cyamenyekanye (${msg.clinicalFlag.title}), ariko ntidushobora kwemeza ko inzobere yakibonye.`
                              : `A concern was identified (${msg.clinicalFlag.title}), but we cannot confirm a professional has seen it.`}
                          </p>
                        </div>
                      </div>
                    )}

                    {!isUser && msg.clinicalShare && msg.clinicalShare.status !== 'dismissed' && (
                      <div className={`mt-4 rounded-2xl border p-3.5 ${
                        msg.clinicalShare.risk === 'high'
                          ? 'border-[#F1C9C4] bg-[#FFF7F5]'
                          : 'border-[#DDE8D9] bg-[#F7FAF5]'
                      }`}>
                        <div className="flex items-start gap-2.5">
                          <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                            msg.clinicalShare.risk === 'high' ? 'bg-[#F9E4DF] text-[#A4473C]' : 'bg-[#E7F2E8] text-[#39774D]'
                          }`}>
                            {msg.clinicalShare.risk === 'high' ? <ShieldAlert size={16} /> : <Stethoscope size={16} />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#315642]">
                              {isRw ? 'Wifuza gusangiza inzobere yawe?' : 'Would you like to share this with your professional?'}
                            </p>
                            <p className="mt-1 text-[11px] leading-relaxed text-[#667B6D]">
                              {isRw
                                ? 'Uhitamo niba wohereza igice cy’ubutumwa n’impamvu y’ubufasha. Nta butumwa bwoherezwa utabyemeye.'
                                : 'You choose whether to send this message excerpt and support category. Nothing is shared unless you agree.'}
                            </p>
                            <blockquote className="mt-2 rounded-xl border-l-2 border-[#A9C9B2] bg-white/80 px-3 py-2 text-[11px] italic leading-relaxed text-[#536C5A]">
                              “{msg.clinicalShare.excerpt}”
                            </blockquote>
                            {msg.clinicalShare.risk === 'high' && (
                              <p className="mt-2 text-[11px] font-semibold leading-relaxed text-[#8D453D]">
                                {isRw
                                  ? 'Niba uri mu kaga ako kanya, hamagara 114 cyangwa 112 cyangwa wegere umuntu wizeye. Humura AI ntiyahamagaye ubutabazi.'
                                  : 'If you are in immediate danger, call 114 or 112 or reach someone you trust. Humura AI has not contacted emergency services.'}
                              </p>
                            )}
                            {msg.clinicalShare.statusMessage && (
                              <p role={msg.clinicalShare.status === 'error' ? 'alert' : 'status'} className={`mt-2 text-[11px] font-semibold leading-relaxed ${
                                msg.clinicalShare.status === 'error' ? 'text-[#9B3F38]' : 'text-[#426A50]'
                              }`}>
                                {msg.clinicalShare.statusMessage}
                              </p>
                            )}
                            {msg.clinicalShare.status === 'pending' && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => void shareClinicalConcern(idx)}
                                  className="min-h-10 rounded-xl bg-[#176B4B] px-3 py-2 text-[11px] font-bold text-white transition hover:bg-[#12583D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21B48D]"
                                >
                                  {isRw ? 'Yego, sangiza inzobere yanjye' : 'Yes, share with my professional'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateClinicalShare(idx, { status: 'dismissed' })}
                                  className="min-h-10 rounded-xl border border-[#D7E3D9] bg-white px-3 py-2 text-[11px] font-semibold text-[#58705F] transition hover:bg-[#F1F6F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21B48D]"
                                >
                                  {isRw ? 'Oya, si ubu' : 'No, not now'}
                                </button>
                              </div>
                            )}
                            {msg.clinicalShare.status === 'sending' && (
                              <p role="status" className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-[#426A50]">
                                <Loader2 size={13} className="animate-spin" /> {isRw ? 'Turimo kohereza ubusabe…' : 'Submitting your request…'}
                              </p>
                            )}
                            {msg.clinicalShare.status === 'error' && (
                              <button type="button" onClick={() => void navigate('/patient/professionals')} className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#286D4B] underline underline-offset-2">
                                {isRw ? 'Shaka inzobere' : 'Explore professionals'} <ArrowRight size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {!isUser && msg.actionIds?.length ? (
                      <div className="mt-4 rounded-2xl border border-[#DDEBE2] bg-[#F7FAF7] p-3">
                        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#64816E]">
                          <Sparkles size={13} className="text-[#37966B]" />
                          {isRw ? 'Intambwe zikurikira ushobora gutera' : 'Recommended next steps'}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {msg.actionIds.map((actionId) => {
                            const action = CHAT_ACTIONS[actionId];
                            const ActionIcon = action.icon;
                            return (
                              <button
                                key={actionId}
                                type="button"
                                onClick={() => handleChatAction(actionId)}
                                className="group flex items-center gap-2.5 rounded-xl border border-[#E4ECE6] bg-white p-2.5 text-left transition hover:border-[#AFD1BA] hover:bg-[#F1F8F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21B48D]"
                              >
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F4EC] text-[#287A52]">
                                  <ActionIcon size={16} />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[11px] font-bold leading-tight text-[#315642]">{action.title}</span>
                                  <span className="mt-0.5 block text-[10px] leading-snug text-[#7D9082]">{action.description}</span>
                                </span>
                                <ArrowRight size={14} className="shrink-0 text-[#4C8A64] transition-transform group-hover:translate-x-0.5" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

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
          {messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 ml-11 mt-4"
            >
              <div className="rounded-3xl border border-[#DFEBE5] bg-white p-4 shadow-xs sm:p-5">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#329568]" />
                  <p className="text-xs font-bold text-[#315B45]">
                    {isRw ? 'Ndi hano kugutega amatwi. Wahera he?' : 'I’m here to listen. Where would you like to begin?'}
                  </p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(isRw ? [
                    { label: 'Ndifuza kuvuga uko meze', prompt: 'Ndifuza kuganira ku buryo niyumva.' },
                    { label: 'Nshaka kwisuzuma', prompt: 'Wamfasha kwisuzuma uko merewe mu mutwe?' },
                    { label: 'Mfashe gusobanukirwa n’iterambere ryanjye', prompt: 'Mfasha gusobanukirwa n’iterambere ryanjye mu mibereho myiza.' },
                    { label: 'Nyereka igikorwa cyamfasha', prompt: 'Nyereka igikorwa cyoroheje cyamfasha uyu munsi.' },
                    { label: 'Mfashe kubona ubufasha', prompt: 'Mfasha kubona inzobere yo kuganira na yo.' }
                  ] : [
                    { label: 'I want to talk about how I feel', prompt: 'I want to talk about how I feel.' },
                    { label: 'Check in with myself', prompt: 'Can we do a gentle wellbeing check-in?' },
                    { label: 'Help me understand my progress', prompt: 'Help me understand my wellbeing progress.' },
                    { label: 'Suggest a wellness activity', prompt: 'Suggest a gentle wellness activity for me.' },
                    { label: 'Help me find support', prompt: 'Help me find professional support.' }
                  ]).map((prompt) => (
                    <button
                      key={prompt.label}
                      type="button"
                      onClick={() => void sendMessage(prompt.prompt)}
                      className="flex min-h-10 items-center justify-between gap-2 rounded-xl border border-[#E5EEE7] bg-[#FBFDFC] px-3 py-2 text-left text-[11px] font-semibold text-[#45634F] transition hover:border-[#B9D9C5] hover:bg-[#F0F7F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21B48D]"
                    >
                      <span>{prompt.label}</span><ArrowRight size={14} className="shrink-0 text-[#4B8A64]" />
                    </button>
                  ))}
                </div>
              </div>

              {!selectedMood && !checkInSkipped && (
                <div className="rounded-3xl border border-[#DFEBE5] bg-white p-4 shadow-xs sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[#315B45]">
                      {isRw ? 'Umeze ute uyu munsi? (Si ngombwa)' : 'How are you feeling today? (Optional)'}
                    </p>
                    <button type="button" onClick={() => setCheckInSkipped(true)} className="text-[10px] font-semibold text-[#789081] underline-offset-2 hover:underline">
                      {isRw ? 'Simbuka ubu' : 'Skip for now'}
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {QUICK_MOODS.map(mood => {
                      const Icon = mood.icon;
                      return (
                        <button
                          key={mood.id}
                          type="button"
                          onClick={() => void handleSelectQuickMood(mood)}
                          disabled={isLoading || contextLoading}
                          className={`flex min-h-10 items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold shadow-2xs transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21B48D] disabled:cursor-wait disabled:opacity-60 ${mood.bgClass} ${mood.borderClass}`}
                        >
                          <span role="img" aria-label={isRw ? mood.label_rw : mood.label_en}>{mood.emoji}</span>
                          <Icon size={14} className={mood.colorClass} />
                          <span className={mood.colorClass}>{isRw ? mood.label_rw : mood.label_en}</span>
                        </button>
                      );
                    })}
                  </div>
                  {moodSaveError && <p className="mt-2 text-xs font-semibold text-red-700" role="alert">{moodSaveError}</p>}
                </div>
              )}

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
            <div className="ml-11 flex max-w-sm items-center gap-3 rounded-2xl border border-[#DFEBE5] bg-white px-4 py-3 text-[#5E8E81]" role="status" aria-live="polite">
              <Loader2 size={16} className="animate-spin text-[#21B48D]" />
              <p className="text-xs font-semibold text-[#4F7560]">
                {isRw ? 'Humura AI iragutega amatwi...' : 'Humura AI is listening and preparing a thoughtful response…'}
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── BOTTOM INPUT CAPSULE BAR ── */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-[#DFEBE5] px-4 py-3.5 shadow-xs">
        <div className="max-w-3xl mx-auto">
          {chatUserId && (
            <div className="mb-2 flex items-start justify-between gap-3 rounded-xl bg-[#F4F8F5] px-3 py-2 md:hidden">
              <p className="text-[10px] leading-relaxed text-[#6C8373]">
                {useWellbeingContext
                  ? contextLoading
                    ? 'Loading your check-ins and goals…'
                    : 'Personalized context is on. Only your check-ins, completed lessons, and goals are included — never journal entries.'
                  : 'Personalized context is off. Your progress data is not used in chat.'}
              </p>
              <button type="button" onClick={toggleWellbeingContext} role="switch" aria-checked={useWellbeingContext} className="shrink-0 text-[10px] font-bold text-[#286D4B] underline underline-offset-2">
                {useWellbeingContext ? 'Turn off' : 'Use my progress'}
              </button>
            </div>
          )}
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
              ref={inputRef}
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
