import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, User, AlertCircle, Loader2, Mic, MicOff, 
  ImagePlus, Square, Edit2, X, Trash2, Languages,
  ClipboardList, CheckCircle, Sparkles, Heart, Activity,
  RefreshCcw, ChevronLeft
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface Message {
  role: 'user' | 'model';
  content: string;
  translated?: string;
  image?: string;
  timestamp: Date;
}

export default function AIChatPage() {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const saved = localStorage.getItem('humura_chat_history_v5');
    if (saved) {
      const parsed = JSON.parse(saved);
      setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
    } else {
      setMessages([{
        role: 'model',
        content: isRw ? "Muraho! Jyewe ndi Humura AI, mugenzi wawe mu rugendo rwo gutura umutwaro. Nshobora kugufasha uyu munsi mu buryo bwa CBT. Umeze ute?" : "Hello! I am Humura AI, your companion in this journey of healing. I am here to support you with CBT-based guidance. How are you feeling right now?",
        timestamp: new Date()
      }]);
    }
  };

  const saveHistory = (msgs: Message[]) => {
    localStorage.setItem('humura_chat_history_v5', JSON.stringify(msgs));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && !previewImage) return;

    setError(null);
    const userMsg: Message = { 
      role: 'user', 
      content: input, 
      image: previewImage || undefined,
      timestamp: new Date() 
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setPreviewImage(null);
    setIsLoading(true);

    try {
      const baseUrl = (import.meta.env.VITE_RENDER_BACKEND_URL || '').replace(/\/$/, '');
      
      // 🚀 ATTEMPT 1: Primary Backend (Render)
      const response = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history: newMessages.slice(-4).map(m => ({ role: m.role, content: m.content })),
          lang: i18n.language,
          userId: (await supabase.auth.getSession()).data.session?.user?.id
        })
      });

      if (!response.ok) throw new Error('Backend offline');
      const data = await response.json();
      addAIMessage(data.reply, newMessages);

    } catch (err: any) {
      console.warn("Backend failed, attempting Direct AI Fallback...");
      
      // 🛡️ ATTEMPT 2: Direct Google API Fallback (Invincible Mode)
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error('No API Key');

        const fallbackRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: "You are Humura AI, a compassionate CBT therapy companion in Rwanda. Be empathetic and professional." }] },
              ...newMessages.slice(-6).map(m => ({
                role: m.role === 'model' ? 'model' : 'user',
                parts: [{ text: m.content }]
              }))
            ]
          })
        });

        const data = await fallbackRes.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I am here for you. Tell me more.";
        addAIMessage(reply, newMessages);

      } catch (fallbackErr) {
        setError(isRw ? "Ibibazo by'itumanaho. Ongera ugerageze." : "Connection issue. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addAIMessage = (content: string, currentMsgs: Message[]) => {
    const aiMsg: Message = { role: 'model', content, timestamp: new Date() };
    const final = [...currentMsgs, aiMsg];
    setMessages(final);
    saveHistory(final);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pt-20">
      {/* Header */}
      <header className="fixed top-20 inset-x-0 bg-white/80 backdrop-blur-md border-b border-neutral-100 z-[40] px-6 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 -ml-2 text-neutral-400"><ChevronLeft size={20} /></button>
            <div className="w-10 h-10 border border-neutral-100 rounded-2xl flex items-center justify-center p-2 shadow-sm">
              <img src="/logo.png" alt="Humura" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-black text-primary-900 leading-none">Humura AI</h1>
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isRw ? 'Ikirere Kiratekanye' : 'Safe Space Active'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => { setMessages([]); localStorage.removeItem('humura_chat_history_v5'); loadHistory(); }}
            className="p-2 text-neutral-200 hover:text-red-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-40 pt-10">
        <div className="max-w-xl mx-auto">
           {/* Center Logo Placeholder */}
           <div className="flex flex-col items-center justify-center py-20 opacity-[0.03] pointer-events-none">
            <img src="/logo.png" alt="Humura" className="w-32 h-32 grayscale" />
            <p className="text-sm font-black uppercase tracking-[0.5em] mt-6">CBT COMPANION</p>
          </div>

          {messages.map((msg, idx) => (
            <motion.div 
              key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col mb-6 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[90%] p-5 rounded-3xl relative ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-none shadow-xl shadow-primary/10' 
                  : 'bg-neutral-50 border border-neutral-100 text-primary-900 rounded-tl-none shadow-sm'
              }`}>
                {msg.image && <img src={msg.image} className="w-full rounded-2xl mb-3" />}
                <p className="text-sm font-bold leading-relaxed">{msg.content}</p>
                <div className={`text-[8px] mt-2 font-black uppercase opacity-30 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-neutral-300">
              <Loader2 size={16} className="animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest">{isRw ? 'Ubutumwa burimo kuza...' : 'AI is responding...'}</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Controls */}
      <div className="fixed bottom-0 inset-x-0 p-6 z-[50] bg-white">
        <div className="max-w-xl mx-auto">
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2 mb-4">
               <p className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={14} /> {error}
               </p>
               <button onClick={handleSend} className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase hover:underline">
                 <RefreshCcw size={10} /> {isRw ? 'Ongera ugerageze' : 'Try Reconnecting'}
               </button>
            </motion.div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 bg-neutral-50 border border-neutral-100 rounded-[2rem] p-2 flex items-center shadow-sm">
              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-neutral-300 hover:text-primary"><ImagePlus size={20} /></button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setPreviewImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
              <input 
                type="text" value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={isRw ? 'Andika hano...' : 'Message Humura AI...'}
                className="flex-1 px-4 py-3 bg-transparent outline-none text-sm font-bold text-primary-900 placeholder:text-neutral-300"
              />
            </div>
            <button 
              onClick={handleSend} disabled={isLoading}
              className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Send size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
