import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, AlertTriangle, X, MessageCircle, Volume2, VolumeX, RotateCcw, Phone } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ──────────────────────────────────────────────────────────────
// 3-TIER AI CONFIGURATION
// ──────────────────────────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const SYSTEM_PROMPT = `You are Inkingi AI, a compassionate mental health support assistant for people in Rwanda.

RULES:
1. Respond in the same language as the user (English or Kinyarwanda — detect automatically)
2. Always read the user's exact words and address their specific situation — never generic replies
3. Validate feelings first, then give practical evidence-based coping strategies: CBT, grounding, mindfulness, DBT, ACT
4. Keep responses to 3-6 sentences — warm and clear
5. Vary your opening every single response — never start two answers the same way
6. For crisis signals: immediately provide Rwanda crisis hotline +250 790 003 002
7. Reference the user's specific words to show you truly read their message
8. Never repeat the same coping strategy twice in one conversation
9. For sign language users: treat their composed message with identical care as spoken messages
10. Temperature: 0.85 — varied, not repetitive`;

// ──────────────────────────────────────────────────────────────
// CRISIS KEYWORDS
// ──────────────────────────────────────────────────────────────
const CRISIS_KEYWORDS_EN = [
  'suicide', 'kill myself', 'end my life', 'want to die', 'hurt myself',
  'self harm', 'self-harm', 'hopeless', 'give up', 'cant go on', "can't go on",
  'worthless', 'better off dead', 'nobody cares', 'disappear forever', 'no reason to live'
];
const CRISIS_KEYWORDS_RW = [
  'kwiyahura', 'kwisiga', 'kwicwa', 'gupfa', 'ntamuntu wandikunda',
  'narimbuwe', 'ntakiyo', 'nshaka gupfa', 'ntakigomba kubaho'
];

function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return [...CRISIS_KEYWORDS_EN, ...CRISIS_KEYWORDS_RW].some(k => lower.includes(k));
}

// ──────────────────────────────────────────────────────────────
// TIER 3: LOCAL OFFLINE ENGINE
// ──────────────────────────────────────────────────────────────
const OFFLINE_RESPONSES: Record<string, { en: string[]; rw: string[] }> = {
  anxiety: {
    en: [
      "What you're experiencing sounds really exhausting — anxiety can feel overwhelming. Try the 4-7-8 breathing technique: inhale for 4 counts, hold for 7, exhale for 8. It activates your parasympathetic nervous system and calms the body quickly.",
      "Anxiety often lies to us, making dangers feel bigger than they are. I want you to notice: are you safe right now, in this moment? Ground yourself with 5 things you can see around you. That's the 5-4-3-2-1 technique, and it works.",
      "Your feelings are completely valid — anxiety is your body's protection system working overtime. Let's slow things down: breathe in slowly for 4 counts, out for 6. Research shows extended exhaling triggers the calm response.",
    ],
    rw: [
      "Ibyo uri guhurana nazo birumvikana ko biraruhanya — ubwoba bushobora kumvikana nk'umutwaro. Gerageza ubuhumekero bwa 4-7-8: humeka amasekunida 4, komeza 7, sohora 8. Bitera umubiri guhinduka.",
      "Ubwoba bukunze kuduhisha ibintu nk'ibibi kuruta uko biri. Baza ikibazo: ese uri mubukiro ubu? Reba ibintu 5 ubona imbere yawe. Ni uburyo bwa 5-4-3-2-1, kandi bufasha cyane.",
    ]
  },
  depression: {
    en: [
      "Depression isn't weakness — it's an illness, and one that improves with the right support. One small act today can make a difference: step outside for 5 minutes, or text one person you trust. Behavioral Activation starts small.",
      "It makes complete sense that you feel this way. Depression lies to us, telling us nothing will help. But small actions compound — what's one tiny thing you could do right now, even if it feels pointless?",
      "You're carrying something really heavy, and I want you to know that's okay. Depression affects 280 million people worldwide. You are not alone and you are not broken. Have you been able to talk to anyone you trust lately?",
    ],
    rw: [
      "Agahinda si ubusaza — ni indwara, kandi ishobora gukira hamwe n'ubufasha bwiza. Igikorwa kimwe gito uyu munsi gishobora gutandukana: sohoka iminota 5, cyangwa andika ubutumwa ku muntu uizeye.",
      "Bisobanurika gufata agahinda. Agahinda gatuhesha ibinyoma — ko nta kintu gishobora gufasha. Ariko ibikorwa bito byiyongera. Ni iki kimwe gito wokora ubu?",
    ]
  },
  stress: {
    en: [
      "Stress is a signal that you care deeply about something — but your body needs relief. Try progressive muscle relaxation: tense each muscle group for 5 seconds, then release. Start from your toes and work upward.",
      "When stress feels unmanageable, it helps to name what's really behind it. What is the core thing you're most afraid won't work out? Sometimes naming the fear reduces its power significantly.",
      "Your nervous system is working hard right now. Give it permission to rest. Box breathing — 4 counts in, 4 hold, 4 out, 4 hold — is used by special forces soldiers to manage high-stress situations.",
    ],
    rw: [
      "Ingorane ni ikimenyetso cyo ku mutima — ariko umubiri wawe ukeneye isorore. Gerageza ukwitonde imitsi: menyeresha imitsi isekunde 5, hanyuma yitonze. Tangira ku birenge.",
      "Iyo ingorane zumvikana nk'irehana cyane, bifasha kumenya icyo gishingiye. Ni iki kintu cyane utinya ko kitazagenda neza? Gukivuga kenshi bigabanya imbaraga zacyo.",
    ]
  },
  trauma: {
    en: [
      "What you've been through was real, and it makes sense your nervous system is still responding to it. Trauma is not a sign of weakness — it's evidence that something significant happened to you. Healing happens at your own pace.",
      "When traumatic memories surface, grounding helps bring you back to safety. Feel your feet on the floor. Notice the temperature of the air. Name 3 things in the room. You are here, now, and you are safe.",
      "Healing from trauma is not linear — some days feel like going backward, but that's part of the process. Rwanda has remarkable community healing traditions. Have you been able to talk to anyone who understands your experience?",
    ],
    rw: [
      "Ibyo wahuye nabyose birari ukuri, kandi bisobanurika ko umubiri wawe ukigisubiza. Trauma si ubudahangarwa — ni ibimenyetso by'ibintu bikomeye byakugwiririye. Gukira bigenda uko ushakiye.",
      "Iyo ibintu bya mbere byongerahajaho, ukwegeranya bifasha kukugarura mu mutekano. Umva ibirenge byawe ku butaka. Tanga izina ibintu 3 mu cyumba. Uri hano, ubu, kandi uri mubukiro.",
    ]
  },
  grief: {
    en: [
      "Grief has no timeline, and there is no right way to do it. What you're feeling — whether it's sadness, anger, numbness, or even moments of joy — is all part of love expressing itself through loss.",
      "Losing someone you love changes you, and that's okay. Grief comes in waves — sometimes you're swimming, sometimes you're drowning. Both are normal. Be as gentle with yourself as you would be with someone you love.",
      "Your pain is a reflection of how much you loved. While nothing erases that loss, grief can transform over time into something you carry more gently. Have you been able to talk about the person you lost with anyone?",
    ],
    rw: [
      "Akababaro ntagira igihe, kandi nta buryo bwiza bwo kubugira. Ibyo umva — agahinda, umujinya, ubujiji, cyangwa n'ibyishimo — ni byose igice cy'urukundo rugaragara mu gupiripita.",
      "Gupfukirana umuntu ukunda kukuhinduye, kandi ni ko kugomba kwaba. Akababaro kaza nk'amazi — rimwe uri gutwima, rimwe untiyuhaguza. Byombi ni bisanzwe.",
    ]
  },
  sleep: {
    en: [
      "Poor sleep and mental health are deeply connected — each affects the other. Try the 4-7-8 method before bed: inhale 4 counts, hold 7, exhale 8. This breathing pattern is specifically designed to promote sleep onset.",
      "Our brains need a wind-down signal before sleep. Try: no screens 1 hour before bed, keep your room cool and dark, and aim for the same sleep time every night — even weekends. Consistency is more powerful than total hours.",
    ],
    rw: [
      "Itiro ribi n'ubuzima bwo mu mutwe bifite isano ikomeye. Gerageza ubuhumekero bwa 4-7-8 mbere yo kuryama. Humeka 4, komeza 7, sohora 8. Ni uburyo bwihariye bwo gufasha gusinzira.",
    ]
  },
  crisis: {
    en: [
      "I hear you and I'm very glad you're still here. What you're feeling right now is incredibly painful, but these feelings can change. Please reach out immediately: Rwanda Hotline 114, Healthy Minds Rwanda: +250 790 003 002, Emergency: 112. You don't have to face this alone.",
      "Your life matters deeply, and I want you to be safe right now. Please call 114 (free, 24/7) or +250 790 003 002 immediately. Is there one person nearby you could call or go to right now?",
    ],
    rw: [
      "Ndakwumva kandi nishimye ko ugihari. Ibyo umva ubu ni bibi cyane, ariko ibi byumviro bishobora guhinduka. Hamagara ako kanya: 114, Healthy Minds: +250 790 003 002, Ihutirwa: 112. Nta kimwe urerego.",
    ]
  },
  general: {
    en: [
      "Thank you for sharing that with me. It takes courage to speak about what you're feeling. I want to understand more — can you tell me what's been weighing most heavily on your mind lately?",
      "I'm here with you, and I'm listening carefully. Your feelings are valid and worth exploring. What would feel most helpful to focus on right now — something practical, or simply being heard?",
      "You've taken an important step by reaching out. Whatever you're carrying, you don't have to carry it alone. What feels most pressing for you right now?",
    ],
    rw: [
      "Urakoze kuvuga ibyo umva. Bisaba ubutwari kuvuga ibyo umva mu mutima. Ndashaka gusobanukirwa neza — ni iki kiremereye cyane mu mutwe wawe vuba aha?",
      "Ndi hano nawe, kandi ndakwumviriza neza. Ibyumviro byawe ni by'ukuri kandi bikwiye gupimwa. Ni iki cyangufasha cyane ubu?",
    ]
  }
};

function detectTopic(text: string): string {
  const lower = text.toLowerCase();
  if (detectCrisis(text)) return 'crisis';
  if (['anxious', 'anxiety', 'worry', 'panic', 'scared', 'ubwoba', 'impungenge'].some(k => lower.includes(k))) return 'anxiety';
  if (['depress', 'sad', 'hopeless', 'empty', 'agahinda', 'guturika'].some(k => lower.includes(k))) return 'depression';
  if (['stress', 'overwhelm', 'pressure', 'ingorane', 'umunaniro'].some(k => lower.includes(k))) return 'stress';
  if (['trauma', 'ptsd', 'abuse', 'flashback', 'nightmare'].some(k => lower.includes(k))) return 'trauma';
  if (['grief', 'loss', 'died', 'death', 'mourning', 'akababaro', 'gupfukirana'].some(k => lower.includes(k))) return 'grief';
  if (['sleep', 'insomnia', 'tired', 'exhausted', 'itiro', 'umunaniro'].some(k => lower.includes(k))) return 'sleep';
  return 'general';
}

function getOfflineResponse(text: string, lang: string, usedIndexes: Map<string, number>): string {
  const topic = detectTopic(text);
  const responses = OFFLINE_RESPONSES[topic] || OFFLINE_RESPONSES.general;
  const langResponses = (lang === 'rw' && responses.rw.length > 0) ? responses.rw : responses.en;
  const lastIdx = usedIndexes.get(topic) ?? -1;
  const nextIdx = (lastIdx + 1) % langResponses.length;
  usedIndexes.set(topic, nextIdx);
  return langResponses[nextIdx];
}

// ──────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const THINKING_MESSAGES = [
  "Reading your message carefully...",
  "Considering your emotional context...",
  "Drawing from CBT & mindfulness research...",
  "Preparing a personalised response...",
];

// ──────────────────────────────────────────────────────────────
// CRISIS OVERLAY COMPONENT
// ──────────────────────────────────────────────────────────────
function CrisisOverlay({ onDismiss, lang }: { onDismiss: () => void; lang: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-red-900/97 flex flex-col items-center justify-center p-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring' }}
        className="max-w-sm w-full"
      >
        <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
          <AlertTriangle size={48} className="text-white animate-pulse" />
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-2">
          {lang === 'rw' ? 'Uri mubukiro bwacu' : 'You Are Not Alone'}
        </h2>
        <p className="text-red-200 mb-8 leading-relaxed">
          {lang === 'rw'
            ? 'Ndakwumva, kandi nishimye ko ugihari. Hamagara ubu — inzobere ziri hano zigufasha.'
            : 'We hear you, and we\'re glad you\'re still here. Please reach out to someone who can help right now.'}
        </p>

        <div className="space-y-3 w-full mb-8">
          <a
            href="tel:114"
            className="flex items-center justify-between w-full py-4 px-5 bg-white text-red-900 font-bold rounded-2xl shadow-xl hover:scale-105 transition-transform"
          >
            <span>🆘 {lang === 'rw' ? 'Hotline y\'Ubuzima bwo mu Mutwe' : 'Mental Health Crisis Hotline'}</span>
            <span className="text-red-600 font-black">114</span>
          </a>
          <a
            href="tel:+250790003002"
            className="flex items-center justify-between w-full py-4 px-5 bg-white text-red-900 font-bold rounded-2xl shadow-xl hover:scale-105 transition-transform"
          >
            <span>💚 Healthy Minds Rwanda</span>
            <span className="text-red-600 font-black text-sm">+250 790 003 002</span>
          </a>
          <a
            href="tel:+250783375550"
            className="flex items-center justify-between w-full py-4 px-5 bg-white text-red-900 font-bold rounded-2xl shadow-xl hover:scale-105 transition-transform"
          >
            <span>🏥 Icyizere Center</span>
            <span className="text-red-600 font-black text-sm">+250 783 375 550</span>
          </a>
          <a
            href="tel:112"
            className="flex items-center justify-between w-full py-4 px-5 bg-white text-red-900 font-bold rounded-2xl shadow-xl hover:scale-105 transition-transform"
          >
            <span>🚨 {lang === 'rw' ? 'Polisi/Imbangukiragutabara' : 'Police/Ambulance'}</span>
            <span className="text-red-600 font-black">112</span>
          </a>
        </div>

        <button
          onClick={onDismiss}
          className="text-white/70 hover:text-white flex items-center gap-2 mx-auto transition-colors"
        >
          <X size={18} />
          <span className="text-sm">{lang === 'rw' ? 'Ndabona neza, garuka ku kiganiro' : 'I\'m okay, return to chat'}</span>
        </button>
      </motion.div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN CHAT COMPONENT
// ──────────────────────────────────────────────────────────────
export default function AIChatPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('inkingi_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('inkingi_chat_history', JSON.stringify(messages));
  }, [messages]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [thinkingText, setThinkingText] = useState(THINKING_MESSAGES[0]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micError, setMicError] = useState('');
  const [tierUsed, setTierUsed] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const thinkingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const offlineIndexRef = useRef<Map<string, number>>(new Map());

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Thinking animation
  useEffect(() => {
    if (isLoading) {
      let idx = 0;
      thinkingIntervalRef.current = setInterval(() => {
        idx = (idx + 1) % THINKING_MESSAGES.length;
        setThinkingText(THINKING_MESSAGES[idx]);
      }, 1500);
    } else {
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
    }
    return () => {
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
    };
  }, [isLoading]);

  // ── TIER 1: Gemini Direct ──────────────────────────────────
  const callGeminiDirect = async (userText: string, history: Message[]): Promise<string> => {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    const formattedHistory = history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessage(userText);
    return result.response.text();
  };

  // ── SEND MESSAGE (3-tier fallback) ────────────────────────
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');

    const isCrisis = detectCrisis(userText);
    if (isCrisis) setShowCrisisAlert(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setTierUsed(null);

    let reply = '';
    try {
      // Tier 1: Gemini direct
      if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_key') {
        reply = await callGeminiDirect(userText, messages);
        setTierUsed(1);
      } else {
        throw new Error('No API key');
      }
    } catch {
      try {
        // Tier 2: Would be Supabase Edge Function — skip for now
        throw new Error('No edge function configured');
      } catch {
        // Tier 3: Local offline engine
        reply = getOfflineResponse(userText, lang, offlineIndexRef.current);
        setTierUsed(3);
      }
    }

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: reply,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);

    // TTS auto-play
    speakText(reply);
  }, [input, isLoading, messages, lang]);

  // ── VOICE INPUT ────────────────────────────────────────────
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError(lang === 'rw' ? 'Porogaramu ntishobora guha ijwi muri iyi porogaramu' : 'Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'rw' ? 'rw-RW' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.onerror = (e: any) => {
      setIsListening(false);
      if (e.error === 'not-allowed') {
        setMicError(lang === 'rw' ? 'Uburenganzira bwa mikoro ntibwahawe. Reka uburenganzira bwa mikoro mu igenamiterere rya porogaramu.' : 'Microphone permission denied. Please allow microphone access in your browser settings.');
      } else {
        setMicError(lang === 'rw' ? 'Ikibazo cy\'ijwi: ' + e.error : 'Voice error: ' + e.error);
      }
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // ── TTS ────────────────────────────────────────────────────
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'rw' ? 'rw-RW' : 'en-US';
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const clearChat = () => {
    setMessages([]);
    setInput('');
    offlineIndexRef.current.clear();
    localStorage.removeItem('inkingi_chat_history');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] relative">
      {/* Crisis Overlay */}
      <AnimatePresence>
        {showCrisisAlert && (
          <CrisisOverlay onDismiss={() => setShowCrisisAlert(false)} lang={lang} />
        )}
      </AnimatePresence>

      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-primary-50 bg-white/60 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <MessageCircle size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-primary-900 text-sm">Inkingi AI</p>
            <p className="text-[10px] text-primary-500">
              {tierUsed === 3 ? '📴 Offline Mode' : tierUsed === 1 ? '🌐 Gemini AI' : lang === 'rw' ? 'Haze kugira ngo tuganire' : 'Here to support you'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSpeaking ? (
            <button onClick={stopSpeaking} className="p-2 bg-primary-50 rounded-xl text-primary hover:bg-primary-100 transition-colors">
              <VolumeX size={16} />
            </button>
          ) : (
            <button onClick={() => messages.length > 0 && speakText(messages[messages.length - 1]?.content || '')} className="p-2 bg-primary-50 rounded-xl text-primary-400 hover:bg-primary-100 transition-colors">
              <Volume2 size={16} />
            </button>
          )}
          <button onClick={clearChat} className="p-2 bg-primary-50 rounded-xl text-primary-400 hover:bg-primary-100 transition-colors">
            <RotateCcw size={16} />
          </button>
          <a href="/emergency" className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors">
            <Phone size={13} />
            114
          </a>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col items-center justify-center text-center space-y-6 py-10"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle size={40} className="text-primary" />
            </div>
            <div>
              <h3 className="font-extrabold text-primary-900 text-xl mb-2">
                {lang === 'rw' ? 'Muraho! Ndi Inkingi AI' : 'Hello! I\'m Inkingi AI'}
              </h3>
              <p className="text-primary-600 text-sm max-w-xs leading-relaxed">
                {lang === 'rw'
                  ? 'Ndi inshuti yawe yo gufasha mu buzima bwo mu mutwe. Vuga ibyo umva mu mutima — sinya icyo gishaka.'
                  : 'Your compassionate mental wellness companion. Share what\'s on your mind — I\'m here to listen without judgment.'}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {[
                lang === 'rw' ? 'Ndi nababaye' : 'I feel anxious',
                lang === 'rw' ? 'Sikuryama neza' : 'I can\'t sleep well',
                lang === 'rw' ? 'Ndi ingorane nyinshi' : 'I\'m feeling overwhelmed',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold hover:bg-primary-100 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                  <MessageCircle size={14} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-4 rounded-3xl shadow-sm text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-white border border-primary-100 text-primary-900 rounded-tl-sm'
                }`}
              >
                {m.content}
                <p className={`text-[10px] mt-1.5 ${m.role === 'user' ? 'text-white/50' : 'text-neutral-400'}`}>
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {m.role === 'assistant' && (
                    <button
                      onClick={() => speakText(m.content)}
                      className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      🔊
                    </button>
                  )}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mr-2 mt-1">
              <MessageCircle size={14} className="text-white" />
            </div>
            <div className="bg-white border border-primary-100 text-primary-700 rounded-3xl rounded-tl-sm p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="think-dot bg-primary" />
                <span className="think-dot bg-primary" />
                <span className="think-dot bg-primary" />
              </div>
              <p className="text-xs text-primary-500 italic">{thinkingText}</p>
            </div>
          </motion.div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Mic error */}
      <AnimatePresence>
        {micError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mx-4 mb-2 p-3 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-2"
          >
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 flex-1">{micError}</p>
            <button onClick={() => setMicError('')} className="text-red-400 hover:text-red-600">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <div className="flex-shrink-0 p-3 bg-white/60 backdrop-blur-md border-t border-primary-50 flex gap-2">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`p-3.5 rounded-2xl transition-all flex-shrink-0 ${
            isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
          }`}
          aria-label={isListening ? 'Stop recording' : 'Start voice input'}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={lang === 'rw' ? 'Andika ubutumwa cyangwa kanda mikoro...' : 'Type your message or tap the mic...'}
          className="flex-1 px-4 py-3 bg-white border border-primary-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-neutral-400 font-medium text-sm"
        />

        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="p-3.5 bg-accent text-white rounded-2xl hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20 flex-shrink-0"
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}

