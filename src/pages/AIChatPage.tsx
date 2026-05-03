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
  
  // New States for requested features
  const [isRecording, setIsRecording] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
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

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const baseUrl = (import.meta.env.VITE_RENDER_BACKEND_URL || '').replace(/\/$/, '');
      
      // 🚀 ATTEMPT 1: Primary Backend (Render)
      const response = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: userMsg.content,
          image: userMsg.image, // Now actually sending the image
          history: newMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          lang: i18n.language,
          userId: (await supabase.auth.getSession()).data.session?.user?.id
        })
      });

      if (!response.ok) throw new Error('Backend offline');
      const data = await response.json();
      addAIMessage(data.reply, newMessages);

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn("Backend failed, attempting Direct AI Fallback...");
      
      // 🛡️ ATTEMPT 2: Direct Google API Fallback (Invincible Mode)
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error('No API Key');

        const fallbackRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [
                { text: "You are Humura AI, a compassionate CBT therapy companion in Rwanda. Be empathetic and professional. If you detect the user is in a crisis, suicidal, or in immediate danger, ALWAYS direct them to call the Rwanda National Mental Health Hotline at 114 immediately." },
                ...(userMsg.image ? [{ inline_data: { mime_type: "image/jpeg", data: userMsg.image.split(',')[1] } }] : [])
              ] },
              ...newMessages.slice(-8).map(m => ({
                role: m.role === 'model' ? 'model' : 'user',
                parts: [{ text: m.content }]
              }))
            ]
          })
        });

        const data = await fallbackRes.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I am here for you. Tell me more.";
        addAIMessage(reply, newMessages);

      } catch (fallbackErr: any) {
        if (fallbackErr.name === 'AbortError') return;
        setError(isRw ? "Ibibazo by'itumanaho. Ongera ugerageze." : "Connection issue. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
    }
  };

  const deleteMessage = (idx: number) => {
    const updated = messages.filter((_, i) => i !== idx);
    setMessages(updated);
    saveHistory(updated);
  };

  const startEdit = (idx: number) => {
    setEditingId(idx);
    setInput(messages[idx].content);
  };

  const saveEdit = () => {
    if (editingId === null) return;
    const updated = [...messages];
    updated[editingId].content = input;
    updated[editingId].timestamp = new Date();
    setMessages(updated);
    saveHistory(updated);
    setEditingId(null);
    setInput('');
  };

  // Voice Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // In a real app, you'd send this blob to a Whisper API or similar
        // For now, we'll simulate a voice-to-text placeholder
        setInput(isRw ? "[Ubutumwa bw'ijwi]" : "[Voice Message]");
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const addAIMessage = (content: string, currentMsgs: Message[]) => {
    const aiMsg: Message = { role: 'model', content, timestamp: new Date() };
    const final = [...currentMsgs, aiMsg];
    setMessages(final);
    saveHistory(final);
  };

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      {/* Inline Chat Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-neutral-100 z-10 px-6 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 -ml-2 text-neutral-400"><ChevronLeft size={20} /></button>
            <div className="w-10 h-10 border border-neutral-100 rounded-2xl flex items-center justify-center p-2 shadow-sm">
              <img src="/logo.png" alt="Humura" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-black text-primary-900 leading-none">Humura AI</h1>
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
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
      </div>

      {/* Chat Messages — scrollable area */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Watermark */}
          <div className="flex flex-col items-center justify-center py-16 opacity-[0.03] pointer-events-none select-none">
            <img src="/logo.png" alt="Humura" className="w-28 h-28 grayscale" />
            <p className="text-sm font-black uppercase tracking-[0.5em] mt-6">CBT COMPANION</p>
          </div>

          {messages.map((msg, idx) => (
            <motion.div 
              key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col group ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-2xl relative transition-all ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-none shadow-lg' 
                  : 'bg-neutral-50 border border-neutral-100 text-primary-900 rounded-tl-none'
              }`}>
                {msg.image && <img src={msg.image} className="w-full rounded-xl mb-3 border border-white/10" />}
                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <div className={`text-[8px] mt-2 font-black uppercase opacity-30 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Message Actions */}
              <div className={`flex gap-3 mt-1.5 px-2 opacity-0 group-hover:opacity-100 transition-all duration-300 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'user' && (
                  <button onClick={() => startEdit(idx)} className="text-neutral-400 hover:text-primary transition-colors flex items-center gap-1">
                    <Edit2 size={12} />
                    <span className="text-[10px] font-bold uppercase">Edit</span>
                  </button>
                )}
                <button 
                  onClick={() => { navigator.clipboard.writeText(msg.content); }} 
                  className="text-neutral-400 hover:text-emerald-500 transition-colors flex items-center gap-1"
                >
                  <RefreshCcw size={12} />
                  <span className="text-[10px] font-bold uppercase">Copy</span>
                </button>
                <button onClick={() => deleteMessage(idx)} className="text-neutral-400 hover:text-red-500 transition-colors flex items-center gap-1">
                  <Trash2 size={12} />
                  <span className="text-[10px] font-bold uppercase">Delete</span>
                </button>
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

      {/* ── Input Bar — sits inside the page, above the footer, NOT floating over faces ── */}
      <div className="border-t border-neutral-100/80 bg-white/95 backdrop-blur-xl px-6 py-4 shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.06)]">
        <div className="max-w-xl mx-auto">
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2 mb-3">
              <p className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </p>
              <button onClick={handleSend} className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase hover:underline">
                <RefreshCcw size={10} /> {isRw ? 'Ongera ugerageze' : 'Try Reconnecting'}
              </button>
            </motion.div>
          )}

          <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-100 rounded-[2rem] p-1.5 shadow-sm relative pr-2">
            {previewImage && (
              <div className="absolute -top-16 left-4 p-2 bg-white border border-neutral-100 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2">
                <img src={previewImage} className="w-10 h-10 rounded-lg object-cover" />
                <button onClick={() => setPreviewImage(null)} className="p-1 bg-red-50 text-red-500 rounded-full"><X size={12} /></button>
              </div>
            )}
            
            <button onClick={() => fileInputRef.current?.click()} className="p-3 text-neutral-300 hover:text-primary transition-colors">
              <ImagePlus size={20} />
            </button>
            
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
              onKeyDown={e => e.key === 'Enter' && (editingId !== null ? saveEdit() : handleSend())}
              placeholder={isRw ? 'Andika hano...' : 'Message Humura AI...'}
              className="flex-1 px-3 py-3 bg-transparent outline-none text-sm font-semibold text-primary-900 placeholder:text-neutral-300"
            />

            <button 
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-3 transition-all ${isRecording ? 'text-red-500 animate-pulse' : 'text-neutral-300 hover:text-primary'}`}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {isLoading ? (
              <button 
                onClick={stopGeneration}
                className="w-11 h-11 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-100 transition-all border border-red-100"
                title={isRw ? 'Hagarika' : 'Stop'}
              >
                <Square size={16} fill="currentColor" />
              </button>
            ) : (
              <button 
                onClick={editingId !== null ? saveEdit : handleSend}
                disabled={!input.trim() && !previewImage}
                className="w-11 h-11 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
              >
                {editingId !== null ? <CheckCircle size={20} /> : <Send size={20} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
