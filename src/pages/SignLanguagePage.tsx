// AUDITED — max 1 Gemini 3.0 Flash call per user message
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Phone, Send, X, Volume2, VolumeX, RotateCcw, Camera, CameraOff, ScanEye, Loader2, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { addNotification } from '../lib/notifications';

// ──────────────────────────────────────────────────────────────
// 22-SIGN DATA ACROSS 4 CATEGORIES
// ──────────────────────────────────────────────────────────────
interface Sign {
  id: string;
  emoji: string;
  en: string;
  rw: string;
  category: 'feelings' | 'ineed' | 'body' | 'crisis';
  isCrisis?: boolean;
}

const signs: Sign[] = [
  // 💭 Feelings (8)
  { id: 'sad', emoji: '😢', en: 'I feel sad', rw: 'Ndababaye', category: 'feelings' },
  { id: 'anxious', emoji: '😰', en: 'I feel anxious', rw: 'Mfite ubwoba', category: 'feelings' },
  { id: 'angry', emoji: '😠', en: 'I feel angry', rw: 'Ndarakaye', category: 'feelings' },
  { id: 'scared', emoji: '😨', en: 'I feel scared', rw: 'Ndigutinya', category: 'feelings' },
  { id: 'alone', emoji: '🥺', en: 'I feel alone', rw: 'Ndi Ngenyine', category: 'feelings' },
  { id: 'happy', emoji: '😊', en: 'I feel happy', rw: 'Ndishimye', category: 'feelings' },
  { id: 'hopeless', emoji: '😞', en: 'I feel hopeless', rw: 'Ntakizere', category: 'feelings' },
  { id: 'confused', emoji: '😕', en: 'I am confused', rw: 'Sinsobanukiwe', category: 'feelings' },
  // 🙏 I Need (8)
  { id: 'help', emoji: '🆘', en: 'I need help', rw: 'Nkeneye ubufasha', category: 'ineed' },
  { id: 'talk', emoji: '💬', en: 'I need to talk', rw: 'Nshaka kuvuga', category: 'ineed' },
  { id: 'listen', emoji: '👂', en: 'Please listen', rw: 'Ndagusaba ku nyumva', category: 'ineed' },
  { id: 'safety', emoji: '🏠', en: 'I need safety', rw: 'Nkeneye umutekano', category: 'ineed' },
  { id: 'sleep', emoji: '😴', en: 'Sleep problems', rw: 'Ibibazo byo gusinzira', category: 'ineed' },
  { id: 'breathe', emoji: '🌬️', en: 'Help me breathe', rw: 'Mfasha guhumeka', category: 'ineed' },
  { id: 'counselor', emoji: '👨‍⚕️', en: 'See a counselor', rw: 'Reba umujyanama', category: 'ineed' },
  { id: 'family', emoji: '👨‍👩‍👧', en: 'Family problems', rw: 'Ibibazo by\'umuryango', category: 'ineed' },
  // ❤️ Body & Health (4)
  { id: 'pain', emoji: '🤕', en: 'I am in pain', rw: 'Ndikubabara', category: 'body' },
  { id: 'exhausted', emoji: '😓', en: 'I am exhausted', rw: 'Narushye', category: 'body' },
  { id: 'notEating', emoji: '🍽️', en: 'Not eating well', rw: 'Sindya neza', category: 'body' },
  { id: 'crying', emoji: '😭', en: 'I keep crying', rw: 'Ndigukomeza kurira', category: 'body' },
  // 🚨 Crisis (2)
  { id: 'emergency', emoji: '🆘', en: 'EMERGENCY', rw: 'birihutirwa', category: 'crisis', isCrisis: true },
  { id: 'harm', emoji: '🩹', en: 'I want to hurt myself', rw: 'Nshaka kwigirira nabi', category: 'crisis', isCrisis: true },
];

const CATEGORY_CONFIG = {
  feelings: { emoji: '💭', en: 'Feelings', rw: 'ibyiyumviro' },
  ineed: { emoji: '🙏', en: 'I Need', rw: 'Nkeneye' },
  body: { emoji: '❤️', en: 'Body & Health', rw: 'ibijyanye n’umubiri ndetse n’ubuzima' },
  crisis: { emoji: '🚨', en: 'Crisis', rw: 'ubufasha bw’ihutirwa' },
};


const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// ──────────────────────────────────────────────────────────────
// COMPONENT
// ──────────────────────────────────────────────────────────────
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
  const [tierUsed, setTierUsed] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSendingRef = useRef(false);

  useEffect(() => {
    // Cleanup camera strictly when component unmounts to prevent privacy leaks
    return () => {
      if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Fix: Attach stream to video element when it naturally mounts after cameraActive state change
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      // Explicitly call play to bypass browser autoplay restrictions
      videoRef.current.play().catch(e => console.error("Play error:", e));
    }
  }, [cameraActive]);

  const categoryFiltered = signs.filter(s => s.category === activeCategory);

  const toggleSign = (sign: Sign) => {
    if (selected.find(s => s.id === sign.id)) {
      setSelected(prev => prev.filter(s => s.id !== sign.id));
    } else if (selected.length < 5) {
      setSelected(prev => [...prev, sign]);
      if (sign.isCrisis) setShowCrisisWarning(true);
    }
  };

  const removeSign = (id: string) => {
    setSelected(prev => prev.filter(s => s.id !== id));
    if (!selected.filter(s => s.id !== id).some(s => s.isCrisis)) {
      setShowCrisisWarning(false);
    }
  };

  const composeMessage = () => {
    return selected.map(s => isRw ? s.rw : s.en).join(', ');
  };

  const handleScan = async () => {
    if (!videoRef.current || isSendingRef.current) return;
    
    setIsAnalyzing(true);
    setScanResult(null);
    setAiResponse('');
    setErrorMessage('');
    isSendingRef.current = true;

    // Capture frame from video
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      setErrorMessage(isRw ? "Kamera ntiyiteguye. Tegereza akanya..." : "Camera is not ready. Please wait a moment...");
      setIsAnalyzing(false);
      isSendingRef.current = false;
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      isSendingRef.current = false;
      return;
    }
    ctx.drawImage(videoRef.current, 0, 0);
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];

      // Call Gemini via 'vision' edge function using direct fetch for reliability
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          imageBase64,
          mimeType: 'image/jpeg',
          apiKey: GEMINI_API_KEY.trim() || undefined,
          prompt: `You are Humura AI, an expert in sign language and mental health support. Analyze this image carefully.
            1. Identify the specific sign language gesture, body language, or facial expression.
            2. Interpret the emotional meaning or specific need (e.g., "I feel alone", "I need help").
            3. Provide a warm, empathetic explanation in the user's context (Rwanda).
            Respond in JSON format:
            {
              "detectedSign": "the emotion or need detected",
              "explanation": "a compassionate 2-sentence explanation of what you see and a validating response."
            }
            If no clear gesture is visible, guide them to position their hands better.`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          console.error('[GEMINI] ✖ Rate limit hit (429)');
          const rateLimitMessage = isRw
            ? "Wageze ku mupaka wa sisitemu. Nyamuneka gerageza nyuma y'amasaha 2 cyangwa uhamagare 114."
            : "You've hit the system limit. Please try again in 2 hours or call 114 for immediate support.";
          setErrorMessage(rateLimitMessage);
          return;
        }
        throw new Error(data.error || 'Failed to analyze image');
      }

      console.log('[GEMINI] ✔ Response received (Vision) | timestamp=' + Date.now());

      try {
        const parsed = typeof data.reply === 'string' ? JSON.parse(data.reply) : data.reply;
        setScanResult(parsed);
      } catch {
          setScanResult({
            detectedSign: "Analysis Complete",
            explanation: data.reply || "Could not analyze the image. Please try again."
          });
        }
      } catch (err: any) {
      console.error('[GEMINI] ✖ Error:', err.message);
      setErrorMessage(isRw 
        ? "Habaye ikosa mu gusesengura ishusho. Nyamuneka gerageza nanone." 
        : "Failed to analyze the image. Please try again.");

    } finally {
      setIsAnalyzing(false);
      isSendingRef.current = false;
    }
  };

  const handleSend = async () => {
    if (selected.length === 0 || isSendingRef.current) return;
    const message = composeMessage();
    setIsAnalyzing(true);
    setAiResponse('');
    setErrorMessage('');
    isSendingRef.current = true;

    const generateFallback = () => {
      const quotaMessage = isRw
        ? "Wageze ku mupaka wa sisitemu. Nyamuneka gerageza nyuma y'amasaha 2 cyangwa uhamagare 114."
        : "You've hit the system limit. Please try again in 2 hours or call 114 for immediate support.";

      if (selected.some(s => s.isCrisis)) {
        return isRw
          ? `Ndakwumva cyane, kandi nishimye ko watugezeho. Ubuzima bwawe bufite agaciro kanini. Ndakwinginga hamagara ako kanya: 114 cyangwa +250 790 003 002. Ntugomba kubicamo wenyine.`
          : `I hear you deeply, and I am so glad you reached out. Your life has incredible value. Please call right now: 114 or +250 790 003 002. You absolutely do not have to face this alone.`;
      }
      return quotaMessage;
    };

    try {
      console.log('[GEMINI] ▶ Request fired (Sign) | timestamp=' + Date.now());
      
      // TIER 1: TRY EDGE FUNCTION
      const { data, error } = await supabase.functions.invoke('super-task', {
        body: { 
          userMessage: `[SIGN LANGUAGE COMMUNICATION] The user selected these emotional/needs signs: ${message}. Please provide a supportive response.`,
          history: [],
          lang: lang,
          isSignLanguage: true,
          apiKey: GEMINI_API_KEY.trim() || undefined
        }
      });

      if (error && (error as any).status === 429) {
        console.error('[GEMINI] ✖ Rate limit hit (429)');
        const rateLimitMessage = isRw
          ? "Wageze ku mupaka wa sisitemu. Nyamuneka gerageza nyuma y'amasaha 2 cyangwa uhamagare 114."
          : "You've hit the system limit. Please try again in 2 hours or call 114 for immediate support.";
        setErrorMessage(rateLimitMessage);
        return;
      }

      if (error) throw error;
      if (!data?.reply) throw new Error('No reply received from Edge Function');
      
      console.log('[GEMINI] ✔ Response received (Sign) | timestamp=' + Date.now());
      setAiResponse(data.reply);
      setTierUsed(2);
    } catch (edgeError: any) {
      console.error('[GEMINI] ✖ Error:', edgeError.message);
      if ((edgeError as any).status === 429) {
        setErrorMessage(generateFallback());
      } else {
        setAiResponse(generateFallback());
      }
      setTierUsed(3);

      addNotification({
        type: 'therapy',
        titleEn: 'Sign Language AI Error',
        titleRw: 'Ikosa rya AI ku Marenga',
        messageEn: 'You may have hit the system limit. Please try again in 2 hours.',
        messageRw: 'Ushobora kuba wageze ku mupaka wa sisitemu. Gerageza nyuma y\'amasaha 2.',
        icon: 'MessageCircle',
        color: 'text-red-500 bg-red-50',
        link: '/sign-language'
      });
    } finally {
      setIsAnalyzing(false);
      setIsLoading(false);
      isSendingRef.current = false;
    }
  };

  const speakResponse = () => {
    if (!('speechSynthesis' in window) || !aiResponse) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(aiResponse);
    utterance.lang = isRw ? 'rw-RW' : 'en-US';
    utterance.onend = () => setIsSpeaking(false);
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
        setCameraError(isRw ? 'Uburenganzira bwa kamera ntibwahawe.' : 'Camera permission denied. Please allow camera access.');
      } else {
        setCameraError(isRw ? 'Kamera ntitashobotse.' : 'Camera not available on this device.');
      }
    }
  };

  const stopCamera = () => {
    setAutoDetectActive(false);
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraActive(false);
  };

  useEffect(() => {
    if (autoDetectActive && cameraActive) {
      detectIntervalRef.current = setInterval(captureAndAnalyze, 6000);
    } else {
      if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
    }
    return () => { if (detectIntervalRef.current) clearInterval(detectIntervalRef.current); };
  }, [autoDetectActive, cameraActive, selected]);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || !GEMINI_API_KEY || isSendingRef.current) return;
    
    setIsDetecting(true);
    isSendingRef.current = true;
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        isSendingRef.current = false;
        return;
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      console.log('[GEMINI] ▶ Request fired (Auto-Detect) | timestamp=' + Date.now());

      // Route through Edge Function using direct fetch for reliability
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: 'image/jpeg',
          apiKey: GEMINI_API_KEY.trim() || undefined,
          prompt: `Pick ONE exact keyword from this list that best matches the user's gesture: [${signs.map(s => s.id).join(', ')}]. If none, output "none". Respond ONLY with the keyword.`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
           console.error('[GEMINI] ✖ Rate limit hit (Auto-Detect)');
           return;
        }
        throw new Error(data.error || 'Failed to auto-detect');
      }
      
      console.log('[GEMINI] ✔ Response received (Auto-Detect) | timestamp=' + Date.now());

      const detectedId = (data?.reply || '').trim().toLowerCase();
      
      const matchedSign = signs.find(s => s.id.toLowerCase() === detectedId);
      if (matchedSign && !selected.find(s => s.id === matchedSign.id)) {
        if (selected.length < 5) {
          setSelected(prev => [...prev, matchedSign]);
          if (matchedSign.isCrisis) setShowCrisisWarning(true);
        }
      }
    } catch (e: any) {
      console.error('[GEMINI] ✖ Error:', e.message);
    } finally {
      setIsDetecting(false);
      isSendingRef.current = false;
    }
  };

  const reset = () => {
    setSelected([]);
    setAiResponse('');
    setShowCrisisWarning(false);
    setIsSpeaking(false);
    window.speechSynthesis.cancel();
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤟</span>
            <h1 className="text-xl font-extrabold text-primary-900 leading-tight">
              {isRw ? 'Amarenga' : 'Sign Language UI'}
            </h1>
          </div>
          <button
            onClick={reset}
            className="p-2 bg-primary-50 rounded-xl text-primary-400 hover:bg-primary-100 transition-colors"
            aria-label="Reset"
            title={isRw ? 'Kanda inshuri 3 kugirango usubire ibyuma' : 'Click to reset'}
          >
            <RotateCcw size={18} />
          </button>
        </div>
        <p className="text-[10px] flex items-center gap-2 mt-1 uppercase font-bold tracking-wider">
            <span className={tierUsed === 1 || tierUsed === 2 ? "text-green-600 animate-pulse" : "text-primary-600"}>
              {tierUsed === 1 || tierUsed === 2 ? (isRw ? 'AI iri gukora' : 'Live AI Active') : (isRw ? 'Koresha amarenga utangira ikiganiro na AI' : 'Inclusive Mental Health Support')}
            </span>
            {tierUsed === 3 && <span className="text-amber-600 italic">📴 {isRw ? 'Uburyo bwo hanze' : 'Offline'}</span>}
        </p>
      </motion.div>

      {/* Instructions banner */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-primary-50 rounded-2xl p-4 space-y-2 relative"
          >
            <button onClick={() => setShowInstructions(false)} className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-600">
              <X size={16} />
            </button>
            <h4 className="font-bold text-primary-900 text-sm mb-1">
              {isRw ? 'Uburyo bwo gukoresha amarenga' : 'How to use'}
            </h4>
            <ul className="text-xs text-primary-700 space-y-1.5 list-decimal pl-4">
              <li>{isRw ? 'Kanda "SCAN" kugira ngo AI itangire gusoma amarenga yawe' : 'Tap "SCAN" to let AI start reading your signs'}</li>
              <li>{isRw ? 'Kora amarenga avuga ibyo wumva cyangwa ibyo nkeneye' : 'Make signs describing your feelings or needs'}</li>
              <li>{isRw ? 'Kanda "NGEJEJE" kugira ngo AI iguhe ubufasha' : 'Tap "FINISH" to get instant AI support'}</li>
              <li>{isRw ? 'Kandi umva kugirango igisubizo cy’umvikane' : 'Use the speaker icon to hear the response aloud'}</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optional camera panel */}
      <div className="glass-card rounded-2xl p-4 overflow-hidden relative">
        <canvas ref={canvasRef} className="hidden" />
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-primary-900 text-sm">
            {isRw ? '📸 Kamera & AI Ikurikirana' : '📸 Camera & AI Vision'}
          </p>
          <button
            onClick={cameraActive ? stopCamera : startCamera}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              cameraActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-primary-50 text-primary hover:bg-primary-100'
            }`}
          >
            {cameraActive ? <><CameraOff size={13} /> {isRw ? 'Hagarika' : 'Stop'}</> : <><Camera size={13} /> {isRw ? 'Tangira Kamera' : 'Start Camera'}</>}
          </button>
        </div>
        
        {cameraError && (
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">{cameraError}</p>
        )}
        
        {cameraActive && (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-black max-h-64 flex justify-center">
              <video ref={videoRef} autoPlay muted playsInline className="h-full max-h-64 object-cover" />
              
              {isDetecting && (
                <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5 bg-black/60 text-white px-2 py-1 rounded-lg backdrop-blur text-[10px] font-bold">
                    <Loader2 size={12} className="animate-spin" />
                    {isRw ? 'GUSESENGURA...' : 'ANALYSING...'}
                  </div>
                </div>
              )}
              
              {!isDetecting && autoDetectActive && (
                <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-white/20 text-white px-2 py-1 rounded-lg backdrop-blur text-[10px] font-medium border border-white/10">
                  {isRw ? 'AI iri kumva...' : 'AI Listening...'}
                </div>
              )}
              
              {/* Done & Send overlay button */}
              {selected.length > 0 && (
                <div className="absolute bottom-4 inset-x-4 z-20">
                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    onClick={() => {
                      stopCamera();
                      handleSend();
                    }}
                    className="w-full bg-primary text-white py-3 rounded-2xl font-bold text-sm shadow-2xl flex items-center justify-center gap-2 border border-white/20 backdrop-blur-sm"
                  >
                    <Send size={18} />
                    {isRw ? 'Ngejeje — Ohereza ubu' : 'Finished Signing — Send Now'}
                  </motion.button>
                </div>
              )}

              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white z-10 pointer-events-none">
                {!selected.length && (
                   <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
                      <ScanEye size={32} />
                    </div>
                    <p className="font-bold mb-2">
                      {isRw ? 'kamera ifashwe kugirango isome amarenga yibyo ukora.' : 'Multimodal Vision Ready'}
                    </p>
                    <p className="text-xs text-white/70 max-w-[200px]">
                      {isRw ? 'AI iri kugufasha kumenya amarenga ukoresha byikora.' : 'AI will automatically detect your signs as you make them.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-primary-50 p-3 rounded-xl border border-primary-100">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-primary-900">
                  {isRw ? 'Sikanira Byikora (AI)' : 'Auto-Detect Signs'}
                </span>
                <span className="text-[10px] text-primary-600 leading-tight">
                  {isRw ? 'Gemini 3 Flash isoma ibimenyetso' : 'Gemini 3 Flash scans your body language'}
                </span>
              </div>
              <button
                onClick={handleScan}
                disabled={isAnalyzing}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm bg-white text-primary-700 hover:bg-primary-100 disabled:opacity-50`}
              >
                <ScanEye size={14} className={isAnalyzing ? 'animate-pulse' : ''} />
                {isRw ? 'Sikanira' : 'SCAN'}
              </button>
            </div>
          </div>
        )}
        
        {!cameraActive && !cameraError && (
          <div className="text-center py-4 space-y-2">
             <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mx-auto text-primary">
                <Camera size={20} />
             </div>
             <p className="text-xs text-neutral-500 max-w-[250px] mx-auto italic">
               {isRw ? 'Kanda buto yo haruguru kugira ngo utangire gukoresha amarenga byikora.' : 'Point camera at a sign language gesture and tap Scan'}
             </p>
          </div>
        )}
      </div>

      {/* NEW: AI Thinking & Response Area directly below camera */}
      <div className="mt-4 space-y-4">
        {/* Show while loading */}
        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-primary-50 shadow-sm"
          >
            <div className="flex gap-1.5 mb-3">
              <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"></span>
            </div>
            <p className="text-sm font-bold text-primary-900">
              🤔 {isRw ? 'Gusesengura amarenga...' : 'Analyzing sign language...'}
            </p>
            <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-primary-50 rounded-full border border-primary-100">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[9px] font-black text-primary-700 uppercase tracking-widest">
                {isRw ? 'Ubufasha bwa CBT (Cognitive Behavioural Therapy)' : 'CBT (Cognitive Behavioural Therapy)'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Show after response arrives (either aiResponse or scanResult) */}
        {(aiResponse || scanResult) && !isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-primary border-t border-r border-b border-primary-50"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">✋</span>
              <h3 className="font-bold text-primary-900 text-sm uppercase tracking-wider">
                {isRw ? 'Amarenga yamenyekanye' : 'Sign Detected'}
              </h3>
            </div>
            <div className="h-px bg-primary-50 w-full mb-4" />
            
            {scanResult ? (
              <div className="space-y-3">
                <div className="inline-block px-3 py-1 bg-primary-100 text-primary-900 rounded-lg font-black text-base">
                  {scanResult.detectedSign}
                </div>
                <p className="text-sm text-primary-800 leading-relaxed">
                  {scanResult.explanation}
                </p>
              </div>
            ) : (
              <p className="text-sm text-primary-800 leading-relaxed font-medium">
                {aiResponse}
              </p>
            )}
            
            {tierUsed === 3 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => navigate('/centers')}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-white text-primary border border-primary-200 rounded-xl font-bold text-xs shadow-sm hover:bg-primary-50 transition-all active:scale-95"
              >
                <MapPin size={14} />
                {isRw ? 'Hamagara / Reba Amavuriro' : 'Call / View Support Directory'}
              </motion.button>
            )}
            
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  const text = scanResult ? `${scanResult.detectedSign}. ${scanResult.explanation}` : aiResponse;
                  if (!('speechSynthesis' in window) || !text) return;
                  if (isSpeaking) {
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                    return;
                  }
                  const utterance = new SpeechSynthesisUtterance(text);
                  utterance.lang = isRw ? 'rw-RW' : 'en-US';
                  utterance.onend = () => setIsSpeaking(false);
                  window.speechSynthesis.speak(utterance);
                  setIsSpeaking(true);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isSpeaking ? 'bg-primary text-white' : 'bg-primary-50 text-primary hover:bg-primary-100'
                }`}
              >
                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                {isSpeaking ? (isRw ? 'Hagarika' : 'Stop') : (isRw ? 'Wumva' : 'Listen')}
              </button>
              <button
                onClick={() => { reset(); setScanResult(null); }}
                className="flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-xl text-xs font-semibold hover:bg-primary-100 transition-colors"
              >
                <RotateCcw size={14} />
                {isRw ? 'Gutangira Nshya' : 'Start New'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Show before any scan */}
        {!isAnalyzing && !aiResponse && !scanResult && (
          <div className="text-center p-6 bg-white/40 rounded-2xl border border-dashed border-primary-100">
            <p className="text-sm text-neutral-400 italic">
              📷 {isRw ? 'Erekeza kamera ku kimenyetso cy’amarenga maze ukande Sikanira' : 'Point camera at a sign language gesture and tap Scan'}
            </p>
          </div>
        )}


        {/* Error Message */}
        {errorMessage && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-2xl text-xs flex items-center gap-2 border border-red-100 shadow-sm">
              <AlertTriangle size={14} />
              {errorMessage}
            </div>
            <button
              onClick={() => navigate('/centers')}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-primary border border-primary-200 rounded-2xl text-xs font-black shadow-sm hover:bg-primary-50 transition-all active:scale-95"
            >
              <MapPin size={14} />
              {isRw ? 'Hamagara / Reba Amavuriro' : 'Call / View Support Directory'}
            </button>
          </div>
        )}
      </div>

      {/* Crisis warning */}
      <AnimatePresence>
        {showCrisisWarning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
              <p className="font-bold text-red-900 text-sm">
                {isRw ? 'Mbere yo kohereza — ubufasha bwihutirwa' : 'Before sending — crisis support available'}
              </p>
            </div>
            <a href="tel:+250790003002" className="flex items-center gap-2 font-bold text-red-700 text-sm hover:underline">
              <Phone size={14} />
              +250 790 003 002 · Healthy Minds Rwanda
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {(Object.entries(CATEGORY_CONFIG) as [keyof typeof CATEGORY_CONFIG, any][]).map(([id, config]) => (
          <button
            key={id}
            onClick={() => setActiveCategory(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap text-xs font-bold transition-all ${
              activeCategory === id
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                : 'bg-white text-primary-600 hover:bg-primary-50 border border-primary-50'
            }`}
          >
            <span>{config.emoji}</span>
            <span>{isRw ? config.rw : config.en}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {categoryFiltered.map(sign => {
          const isSelected = selected.find(s => s.id === sign.id);
          return (
            <motion.button
              key={sign.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleSign(sign)}
              className={`relative flex flex-col items-center justify-center p-4 rounded-3xl transition-all border-2 ${
                isSelected
                  ? 'bg-primary border-primary shadow-xl scale-105'
                  : 'bg-white border-primary-50 hover:border-primary-100 hover:bg-primary-50/30'
              }`}
            >
              <span className="text-4xl mb-2">{sign.emoji}</span>
              <span className={`text-[11px] font-black uppercase tracking-tight text-center leading-tight ${isSelected ? 'text-white' : 'text-primary-900'}`}>
                {isRw ? sign.rw : sign.en}
              </span>
              {isSelected && (
                <motion.div
                  layoutId="selected-check"
                  className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm"
                >
                  <span className="text-primary text-[10px] font-bold">✓</span>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Composed message */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl p-4 space-y-3"
          >
            <p className="text-xs font-semibold text-primary-500 uppercase tracking-wide">
              {isRw ? 'Ubutumwa bwawe:' : 'Your message:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {selected.map(sign => (
                <div
                  key={sign.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                    sign.isCrisis ? 'bg-red-100 text-red-800' : 'bg-primary-100 text-primary-800'
                  }`}
                >
                  <span>{sign.emoji}</span>
                  <span>{isRw ? sign.rw : sign.en}</span>
                  <button
                    onClick={() => removeSign(sign.id)}
                    className="ml-1 text-xs opacity-60 hover:opacity-100"
                    aria-label="Remove sign"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-400">
              {selected.length}/5 {isRw ? 'amarenga ahiswemo' : 'signs selected'}
            </p>
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-900 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20"
            >
              <Send size={16} />
              {isLoading
                ? (isRw ? 'AI iratekereza...' : 'AI is thinking...')
                : (isRw ? 'Ohereza ku AI' : 'Send to AI')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Old response box removed - replaced by new one under camera */}
    </div>
  );
}


