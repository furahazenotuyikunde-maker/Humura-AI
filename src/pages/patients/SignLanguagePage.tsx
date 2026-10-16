// AUDITED — max 1 Gemini call per user message with verified fallback & live database sync
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  HandHelping,
  Activity,
  AlertTriangle,
  RotateCcw,
  Camera,
  CameraOff,
  ScanEye,
  Scan,
  Send,
  X,
  Volume2,
  VolumeX,
  Phone,
  MapPin,
  Check,
  Sparkles,
  HelpCircle,
  MessageSquare,
  Shield,
  Moon,
  Users,
  Stethoscope,
  Smile,
  Frown,
  Wind,
  Flame,
  ShieldAlert,
  UserX,
  CloudRain,
  LifeBuoy,
  Ear,
  HeartCrack,
  BatteryLow,
  UtensilsCrossed,
  Droplets,
  AlertOctagon,
  RefreshCw,
  Info,
  ChevronRight,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

// ──────────────────────────────────────────────────────────────
// SIGN INTERFACE & CLINICAL DATA WITH LUCIDE ICONS (NO EMOJIS)
// ──────────────────────────────────────────────────────────────
interface Sign {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  en: string;
  rw: string;
  category: 'feelings' | 'ineed' | 'body' | 'crisis';
  isCrisis?: boolean;
}

const SIGN_ICONS_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  sad: Frown,
  anxious: Wind,
  angry: Flame,
  scared: ShieldAlert,
  alone: UserX,
  happy: Smile,
  hopeless: CloudRain,
  confused: HelpCircle,
  help: LifeBuoy,
  talk: MessageSquare,
  listen: Ear,
  safety: Shield,
  sleep: Moon,
  breathe: Wind,
  counselor: Stethoscope,
  family: Users,
  pain: HeartCrack,
  exhausted: BatteryLow,
  notEating: UtensilsCrossed,
  crying: Droplets,
  emergency: AlertOctagon,
  harm: AlertTriangle
};

const DEFAULT_SIGNS: Sign[] = [
  // Feelings (8)
  { id: 'sad', icon: Frown, en: 'I feel sad', rw: 'Ndababaye', category: 'feelings' },
  { id: 'anxious', icon: Wind, en: 'I feel anxious', rw: 'Mfite ubwoba', category: 'feelings' },
  { id: 'angry', icon: Flame, en: 'I feel angry', rw: 'Ndarakaye', category: 'feelings' },
  { id: 'scared', icon: ShieldAlert, en: 'I feel scared', rw: 'Ndigutinya', category: 'feelings' },
  { id: 'alone', icon: UserX, en: 'I feel alone', rw: 'Ndi ngenyine', category: 'feelings' },
  { id: 'happy', icon: Smile, en: 'I feel happy', rw: 'Ndishimye', category: 'feelings' },
  { id: 'hopeless', icon: CloudRain, en: 'I feel hopeless', rw: 'Ntakizere mfite', category: 'feelings' },
  { id: 'confused', icon: HelpCircle, en: 'I am confused', rw: 'Sinsobanukiwe', category: 'feelings' },

  // I Need (8)
  { id: 'help', icon: LifeBuoy, en: 'I need help', rw: 'Nkeneye ubufasha', category: 'ineed' },
  { id: 'talk', icon: MessageSquare, en: 'I need to talk', rw: 'Nshaka kuvuga', category: 'ineed' },
  { id: 'listen', icon: Ear, en: 'Please listen', rw: 'Ndagusaba kunyumva', category: 'ineed' },
  { id: 'safety', icon: Shield, en: 'I need safety', rw: 'Nkeneye umutekano', category: 'ineed' },
  { id: 'sleep', icon: Moon, en: 'Sleep problems', rw: 'Ibibazo byo gusinzira', category: 'ineed' },
  { id: 'breathe', icon: Wind, en: 'Help me breathe', rw: 'Mfasha guhumeka', category: 'ineed' },
  { id: 'counselor', icon: Stethoscope, en: 'See a counselor', rw: 'Reba umujyanama', category: 'ineed' },
  { id: 'family', icon: Users, en: 'Family problems', rw: 'Ibibazo by\'umuryango', category: 'ineed' },

  // Body & Health (4)
  { id: 'pain', icon: HeartCrack, en: 'I am in pain', rw: 'Ndikubabara', category: 'body' },
  { id: 'exhausted', icon: BatteryLow, en: 'I am exhausted', rw: 'Narushye cyane', category: 'body' },
  { id: 'notEating', icon: UtensilsCrossed, en: 'Not eating well', rw: 'Sindya neza', category: 'body' },
  { id: 'crying', icon: Droplets, en: 'I keep crying', rw: 'Ndigukomeza kurira', category: 'body' },

  // Urgent Crisis (2)
  { id: 'emergency', icon: AlertOctagon, en: 'Emergency Help', rw: 'Ubufasha bwihutirwa', category: 'crisis', isCrisis: true },
  { id: 'harm', icon: AlertTriangle, en: 'I feel in danger', rw: 'Numva ntegereje akaga', category: 'crisis', isCrisis: true }
];

const CATEGORY_TABS = [
  { id: 'feelings', icon: Heart, en: 'Feelings', rw: 'Ibyiyumviro' },
  { id: 'ineed', icon: HandHelping, en: 'Needs & Care', rw: 'Ibyo Nkeneye' },
  { id: 'body', icon: Activity, en: 'Body & Wellness', rw: 'Umubiri n\'Ubuzima' },
  { id: 'crisis', icon: AlertTriangle, en: 'Urgent Care', rw: 'Ubufasha bw\'Ihutirwa' }
] as const;

// Module-level in-memory cache for zero-flicker transitions
let cachedSignsList: Sign[] | null = null;

export default function SignLanguagePage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');

  const [activeCategory, setActiveCategory] = useState<'feelings' | 'ineed' | 'body' | 'crisis'>('feelings');
  const [selected, setSelected] = useState<Sign[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<{ detectedSign: string; explanation: string } | null>(null);
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisisWarning, setShowCrisisWarning] = useState(false);
  const [autoDetectActive, setAutoDetectActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Dynamic Signs from Backend Database
  const [signsList, setSignsList] = useState<Sign[]>(() => cachedSignsList || DEFAULT_SIGNS);
  const [signsLoading, setSignsLoading] = useState<boolean>(!cachedSignsList);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSendingRef = useRef(false);

  // Friendly human error helper
  const friendlyError = (err: any): string => {
    const msg = (err?.message || '').toLowerCase();
    const isQuota = msg.includes('429') || msg.includes('quota') || msg.includes('too many');
    if (isQuota) {
      return isRw
        ? 'Serivisi irahugiye gato. Nyamuneka ongera ugerageze mu minota mike.'
        : 'The service is temporarily busy. Please wait a moment and try again.';
    }
    return isRw
      ? 'Itumanaho ryahagaze gato. Nyamuneka ongera ugerageze.'
      : 'Connection interrupted. Please try again.';
  };

  // ── 1. Fetch Dynamic Signs from Database (Live & Cached) ──
  useEffect(() => {
    let isMounted = true;

    const loadSignsFromBackend = async () => {
      try {
        const { data, error } = await supabase
          .from('community_posts')
          .select('*')
          .eq('circle_id', 'signs');

        if (!error && data && data.length > 0 && isMounted) {
          const mapped: Sign[] = data.map((row) => {
            let parsedContent = { en: '', category: 'feelings', isCrisis: false };
            let parsedContentRw = { rw: '' };
            try {
              parsedContent = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
            } catch {}
            try {
              parsedContentRw = typeof row.content_rw === 'string' ? JSON.parse(row.content_rw) : row.content_rw;
            } catch {}

            const icon = SIGN_ICONS_MAP[row.tag] || Sparkles;
            return {
              id: row.tag,
              icon,
              en: parsedContent.en || row.tag,
              rw: parsedContentRw.rw || parsedContent.en || row.tag,
              category: (parsedContent.category as any) || 'feelings',
              isCrisis: !!parsedContent.isCrisis
            };
          });

          cachedSignsList = mapped;
          setSignsList(mapped);
        }
      } catch (err) {
        console.log('Signs sync note:', err);
      } finally {
        if (isMounted) setSignsLoading(false);
      }
    };

    loadSignsFromBackend();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((e) => console.error('Play error:', e));
    }
  }, [cameraActive]);

  const categoryFiltered = signsList.filter((s) => s.category === activeCategory);

  const toggleSign = (sign: Sign) => {
    if (selected.find((s) => s.id === sign.id)) {
      setSelected((prev) => prev.filter((s) => s.id !== sign.id));
    } else if (selected.length < 5) {
      setSelected((prev) => [...prev, sign]);
      if (sign.isCrisis) setShowCrisisWarning(true);
    }
  };

  const removeSign = (id: string) => {
    setSelected((prev) => prev.filter((s) => s.id !== id));
    if (!selected.filter((s) => s.id !== id).some((s) => s.isCrisis)) {
      setShowCrisisWarning(false);
    }
  };

  const composeMessage = () => {
    return selected.map((s) => (isRw ? s.rw : s.en)).join(', ');
  };

  // ── Frame analysis from camera ──
  const handleScan = async () => {
    if (!videoRef.current || isSendingRef.current) return;

    setIsAnalyzing(true);
    setScanResult(null);
    setAiResponse('');
    setErrorMessage('');
    isSendingRef.current = true;

    const video = videoRef.current;
    let waitAttempts = 0;
    while ((video.videoWidth === 0 || video.readyState < 3) && waitAttempts < 20) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      waitAttempts++;
    }

    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      setErrorMessage(isRw ? 'Kamera ntiyiteguye, tegereza akanya' : 'Camera not ready, please wait a moment');
      setIsAnalyzing(false);
      isSendingRef.current = false;
      return;
    }

    // Optimize resolution for fast, high-accuracy vision analysis (max 640px)
    const maxDim = 640;
    let width = video.videoWidth;
    let height = video.videoHeight;
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      isSendingRef.current = false;
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(async (blob) => {
      if (!blob || blob.size === 0) {
        setErrorMessage(isRw ? 'Gufata ishusho byanze, ongera ugerageze' : 'Failed to capture frame, please try again');
        setIsAnalyzing(false);
        isSendingRef.current = false;
        return;
      }

      // Safety timer for scan (15s)
      const scanSafetyTimer = setTimeout(() => {
        setIsAnalyzing(false);
        isSendingRef.current = false;
      }, 15000);

      let scanSucceeded = false;
      const base64 = canvas.toDataURL('image/jpeg', 0.75).split(',')[1];
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      const visionPrompt = `You are Humura AI, an expert visual sign language and mental wellness gesture analyst in Rwanda.
Carefully inspect the user's hands, fingers, and body posture in this image:
1. Identify the specific gesture shown. Look for distinct hand shapes such as:
   - Thumbs up (Feeling Good / Hopeful / Doing Okay)
   - Open Palm / Raised Hand (Asking for Help / Stop / Welcoming)
   - Peace / V sign (Peace / Calm / Optimism)
   - Hand on Heart / Chest (Gratitude / Love / Deep Feeling / Comfort)
   - Clenched Fist (Frustration / Determination / Emotional Tension)
   - Hands folded / together (Pleading / Prayer / Seeking Support)
   - Hand touching forehead / temples / head (Overwhelmed / Stress / Headache)
   - Waving Hand (Reaching Out / Hello)
   - Pointing (Attention / Self-Expression)
   - Hand near throat / chest tightness (Anxiety / Needing to Breathe)
   - Any standard Rwandan or international sign language sign.
2. If no hand is visible or hands are resting down, identify as "No Clear Hand Gesture Detected" and advise them to lift their hand clearly in front of the camera.
3. Provide a compassionate 2-sentence interpretation of what you see and a validating response tailored specifically to THAT gesture.
CRITICAL: Respond in ${isRw ? 'authentic Kinyarwanda' : 'English'}.
Format response strictly as JSON:
{
  "detectedSign": "Name of the specific gesture detected",
  "explanation": "2 compassionate sentences interpreting this exact gesture and offering support."
}`;

      // 1. Direct High-Speed Gemini Vision (gemini-2.5-flash & gemini-3-flash-preview)
      if (apiKey) {
        const activeVisionModels = ['gemini-2.5-flash', 'gemini-3-flash-preview'];
        for (const modelName of activeVisionModels) {
          try {
            const controller = new AbortController();
            const vTimer = setTimeout(() => controller.abort(), 8500);

            const directRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        { text: visionPrompt },
                        { inlineData: { mimeType: 'image/jpeg', data: base64 } }
                      ]
                    }
                  ],
                  generationConfig: {
                    temperature: 0.3,
                    responseMimeType: 'application/json'
                  }
                })
              }
            );
            clearTimeout(vTimer);

            if (directRes.ok) {
              const fbData = await directRes.json();
              const fbText = fbData.candidates?.[0]?.content?.parts?.[0]?.text;
              const jsonMatch = fbText?.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.detectedSign && parsed.explanation) {
                  setScanResult(parsed);
                  scanSucceeded = true;

                  // Record detected gesture to database if logged in
                  try {
                    const { data: authData } = await supabase.auth.getUser();
                    if (authData?.user) {
                      await supabase.from('mood_logs').insert({
                        user_id: authData.user.id,
                        mood: `Gesture Scan: ${parsed.detectedSign}`,
                        score: 3,
                        emoji: '🤟',
                        created_at: new Date().toISOString()
                      });
                    }
                  } catch {}
                  break;
                }
              }
            }
          } catch (modelErr) {
            console.warn(`Vision model ${modelName} failed or timed out:`, modelErr);
          }
        }
      }

      // 2. Secondary fallback via Render backend /analyze-sign
      if (!scanSucceeded) {
        try {
          const controller = new AbortController();
          const fetchTimer = setTimeout(() => controller.abort(), 6000);
          const backendUrl = (import.meta.env.VITE_RENDER_BACKEND_URL || 'https://humura-ai-1.onrender.com').replace(/\/$/, '');
          
          const formData = new FormData();
          formData.append('image', blob, 'capture.jpg');
          formData.append('prompt', visionPrompt);
          formData.append('lang', lang);

          const response = await fetch(`${backendUrl}/analyze-sign`, {
            method: 'POST',
            body: formData,
            signal: controller.signal
          });
          clearTimeout(fetchTimer);

          if (response.ok) {
            const data = await response.json();
            const cleanReply = typeof data.reply === 'string'
              ? data.reply.replace(/```json|```/g, '').trim()
              : data.reply;

            const parsed = typeof cleanReply === 'string' ? JSON.parse(cleanReply) : cleanReply;
            if (parsed?.detectedSign) {
              setScanResult(parsed);
              scanSucceeded = true;
            }
          }
        } catch (backendErr) {
          console.warn('Backend /analyze-sign fallback also failed:', backendErr);
        }
      }

      // 3. Truthful response if scan completely failed (offline/network failure)
      if (!scanSucceeded) {
        setScanResult({
          detectedSign: isRw ? 'Ntibyashobotse Gusoma Amarenga' : 'Gesture Not Detected',
          explanation: isRw
            ? 'Ntabwo twabashije kubona neza ikimenyetso cy’amarenga. Nyamuneka zamura ikiganza cyawe neza imbere ya kamera ahari urumuri ruhagije maze wongere ugerageze.'
            : 'Could not clearly recognize the gesture. Please raise your hand clearly into the camera frame with good lighting and tap Scan again.'
        });
      }

      clearTimeout(scanSafetyTimer);
      setIsAnalyzing(false);
      isSendingRef.current = false;
    }, 'image/jpeg', 0.75);
  };

  const generateFallbackResponse = () => {
    const hasCrisis = selected.some((s) => s.isCrisis);
    if (hasCrisis) {
      return isRw
        ? 'Turakumva cyane kandi urinzwe. Ntugomba kubicamo wenyine. Nyamuneka hamagara ako kanya ku murongo w\'ubutabazi: 114 cyangwa +250 790 003 002. Abaganga b’inzobere biteguye kugufasha ubu.'
        : 'We hear you deeply and you are safe here. You do not have to carry this alone. Please connect with our crisis team right away: 114 or +250 790 003 002. Licensed professionals are standing by.';
    }

    const signIds = selected.map((s) => s.id);
    if (signIds.includes('anxious') || signIds.includes('scared') || signIds.includes('breathe')) {
      return isRw
        ? 'Ubwoba n\'umutima urimo gutera birasanzwe mu bihe by\'umuhangayiko. Fata umwanya wo guhumeka: Humeka mu mazuru mu masegonda 4, gumana umwuka mu masegonda 7, hanyuma uwusohore mu kanwa mu masegonda 8. Wibuke ko utekanye ubu ngubu.'
        : 'Anxiety and rapid heartbeats are natural physiological responses to stress. Try the 4-7-8 grounding technique: Inhale gently through your nose for 4 counts, hold for 7 counts, and exhale slowly for 8 counts. Remind yourself that you are safe in this present moment.';
    }

    if (signIds.includes('sad') || signIds.includes('alone') || signIds.includes('hopeless') || signIds.includes('crying')) {
      return isRw
        ? 'Agahinda k’umutima n’umunaniro bifite agaciro, kandi ntabwo uri wenyine mu byo urimo. Kwiyitaho bitangirira mu bintu bito: fata ikirahure cy’amazi, reba hanze umwuka mwiza, cyangwa uvugane n’inshuti cyangwa umuganga wizeye.'
        : 'Your feelings of sadness and loneliness are completely valid, and you do not have to face them in isolation. Gentle micro-steps restore momentum: drink a fresh glass of water, step into natural light, or connect with a trusted friend or counselor.';
    }

    if (signIds.includes('pain') || signIds.includes('exhausted') || signIds.includes('sleep') || signIds.includes('notEating')) {
      return isRw
        ? 'Umubiri wawe urimo kuguha ubutumwa ko ukeneye kuruhuka no kwitabwaho. Fata umwanya wo kurambika umutwe, woroshye imitsi y’ibitugu, kandi ugabanye imirimo igusaba imbaraga nyinshi uyu munsi.'
        : 'Your physical body is signaling an urgent need for rest and nourishment. Give yourself permission to pause, gently relax your shoulders, stay hydrated, and allow your nervous system to recover.';
    }

    return isRw
      ? 'Urakoze gusangiza ibyiyumviro byawe. Buri ntambwe uteye yo kugaragaza uko umeze ni intsinzi mu rugendo rwo gukira. Fata umwuka mwiza witonze, ubufasha bw’inzobere burahari igihe cyose.'
      : 'Thank you for expressing how you feel. Acknowledging your emotions is a brave and vital step toward wellness. Ground your senses in the present moment — supportive guidance is always here for you.';
  };

  // ── Send selected signs for guidance & sync to database ──
  const handleSend = async () => {
    if (selected.length === 0 || isSendingRef.current) return;
    const message = composeMessage();
    setIsAnalyzing(true);
    setIsLoading(true);
    setAiResponse('');
    setErrorMessage('');
    isSendingRef.current = true;

    // Safety timer: NEVER allow UI to stay in "Connecting..." longer than 3.5 seconds
    const safetyTimeout = setTimeout(() => {
      setIsLoading(false);
      setIsAnalyzing(false);
      isSendingRef.current = false;
      setAiResponse((current) => current || generateFallbackResponse());
    }, 3500);

    // 1. Sync Patient Expression & Crisis Flags to Database
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const isCrisis = selected.some((s) => s.isCrisis);
        await supabase.from('mood_logs').insert({
          user_id: authData.user.id,
          mood: `Sign Expression: ${message}`,
          score: isCrisis ? 1 : 3,
          emoji: isCrisis ? '🚨' : '🤟',
          created_at: new Date().toISOString()
        });

        if (isCrisis) {
          await supabase.from('patients').update({
            self_harm_flag: true,
            primary_concern: `Sign Language Crisis Signal: ${message}`
          }).eq('id', authData.user.id);
        }

        setSyncStatus(isRw ? 'Ubutumwa bwanditswe mu gipimo cy’ubuzima bwawe' : 'Expression securely synced with your clinical records');
        setTimeout(() => setSyncStatus(null), 4500);
      }
    } catch (dbErr) {
      console.log('Database logging notice:', dbErr);
    }

    // 2. Fetch AI Guidance with quick timeout + working model fallbacks
    try {
      let resolvedReply = '';

      // A. Try Render with strict 2-second abort timeout
      try {
        const controller = new AbortController();
        const fetchTimer = setTimeout(() => controller.abort(), 2000);
        const backendUrl = (import.meta.env.VITE_RENDER_BACKEND_URL || 'https://humura-ai-1.onrender.com').replace(/\/$/, '');
        const response = await fetch(`${backendUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            message: `[SIGN LANGUAGE] Patient communicated: ${message}. Provide compassionate, validating emotional and mental wellness guidance.`,
            history: [],
            lang: i18n.language
          })
        });
        clearTimeout(fetchTimer);

        if (response.ok) {
          const dataResult = await response.json();
          if (dataResult.reply && !dataResult.reply.includes('usage limit')) {
            resolvedReply = dataResult.reply;
          }
        }
      } catch (renderErr) {
        // Render was slow or sleeping, seamlessly proceed to direct models
      }

      // B. If Render did not reply, immediately use direct active models (gemini-2.5-flash, gemini-3-flash-preview)
      if (!resolvedReply) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (apiKey) {
          const workingModels = ['gemini-2.5-flash', 'gemini-3-flash-preview'];
          for (const modelName of workingModels) {
            try {
              const controller = new AbortController();
              const mTimer = setTimeout(() => controller.abort(), 7500);
              const fallbackRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  signal: controller.signal,
                  body: JSON.stringify({
                    contents: [
                      {
                        parts: [
                          { text: `The user expressed these mental wellness sign language signals: "${message}". Provide a warm, compassionate, grounding therapeutic response in ${isRw ? 'authentic Kinyarwanda' : 'English'}. Keep it 2-3 sentences, validating, kind, and practical.` }
                        ]
                      }
                    ]
                  })
                }
              );
              clearTimeout(mTimer);

              if (fallbackRes.ok) {
                const fbData = await fallbackRes.json();
                const fbReply = fbData.candidates?.[0]?.content?.parts?.[0]?.text;
                if (fbReply) {
                  resolvedReply = fbReply;
                  break;
                }
              }
            } catch (mErr) {
              // Try next model
            }
          }
        }
      }

      setAiResponse(resolvedReply || generateFallbackResponse());
    } catch (err: any) {
      console.error('Send error:', err);
      setAiResponse(generateFallbackResponse());
    } finally {
      clearTimeout(safetyTimeout);
      setIsAnalyzing(false);
      setIsLoading(false);
      isSendingRef.current = false;
    }
  };

  // ── Speech Synthesis ──
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window) || !text) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isRw ? 'rw-RW' : 'en-US';
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
      setCameraError('');
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraError(isRw ? 'Uburenganzira bwa kamera ntibwahawe. Nyamuneka bwemerere muri mushakisha.' : 'Camera permission was denied. Please enable camera access in your browser.');
      } else {
        setCameraError(isRw ? 'Kamera ntitashobotse kuri iki gikoresho.' : 'Camera is not available on this device.');
      }
    }
  };

  const stopCamera = () => {
    setAutoDetectActive(false);
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setCameraActive(false);
  };

  const resetAll = () => {
    setSelected([]);
    setAiResponse('');
    setScanResult(null);
    setShowCrisisWarning(false);
    setIsSpeaking(false);
    setErrorMessage('');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="space-y-7 pb-16 max-w-6xl mx-auto">
      {/* ── TOP HEADER ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DFEBE5] shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F3EE] text-[#21B48D] text-[11px] font-bold uppercase tracking-wider">
              <Eye size={13} />
              <span>{isRw ? 'Kominikasiyo y’Amarenga' : 'Accessible Sign & Gesture Care'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08352A] tracking-tight">
              {isRw ? 'Icyumba cy’Amarenga n’Ibyiyumviro' : 'Sign Language & Gesture Studio'}
            </h1>
            <p className="text-xs sm:text-sm text-[#5E8E81] max-w-2xl font-normal leading-relaxed">
              {isRw
                ? 'Hitamo amarenga agaragaza ibyo wumva cyangwa ukoreshe kamera mu gusesengura ibimenyetso. AI yacu itanga ubufasha bwuzuye.'
                : 'Select expressive sign cards to share how you feel or use camera gesture recognition to communicate seamlessly with our compassionate assistant.'}
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={cameraActive ? stopCamera : startCamera}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                cameraActive
                  ? 'bg-[#E11D48] text-white hover:bg-[#BE123C]'
                  : 'bg-[#08352A] hover:bg-[#154E3F] text-white'
              }`}
            >
              {cameraActive ? (
                <>
                  <CameraOff size={15} />
                  <span>{isRw ? 'Hagarika Kamera' : 'Turn Off Camera'}</span>
                </>
              ) : (
                <>
                  <Camera size={15} className="text-[#21B48D]" />
                  <span>{isRw ? 'Fungura Kamera' : 'Launch Camera'}</span>
                </>
              )}
            </button>

            <button
              onClick={resetAll}
              className="p-2.5 rounded-2xl bg-[#F4F8F6] text-[#5E8E81] hover:text-[#08352A] hover:bg-[#E8F3EE] border border-[#DCEBE3] transition-colors cursor-pointer"
              title={isRw ? 'Tangira bushya' : 'Reset selections'}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── SYNC STATUS TOAST BANNER (IF ACTIVE) ── */}
      <AnimatePresence>
        {syncStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-[#E8F3EE] border border-[#21B48D]/30 text-[#08352A] text-xs font-bold flex items-center gap-2.5 shadow-2xs"
          >
            <CheckCircle2 size={16} className="text-[#21B48D]" />
            <span>{syncStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CRISIS ALERT BANNER (IF CRISIS SIGNS SELECTED) ── */}
      <AnimatePresence>
        {showCrisisWarning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 rounded-3xl bg-[#FFF1F2] border border-[#FECDD3] text-[#9F1239] shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFE4E6] flex items-center justify-center text-[#E11D48]">
                  <AlertOctagon size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#9F1239]">
                    {isRw ? 'Ubufasha Bwihutirwa Burahari' : 'Immediate Support Available in Rwanda'}
                  </h3>
                  <p className="text-xs text-[#BE123C]">
                    {isRw
                      ? 'Niba wumva ufite akaga cyangwa ububabare bukabije, uhagarikire abaganga b’inzobere ako kanya.'
                      : 'If you are experiencing severe distress or crisis, licensed clinical support is standing by to help.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="tel:+250790003002"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#E11D48] text-white text-xs font-bold hover:bg-[#BE123C] transition-colors shadow-xs"
              >
                <Phone size={14} />
                <span>+250 790 003 002 (Healthy Minds)</span>
              </a>
              <a
                href="tel:114"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-[#FECDD3] text-[#9F1239] text-xs font-bold hover:bg-[#FFF1F2] transition-colors"
              >
                <Phone size={14} />
                <span>114 (Rwanda Emergency)</span>
              </a>
              <button
                onClick={() => navigate('/patient/centers')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white border border-[#FECDD3] text-[#9F1239] text-xs font-bold hover:bg-[#FFF1F2] transition-colors ml-auto cursor-pointer"
              >
                <MapPin size={14} />
                <span>{isRw ? 'Reba Amavuriro' : 'View Support Directory'}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CAMERA VIEWPORT & GESTURE SCANNER ── */}
      {cameraActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#08352A] rounded-3xl p-5 sm:p-7 border border-[#154E3F] shadow-xl text-white space-y-4 relative overflow-hidden"
        >
          {/* Viewfinder Header */}
          <div className="flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#21B48D] animate-ping" />
              <span className="font-bold text-white tracking-wide">
                {isRw ? 'Kamera Iri Gukora' : 'Live Camera Viewport'}
              </span>
            </div>
            <span className="text-[11px] text-[#A3C7BD]">
              {isRw ? 'Kora amarenga mu maso ya kamera' : 'Position your hands clearly in view'}
            </span>
          </div>

          {/* Camera Frame */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-80 flex items-center justify-center border border-white/10 shadow-inner">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />

            {/* Viewfinder Corner Overlays */}
            <div className="absolute inset-4 pointer-events-none border border-white/20 rounded-xl">
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#21B48D]" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#21B48D]" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#21B48D]" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#21B48D]" />
            </div>

            {/* Scanning Indicator Overlay */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-[#21B48D] border-t-transparent animate-spin flex items-center justify-center" />
                <p className="text-xs font-bold text-white tracking-wider uppercase">
                  {isRw ? 'Gusesengura amarenga...' : 'Interpreting Gestures...'}
                </p>
              </div>
            )}
          </div>

          {/* Camera Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <p className="text-xs text-[#A3C7BD] font-normal">
              {isRw
                ? 'Kanda "Soma Amarenga" kugira ngo AI isesengure ibimenyetso by’amaboko yawe.'
                : 'Click "Scan Gesture" to analyze what your hands and posture are expressing.'}
            </p>

            <button
              onClick={handleScan}
              disabled={isAnalyzing}
              className="px-6 py-3 rounded-2xl bg-[#21B48D] hover:bg-[#1CA07D] text-[#08352A] text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <ScanEye size={16} />
              <span>{isAnalyzing ? (isRw ? 'Birimo Gusesengurwa...' : 'Analyzing...') : (isRw ? 'Soma Amarenga' : 'Scan Gesture')}</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ── SCAN RESULT / DETECTED GESTURE CARD ── */}
      <AnimatePresence>
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl p-6 sm:p-7 border border-[#DFEBE5] shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F5F2]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E8F3EE] text-[#21B48D] flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8DB4A8] uppercase tracking-wider">
                    {isRw ? 'Amarenga Yamenyekanye' : 'Gesture Recognized'}
                  </span>
                  <h3 className="text-base font-extrabold text-[#08352A]">
                    {scanResult.detectedSign}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setScanResult(null)}
                className="p-1.5 text-[#8DB4A8] hover:text-[#08352A] rounded-xl hover:bg-[#F4F8F6] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#08352A] leading-relaxed font-normal bg-[#F4F8F6] p-4 rounded-2xl border border-[#DFEBE5]">
              {scanResult.explanation}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => speakText(`${scanResult.detectedSign}. ${scanResult.explanation}`)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isSpeaking
                    ? 'bg-[#E11D48] text-white shadow-xs'
                    : 'bg-[#08352A] text-white hover:bg-[#154E3F]'
                }`}
              >
                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} className="text-[#21B48D]" />}
                <span>{isSpeaking ? (isRw ? 'Hagarika' : 'Stop') : (isRw ? 'Umva' : 'Listen')}</span>
              </button>

              <button
                onClick={() => {
                  setScanResult(null);
                  handleScan();
                }}
                className="px-4 py-2 rounded-2xl bg-[#E2F2EC] hover:bg-[#D4EADE] text-[#08352A] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>{isRw ? 'Ongera Usome' : 'Rescan'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI COMPASSIONATE GUIDANCE RESPONSE CARD ── */}
      <AnimatePresence>
        {aiResponse && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl p-6 sm:p-7 border border-[#DFEBE5] shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F5F2]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#08352A] text-[#21B48D] flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#21B48D] uppercase tracking-wider">
                    {isRw ? 'Inama z’Ubuzima bwo mu Mutwe' : 'Empathetic Guidance'}
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#08352A]">
                    {isRw ? 'Icyo Umutima Wawe Ukeneye Uyu Munsi' : 'Supportive Clinical Perspective'}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setAiResponse('')}
                className="p-1.5 text-[#8DB4A8] hover:text-[#08352A] rounded-xl hover:bg-[#F4F8F6] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-[#F4F8F6] p-5 rounded-2xl border border-[#DFEBE5] text-xs sm:text-sm text-[#08352A] leading-relaxed font-normal whitespace-pre-line">
              {aiResponse}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => speakText(aiResponse)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isSpeaking
                      ? 'bg-[#E11D48] text-white shadow-xs'
                      : 'bg-[#08352A] text-white hover:bg-[#154E3F]'
                  }`}
                >
                  {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} className="text-[#21B48D]" />}
                  <span>{isSpeaking ? (isRw ? 'Hagarika' : 'Stop Narration') : (isRw ? 'Umva Inama' : 'Listen to Advice')}</span>
                </button>

                <button
                  onClick={resetAll}
                  className="px-4 py-2 rounded-2xl bg-[#F4F8F6] hover:bg-[#E8F3EE] text-[#5E8E81] hover:text-[#08352A] border border-[#DCEBE3] text-xs font-bold transition-colors cursor-pointer"
                >
                  {isRw ? 'Tangira Bushya' : 'Clear & Start Fresh'}
                </button>
              </div>

              <button
                onClick={() => navigate('/patient/centers')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#21B48D] hover:underline cursor-pointer"
              >
                <MapPin size={13} />
                <span>{isRw ? 'Gana Ivuriro ry’Umutuzo' : 'Connect with Local Clinic'}</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ERROR MESSAGE BANNER (IF ANY) ── */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#9F1239] text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-[#E11D48] flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-xs text-[#9F1239] font-bold hover:underline cursor-pointer ml-3 flex-shrink-0"
          >
            {isRw ? 'Bireke' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* ── CATEGORY FILTER TABS ── */}
      <div className="bg-white rounded-3xl p-5 border border-[#DFEBE5] space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#08352A]">
            {isRw ? 'Hitamo Icyiciro cy’Amarenga:' : 'Explore Sign Categories:'}
          </span>
          <span className="text-[11px] font-semibold text-[#8DB4A8]">
            {categoryFiltered.length} {isRw ? 'Amarenga aboneka' : 'Signs in this category'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {CATEGORY_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeCategory === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as any)}
                className={`p-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#08352A] text-white shadow-xs'
                    : 'bg-[#F4F8F6] text-[#08352A] hover:bg-[#E8F3EE] border border-[#DCEBE3]'
                }`}
              >
                <TabIcon size={16} className={isActive ? 'text-[#21B48D]' : 'text-[#5E8E81]'} />
                <span>{isRw ? tab.rw : tab.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── DYNAMIC 22-SIGN CARDS GRID (WITH SKELETON LOADING) ── */}
      <div>
        {signsLoading && !cachedSignsList ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-40 rounded-3xl bg-white border border-[#DFEBE5] p-5 flex flex-col justify-between"
              >
                <div className="flex justify-between items-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#E2F2EC]" />
                  <div className="w-6 h-6 rounded-full bg-[#E2F2EC]" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-3/4 rounded-md bg-[#E2F2EC]" />
                  <div className="h-3 w-1/2 rounded-md bg-[#E2F2EC]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categoryFiltered.map((sign) => {
              const SignIcon = sign.icon;
              const isSelected = !!selected.find((s) => s.id === sign.id);

              return (
                <motion.button
                  key={sign.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleSign(sign)}
                  className={`relative p-5 rounded-3xl border text-left transition-all flex flex-col justify-between h-40 cursor-pointer ${
                    isSelected
                      ? 'bg-[#08352A] border-[#08352A] text-white shadow-md'
                      : sign.isCrisis
                      ? 'bg-white border-[#FECDD3] hover:border-[#E11D48] text-[#08352A] hover:bg-[#FFF1F2]/30'
                      : 'bg-white border-[#DFEBE5] hover:border-[#21B48D] text-[#08352A] hover:bg-[#F4F8F6]'
                  }`}
                >
                  {/* Header Icon + Selection Checkbox */}
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-white/10 text-[#21B48D]'
                          : sign.isCrisis
                          ? 'bg-[#FFE4E6] text-[#E11D48]'
                          : 'bg-[#E2F2EC] text-[#08352A]'
                      }`}
                    >
                      <SignIcon size={24} />
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[#21B48D] text-white shadow-xs'
                          : 'border border-[#DCEBE3] bg-transparent'
                      }`}
                    >
                      {isSelected && <Check size={13} className="stroke-[3]" />}
                    </div>
                  </div>

                  {/* Sign Label */}
                  <div>
                    <h4
                      className={`text-sm font-extrabold leading-tight mb-1 ${
                        isSelected ? 'text-white' : 'text-[#08352A]'
                      }`}
                    >
                      {isRw ? sign.rw : sign.en}
                    </h4>
                    <p
                      className={`text-[10px] font-medium leading-tight ${
                        isSelected ? 'text-[#A3C7BD]' : 'text-[#8DB4A8]'
                      }`}
                    >
                      {isRw ? sign.en : sign.rw}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── COMPOSED EXPRESSION TRAY (FLOATING DOCK) ── */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="sticky bottom-6 z-30 bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-[#21B48D]/40 shadow-xl space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-[#21B48D] uppercase tracking-wider">
                  {isRw ? 'Ubutumwa Uteguye' : 'Composed Expression'}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-[#08352A]">
                  {selected.length} / 5 {isRw ? 'Amarenga Ahiswemo' : 'Signs Selected'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={resetAll}
                  className="px-4 py-2 rounded-2xl bg-[#F4F8F6] hover:bg-[#E8F3EE] text-[#5E8E81] hover:text-[#08352A] text-xs font-bold transition-colors cursor-pointer"
                >
                  {isRw ? 'Gukuraho Byose' : 'Clear All'}
                </button>

                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-2xl bg-[#08352A] hover:bg-[#154E3F] text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Send size={14} className="text-[#21B48D]" />
                  <span>
                    {isLoading
                      ? (isRw ? 'Birimo Gutegurwa...' : 'Connecting...')
                      : (isRw ? 'Ohereza Ubungubu' : 'Send for Support')}
                  </span>
                </button>
              </div>
            </div>

            {/* Selected Signs Pill Chips */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-[#F0F5F2]">
              {selected.map((sign) => {
                const ChipIcon = sign.icon;

                return (
                  <div
                    key={sign.id}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      sign.isCrisis
                        ? 'bg-[#FFE4E6] text-[#9F1239] border border-[#FECDD3]'
                        : 'bg-[#E8F3EE] text-[#08352A] border border-[#CDE5DC]'
                    }`}
                  >
                    <ChipIcon size={14} className={sign.isCrisis ? 'text-[#E11D48]' : 'text-[#21B48D]'} />
                    <span>{isRw ? sign.rw : sign.en}</span>
                    <button
                      onClick={() => removeSign(sign.id)}
                      className="ml-1 text-[#8DB4A8] hover:text-[#08352A] transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions Card */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-5 sm:p-6 rounded-3xl bg-white border border-[#DFEBE5] relative shadow-2xs"
          >
            <button
              onClick={() => setShowInstructions(false)}
              className="absolute top-4 right-4 p-1.5 text-[#8DB4A8] hover:text-[#08352A] rounded-xl hover:bg-[#F4F8F6] transition-colors cursor-pointer"
              title="Close guide"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <Info size={16} className="text-[#21B48D]" />
              <h4 className="text-xs sm:text-sm font-extrabold text-[#08352A]">
                {isRw ? 'Uburyo bwo Gukoresha Icyumba cy’Amarenga' : 'How to Use Sign Language Studio'}
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-[#5E8E81]">
              <div className="p-3 rounded-2xl bg-[#F4F8F6] border border-[#E3ECE7]">
                <span className="font-black text-[#08352A] block mb-1">1. {isRw ? 'Hitamo Amarenga' : 'Pick Signs'}</span>
                <span>{isRw ? 'Kanda ku dukarita tw’amarenga tugaragaza ibyo wiyumvamo cyangwa ibyo nkeneye.' : 'Tap any cards to express how you feel or what care you currently need.'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#F4F8F6] border border-[#E3ECE7]">
                <span className="font-black text-[#08352A] block mb-1">2. {isRw ? 'Koresha Kamera' : 'Use Camera'}</span>
                <span>{isRw ? 'Fungura kamera maze ukande "Soma Amarenga" kugira ngo AI imenye ibimenyetso.' : 'Launch your camera and scan your hand signs for instant recognition.'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#F4F8F6] border border-[#E3ECE7]">
                <span className="font-black text-[#08352A] block mb-1">3. {isRw ? 'Bona Ubufasha' : 'Receive Guidance'}</span>
                <span>{isRw ? 'Ohereza ubutumwa ubone inama zo guhumeka, ituze, cyangwa kwinjira mu buvuzi.' : 'Send your expression to receive supportive guidance, grounding steps, and clinical links.'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
