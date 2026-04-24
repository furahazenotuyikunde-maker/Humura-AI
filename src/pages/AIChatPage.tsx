import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, AlertTriangle, X, MessageCircle, Volume2, VolumeX, RotateCcw, Phone } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// ──────────────────────────────────────────────────────────────
// 3-TIER AI CONFIGURATION
// ──────────────────────────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const SYSTEM_PROMPT = `You are Humura AI, a compassionate mental health support assistant for people in Rwanda.

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
// CRISIS DETECTION
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
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('Humura_chat_history');
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
    localStorage.setItem('Humura_chat_history', JSON.stringify(messages));
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
  const thHumurantervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const offlineIndexRef = useRef<Map<string, number>>(new Map());

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Thinking animation
  useEffect(() => {
    if (isLoading) {
      let idx = 0;
      thHumurantervalRef.current = setInterval(() => {
        idx = (idx + 1) % THINKING_MESSAGES.length;
        setThinkingText(THINKING_MESSAGES[idx]);
      }, 1500);
    } else {
      if (thHumurantervalRef.current) clearInterval(thHumurantervalRef.current);
    }
    return () => {
      if (thHumurantervalRef.current) clearInterval(thHumurantervalRef.current);
    };
  }, [isLoading]);

  // ──────────────────────────────────────────────────────────────
  // SEND MESSAGE (Edge Function prioritized)
  // ──────────────────────────────────────────────────────────────
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
      // 1. TRY EDGE FUNCTION (Most Secure & Dynamic)
      const { data, error } = await supabase.functions.invoke('bright-worker', {
        body: { 
          message: userText,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          lang: lang
        }
      });

      if (error) throw error;
      if (!data?.reply) throw new Error('No reply from Edge Function');
      
      reply = data.reply;
      setTierUsed(2);
    } catch (edgeError) {
      console.error("Edge Function Error:", edgeError);
      
      // 2. FALLBACK TO DIRECT GEMINI (If key exists in .env)
      try {
        if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_key') {
          // Inline Gemini call logic to remove the separate function
          const { GoogleGenerativeAI } = await import('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: SYSTEM_PROMPT,
          });

          const formattedHistory = messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          }));

          const chat = model.startChat({ history: formattedHistory });
          const result = await chat.sendMessage(userText);
          reply = result.response.text();
          setTierUsed(1);
        } else {
          throw new Error('No API keys provided');
        }
      } catch (geminiError) {
        console.error("Gemini Direct Error:", geminiError);
        
        // 3. FINAL FALLBACK: Dynamic Error Message (Replaces Fixed Answers)
        reply = isRw 
          ? "Mwihangane, ndagira ikibazo cy'itumanaho ubu. Gerageza nanone mu kanya gato cyangwa uhamagare 114 niba ukeneye ubufasha bwihuse."
          : "I'm having trouble connecting to my brain right now. Please try again in a moment, or call 114 if you need immediate support.";
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
      setMicError(isRw ? 'Porogaramu ntishobora guha ijwi muri iyi porogaramu' : 'Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = isRw ? 'rw-RW' : 'en-US';
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
        setMicError(isRw ? 'Uburenganzira bwa mikoro ntibwahawe. Reka uburenganzira bwa mikoro mu igenamiterere rya porogaramu.' : 'Microphone permission denied. Please allow microphone access in your browser settings.');
      } else {
        setMicError(isRw ? 'Ikibazo cy\'ijwi: ' + e.error : 'Voice error: ' + e.error);
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
    utterance.lang = isRw ? 'rw-RW' : 'en-US';
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
    localStorage.removeItem('Humura_chat_history');
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
            <p className="font-bold text-primary-900 text-sm">Humura AI</p>
            <p className="text-[10px] text-primary-500">
              {tierUsed === 3 ? '📴 Offline Mode' : tierUsed === 1 ? '🌐 Gemini AI' : isRw ? 'Haze kugira ngo tuganire' : 'Here to support you'}
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
                {isRw ? 'Muraho! Ndi Humura AI' : 'Hello! I\'m Humura AI'}
              </h3>
              <p className="text-primary-600 text-sm max-w-xs leading-relaxed">
                {isRw
                  ? 'Ndi inshuti yawe yo gufasha mu buzima bwo mu mutwe. Vuga ibyo umva mu mutima — sinya icyo gishaka.'
                  : 'Your compassionate mental wellness companion. Share what\'s on your mind — I\'m here to listen without judgment.'}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {[
                isRw ? 'Ndi nababaye' : 'I feel anxious',
                isRw ? 'Sikuryama neza' : 'I can\'t sleep well',
                isRw ? 'Ndi ingorane nyinshi' : 'I\'m feeling overwhelmed',
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
          placeholder={isRw ? 'Andika ubutumwa cyangwa kanda mikoro...' : 'Type your message or tap the mic...'}
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


