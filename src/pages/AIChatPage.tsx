import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Send, Mic, MicOff, AlertTriangle, X, MessageCircle, Phone, Plus, Loader2, MapPin } from 'lucide-react';

import { supabase } from '../lib/supabaseClient';
import { addNotification } from '../lib/notifications';
import { translateText } from '../lib/translate';
import { Languages } from 'lucide-react';

// ──────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  translatedContent?: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

export default function AIChatPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionUrlId = searchParams.get('session');

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('Humura_chat_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((s: any) => ({
          ...s,
          lastUpdated: new Date(s.lastUpdated),
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionUrlId);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isListening, setIsListening] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Sync with URL and local storage
  useEffect(() => {
    if (sessionUrlId && sessionUrlId !== currentSessionId) {
      setCurrentSessionId(sessionUrlId);
    }
  }, [sessionUrlId]);

  useEffect(() => {
    localStorage.setItem('Humura_chat_sessions', JSON.stringify(sessions));
    if (currentSessionId && searchParams.get('session') !== currentSessionId) {
      setSearchParams({ session: currentSessionId });
    }
  }, [sessions, currentSessionId]);

  // Derived current session
  const currentSession = sessions.find(s => s.id === currentSessionId) || null;
  const messages = currentSession?.messages || [];

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const startNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: isRw ? 'Ikiganiro Gishya' : 'New Chat',
      messages: [],
      lastUpdated: new Date(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  // Initialize first chat or handle new session from URL
  useEffect(() => {
    if (sessions.length === 0) {
      startNewChat();
    } else if (sessionUrlId) {
      // Check if sessionUrlId exists in sessions
      const exists = sessions.some(s => s.id === sessionUrlId);
      if (!exists) {
        // Create new session with the ID from URL
        const newSession: ChatSession = {
          id: sessionUrlId,
          title: isRw ? 'Ikiganiro Gishya' : 'New Chat',
          messages: [],
          lastUpdated: new Date(),
        };
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(sessionUrlId);
      } else {
        setCurrentSessionId(sessionUrlId);
      }
    } else if (!currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessionUrlId]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setErrorMessage('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };

    // Optimistic update
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return { ...s, messages: [...s.messages, userMsg], lastUpdated: new Date() };
      }
      return s;
    }));

    setIsLoading(true);

    try {
      // TIER 1: CALL SUPABASE EDGE FUNCTION 'super-task'
      console.log("Humura AI: Attempting Edge Function 'super-task'...");
      const { data, error, status } = await supabase.functions.invoke('super-task', {
        body: { 
          userMessage: userText,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          lang: lang,
          apiKey: import.meta.env.VITE_GEMINI_API_KEY
        }
      });

      if (status === 429) {
        const rateLimitMessage = isRw 
          ? "Sisitemu yakiriye ubusabe bwinshi (20/min). Gerageza nyuma y'umunota umwe." 
          : "Rate limit reached (20 requests/min). Please try again in 60 seconds.";
        setErrorMessage(rateLimitMessage);
        return;
      }

      if (error) throw error;
      if (!data?.reply) throw new Error('No reply received from AI service');

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          const updatedMessages = [...s.messages, aiMsg];
          let newTitle = s.title;
          if (s.messages.length === 1) {
            newTitle = userText.slice(0, 30) + (userText.length > 30 ? '...' : '');
          }
          return { ...s, messages: updatedMessages, title: newTitle, lastUpdated: new Date() };
        }
        return s;
      }));

      // Add a notification for the AI response
      addNotification({
        type: 'therapy',
        titleEn: 'AI Response Received',
        titleRw: 'Ubutumwa bwa AI Mwagezeho',
        messageEn: 'Humura AI has responded to your message. Tap to view.',
        messageRw: 'Humura AI yasubije ubutumwa bwawe. Kanda hano urebe.',
        icon: 'MessageCircle',
        color: 'text-primary bg-primary-50',
        link: `/chat?session=${currentSessionId}`
      });

    } catch (err: any) {
      console.error("❌ Chat failed:", err);
      const friendlyError = isRw 
        ? "Gerageza nyuma gato cyangwa niba ukeneye ubufasha bwihutirwa hamagara 114 (Rwanda Biomedical Centres)"
        : "Try again later or if you want immediate support call 114 (Rwanda Biomedical Centres)";
      
      setErrorMessage(friendlyError);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, currentSessionId, sessions, lang, isRw, messages]);

  // Voice Input
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = isRw ? 'rw-RW' : 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => setInput(e.results[0][0].transcript);
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleTranslate = async (messageId: string, text: string) => {
    const target = isRw ? 'en' : 'rw';
    const translated = await translateText(text, target);
    
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          messages: s.messages.map(m => m.id === messageId ? { ...m, translatedContent: translated } : m)
        };
      }
      return s;
    }));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-60px)] relative bg-[#F0F2F5]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-white shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle size={24} />
          </div>
          <div>
            <p className="font-bold text-sm truncate max-w-[150px]">{currentSession?.title || 'Humura AI'}</p>
            <p className="text-[10px] opacity-80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {isRw ? 'Ndi hano' : 'Online'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={startNewChat} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Plus size={20} />
          </button>
          <a href="tel:114" className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 rounded-xl text-xs font-black hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20">
            <Phone size={14} />
            114
          </a>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-90">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white/40 backdrop-blur-sm rounded-3xl mx-4 my-10 border border-white/50 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageCircle size={32} className="text-primary" />
            </div>
            <h3 className="font-extrabold text-primary-900 text-xl mb-2">
              {isRw ? 'Muraho! Ndi Humura AI' : 'Hello! I\'m Humura AI'}
            </h3>
            <p className="text-primary-600 text-sm max-w-xs leading-relaxed">
              {isRw
                ? 'Ndi inshuti yawe yo gufasha mu buzima bwo mu mutwe. Vuga ibyo umva mu mutima.'
                : 'Your compassionate mental wellness companion. Share what\'s on your mind — I\'m here to listen.'}
            </p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed relative ${
                  m.role === 'user'
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-white text-primary-900 rounded-tl-none border border-neutral-100'
                }`}
              >
                {m.translatedContent ? (
                  <div className="space-y-2">
                    <p className="opacity-50 text-xs italic line-through">{m.content}</p>
                    <p className="font-bold">{m.translatedContent}</p>
                  </div>
                ) : (
                  m.content
                )}
                
                <div className="flex items-center justify-between mt-1.5 border-t border-black/5 pt-1">
                  <button 
                    onClick={() => navigate(`/translator?text=${encodeURIComponent(m.content)}&target=${isRw ? 'rw' : 'en'}`)}
                    className="text-[10px] font-bold opacity-60 hover:opacity-100 flex items-center gap-1 uppercase tracking-wider"
                  >
                    <Languages size={10} />
                    {isRw ? 'TRANSLATOR (EN)' : 'TRANSLATOR (RW)'}
                  </button>
                  <div className={`text-[10px] opacity-60`}>
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {/* Tail for bubbles */}
                <div className={`absolute top-0 w-2 h-2 ${
                  m.role === 'user' 
                    ? 'right-[-8px] border-l-[8px] border-l-primary border-b-[8px] border-b-transparent' 
                    : 'left-[-8px] border-r-[8px] border-r-white border-b-[8px] border-b-transparent'
                }`} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
              <span className="think-dot bg-primary-400" />
              <span className="think-dot bg-primary-400" />
              <span className="think-dot bg-primary-400" />
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="flex flex-col items-center gap-3">
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-2xl text-xs flex items-center gap-2 border border-red-100 shadow-sm animate-shake">
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

        <div ref={scrollRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-neutral-200 flex items-center gap-2 pb-safe">
        <button
          onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
          className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-neutral-400 hover:bg-neutral-100'}`}
        >
          {isListening ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        <div className="flex-1 relative">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={isRw ? 'Andika ubutumwa...' : 'Type a message...'}
            className="w-full pl-4 pr-12 py-3.5 bg-[#F0F2F5] rounded-3xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className={`p-3.5 rounded-full shadow-lg transition-all ${
            !input.trim() || isLoading 
              ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' 
              : 'bg-primary text-white hover:bg-primary-900 shadow-primary/20'
          }`}
        >
          {isLoading ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} />}
        </button>
      </div>
    </div>
  );
}


