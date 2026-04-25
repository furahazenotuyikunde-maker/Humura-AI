import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, Send, X, Volume2, VolumeX, RotateCcw, Camera, CameraOff, ScanEye, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

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
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');

  const [activeCategory, setActiveCategory] = useState<'feelings' | 'ineed' | 'body' | 'crisis'>('feelings');
  const [selected, setSelected] = useState<Sign[]>([]);
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisisWarning, setShowCrisisWarning] = useState(false);
  const [autoDetectActive, setAutoDetectActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [tierUsed, setTierUsed] = useState<number | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const handleSend = async () => {
    if (selected.length === 0) return;
    const message = composeMessage();
    setIsLoading(true);
    setAiResponse('');

    const OFFLINE_RESPONSES = [
      { en: "Thank you for sharing your feelings. Your emotions are completely valid, and I am here to hold space for you.", rw: "Urakoze gusangira ibyiyumviro byawe. Ibyo wumva ni ukuri, kandi ndi hano kugira ngo nkumve." },
      { en: "It takes courage to express what you're going through. Take a deep breath, and remember you don't have to carry this alone.", rw: "Bisaba ubutwari kuvuga ibyo urimo kunyuramo. Fata umwuka wimbitse, wibuke ko udashobora kwikorera ibi wenyine." },
      { en: "I see you and I hear you. Even on the hardest days, your resilience shines through. Let's take this one step at a time.", rw: "Ndagukubita imboni kandi ndakumva. Na mu minsi igoye cyane, ubushobozi bwawe bwo kwihangana buragaragara. Reka tubyitwaremo gake gake." },
      { en: "Your voice matters, and I am listening carefully to what your signs are telling me. You are safe here.", rw: "Ijwi ryawe ni ingenzi, kandi ndakumva witonze ibyo amarenga yawe arikumbwira. Ufite umutekano hano." },
      { en: "I can sense that things feel heavy right now. Please know that it is absolutely okay to feel this way, and support is always available.", rw: "Nshobora kumva ko ibintu bikuremereye ubu. Ndagusaba kumenya ko ari byiza rwose kwiyumva gutya, kandi ubufasha buhoraho." },
      { en: "Thank you for trusting me with your thoughts. You are surrounded by a community that cares deeply about your well-being.", rw: "Urakoze kunyizera mu bitekerezo byawe. Uhanzwe n'umuryango wita cyane ku buzima bwawe." },
      { en: "Every emotion you express is a stepping stone toward healing. I appreciate you opening up.", rw: "Buri cyiyumviro ugaragaje ni intambwe iganisha ku gukira. Ndashima ko wifunguye." },
      { en: "You don't have to explain everything perfectly. I understand your signs and I am here to support you without judgment.", rw: "Ntugomba gusobanura buri kimwe byatunganye. Ndasobanukirwa amarenga yawe kandi ndi hano kugufasha ntagucira urubanza." },
      { en: "It's completely normal to have days that feel overwhelming. Let me know how I can best support you in this exact moment.", rw: "Birasanzwe kugira iminsi isaba byinshi. Mbwira uko nshobora kugufasha neza muri aka kanya." },
      { en: "I acknowledge your pain and your feelings. Remember to show yourself the same compassion you would show to a good friend.", rw: "Ndemera ububabare bwawe n'ibyiyumviro byawe. Ibuka kwiyereka impuhwe wagaragariza inshuti nziza." },
      { en: "Whenever you feel ready, we can breathe deeply together. You have survived all of your hard days so far.", rw: "Igihe cyose witeguye, dushobora guhumekera hamwe byimbitse. Warokotse iminsi yawe yose igoye kugeza ubu." }
    ];

    const generateFallback = () => {
      if (selected.some(s => s.isCrisis)) {
        return isRw
          ? 'Ndakwumva cyane, kandi nishimye ko watugezeho. Ubuzima bwawe bufite agaciro kanini. Ndakwinginga hamagara ako kanya: 114 cyangwa +250 790 003 002. Ntugomba kubicamo wenyine.'
          : 'I hear you deeply, and I am so glad you reached out. Your life has incredible value. Please call right now: 114 or +250 790 003 002. You absolutely do not have to face this alone.';
      }
      const randomResponse = OFFLINE_RESPONSES[Math.floor(Math.random() * OFFLINE_RESPONSES.length)];
      return isRw 
        ? `${randomResponse.rw} (Ibyo wasabye: ${message})`
        : `${randomResponse.en} (You signed: ${message})`;
    };

    try {
      // TIER 1: TRY EDGE FUNCTION
      console.log("Humura AI (Sign): Attempting Edge Function 'chat'...");
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          userMessage: `User is communicating via sign language. Selected signs: ${message}`,
          history: [],
          lang: lang,
          isSignLanguage: true,
          apiKey: GEMINI_API_KEY.trim()
        }
      });

      if (error) throw error;
      if (!data?.reply) throw new Error('No reply received from Edge Function');
      
      setAiResponse(data.reply);
      setTierUsed(2);
      console.log("✅ Humura AI (Sign): Response received from Edge Function.");
    } catch (edgeError: any) {
      console.warn("⚠️ Humura AI (Sign): Edge Function failed, falling back to direct API.", edgeError);
      
      // TIER 2: FALLBACK TO DIRECT GEMINI
      try {
        const cleanKey = GEMINI_API_KEY.trim();
        if (cleanKey && cleanKey.length > 20) {
          const { GoogleGenerativeAI } = await import('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(cleanKey);
          const model = genAI.getGenerativeModel({
            model: 'gemini-3-flash',
            systemInstruction: `You are Humura AI, a compassionate mental health support assistant for Rwanda. The user is communicating via sign language symbols. Respond with warmth and care. Respond in ${isRw ? 'Kinyarwanda' : 'English'}. Keep response to 3-5 sentences. Address their specific signs directly.`,
          });
          const result = await model.generateContent(message);
          setAiResponse(result.response.text());
          setTierUsed(1);
          console.log("✅ Humura AI (Sign): Response received from direct Gemini API.");
        } else {
          throw new Error('No local API key found for fallback');
        }
      } catch (geminiError: any) {
        console.error("❌ Both connection tiers failed:", geminiError);
        setAiResponse(
          edgeError.message?.includes('404')
            ? (isRw ? 'Porogaramu ya AI ntabwo yashyizweho (404). Hamagara umukozi wacu.' : 'AI Function not deployed (404).')
            : generateFallback()
        );
        setTierUsed(3);
      }
    } finally {
      setIsLoading(false);
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
      detectIntervalRef.current = setInterval(captureAndAnalyze, 4000);
    } else {
      if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
    }
    return () => { if (detectIntervalRef.current) clearInterval(detectIntervalRef.current); };
  }, [autoDetectActive, cameraActive, selected]);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || !GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_key') return;
    
    setIsDetecting(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.trim());
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
      
      const availableIds = signs.map(s => s.id).join(', ');
      const prompt = `You are an expert AI reading sign language, body language, and facial expressions. Look very carefully at the provided user image. Pick ONE exact keyword from this list that best matches their expression or sign: [${availableIds}]. If they look completely neutral, relaxed, or no action is clear, output "none". Do NOT output any formatting, punctuation, or other words. ONLY the exact ID string.`;
      
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }
      ]);
      
      const detectedId = result.response.text().trim().toLowerCase();
      
      const matchedSign = signs.find(s => s.id.toLowerCase() === detectedId);
      if (matchedSign && !selected.find(s => s.id === matchedSign.id)) {
        if (selected.length < 5) {
          setSelected(prev => [...prev, matchedSign]);
          if (matchedSign.isCrisis) setShowCrisisWarning(true);
        }
      }
    } catch (e) {
      console.error("Vision detection failed:", e);
    } finally {
      setIsDetecting(false);
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
              <li>{isRw ? 'hitama amarenga by’ibura 5 avuga ibyo wumva' : 'Select up to 5 signs describing your state'}</li>
              <li>{isRw ? 'Kanda ohereza kugirango AI igusubize' : 'Tap "Send to AI" to get a therapeutic response'}</li>
              <li>{isRw ? 'Reba ubutumwa bwawe burubakwa hepfo nyuma yuko AI ifashe ibimenyetso ikanatekereza' : 'Watch your message build as AI processes the intent'}</li>
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
              {isDetecting && autoDetectActive && (
                <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/60 text-white px-2 py-1 rounded-lg backdrop-blur text-[10px] font-bold">
                  <Loader2 size={12} className="animate-spin" />
                  ANALYZING
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white z-10">
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
            </div>
            
            <div className="flex items-center justify-between bg-primary-50 p-3 rounded-xl border border-primary-100">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-primary-900">
                  {isRw ? 'Sikanira Byikora (AI)' : 'Auto-Detect Signs'}
                </span>
                <span className="text-[10px] text-primary-600 leading-tight">
                  {isRw ? 'Gemini 1.5 Vision isoma ibimenyetso' : 'Gemini 1.5 Vision scans your body language'}
                </span>
              </div>
              <button
                onClick={() => setAutoDetectActive(!autoDetectActive)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm ${
                  autoDetectActive 
                    ? 'bg-primary text-white shadow-primary/30' 
                    : 'bg-white text-primary-700 hover:bg-primary-100'
                }`}
              >
                <ScanEye size={14} className={autoDetectActive ? 'animate-pulse' : ''} />
                {autoDetectActive ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        )}
        
        {!cameraActive && !cameraError && (
          <p className="text-xs text-neutral-400 text-center py-2">
            {isRw ? 'Kamera ifashwe kugira ngo isome amarenga byikora.' : 'Turn on the camera to let AI auto-detect your expressions.'}
          </p>
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

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {(Object.entries(CATEGORY_CONFIG) as [typeof activeCategory, typeof CATEGORY_CONFIG[typeof activeCategory]][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
              activeCategory === key
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'bg-white border border-primary-100 text-primary-700 hover:bg-primary-50'
            }`}
          >
            <span>{cfg.emoji}</span>
            {isRw ? cfg.rw : cfg.en}
          </button>
        ))}
      </div>

      {/* Signs grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categoryFiltered.map(sign => {
          const isSelected = selected.find(s => s.id === sign.id);
          return (
            <motion.button
              key={sign.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleSign(sign)}
              className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                sign.isCrisis
                  ? isSelected
                    ? 'border-red-500 bg-red-500 text-white shadow-lg shadow-red-500/25'
                    : 'border-red-200 bg-red-50 text-red-800 hover:border-red-400'
                  : isSelected
                  ? 'border-primary bg-primary text-white shadow-lg shadow-primary/25'
                  : 'border-primary-100 bg-white text-primary-800 hover:border-primary-300 hover:bg-primary-50'
              }`}
              aria-label={isRw ? sign.rw : sign.en}
            >
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 text-xs bg-white/90 rounded-full w-5 h-5 flex items-center justify-center text-primary font-bold shadow">
                  ✓
                </span>
              )}
              <span className="text-3xl">{sign.emoji}</span>
              <span className="text-xs font-semibold text-center leading-tight">
                {isRw ? sign.rw : sign.en}
              </span>
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

      {/* AI Response */}
      <AnimatePresence>
        {aiResponse && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-5 border border-primary-100 shadow-sm space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm">🤟</div>
              <p className="font-bold text-primary-900 text-sm">Humura AI</p>
            </div>
            <p className="text-sm text-primary-800 leading-relaxed">{aiResponse}</p>
            <div className="flex gap-2">
              <button
                onClick={speakResponse}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isSpeaking ? 'bg-primary text-white' : 'bg-primary-50 text-primary hover:bg-primary-100'
                }`}
              >
                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                {isSpeaking ? (isRw ? 'Hagarika' : 'Stop') : (isRw ? 'Wumva' : 'Listen')}
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-xl text-xs font-semibold hover:bg-primary-100 transition-colors"
              >
                <RotateCcw size={14} />
                {isRw ? 'Gutangira Nshya' : 'Start New'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


