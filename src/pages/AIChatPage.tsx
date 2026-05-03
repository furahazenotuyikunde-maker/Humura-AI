import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, AlertCircle, Loader2, Mic, MicOff, 
  ImagePlus, Square, Edit2, X, Trash2,
  CheckCircle, RefreshCcw, ChevronLeft, Star, Bell, LogOut
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

const MOODS = [
  { emoji: '😊', label: 'Calm',     labelRw: 'Amahoro' },
  { emoji: '😰', label: 'Anxious',  labelRw: 'Impungenge' },
  { emoji: '🌱', label: 'Hopeful',  labelRw: 'Ibyiringiro' },
  { emoji: '😔', label: 'Sad',      labelRw: 'Agahinda' },
  { emoji: '😓', label: 'Tired',    labelRw: 'Umunaniro' },
  { emoji: '🙏', label: 'Grateful', labelRw: 'Gukenguruka' },
];

const AFFIRMATIONS = [
  "You are worthy of healing. Every small step forward is progress worth celebrating.",
  "Healing is not linear. Be patient with yourself.",
  "Your feelings are valid. You deserve care and compassion.",
  "Today, choose to be kind to yourself. You are doing your best.",
  "You are stronger than you know. Keep going — one breath at a time.",
];

export default function AIChatPage() {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const navigate = useNavigate();

  // Dark mode
  const [isDark, setIsDark] = useState(() => {
    const s = localStorage.getItem('Humura_settings_v2');
    return s ? JSON.parse(s).darkMode === true : false;
  });

  useEffect(() => {
    const sync = () => {
      const s = localStorage.getItem('Humura_settings_v2');
      setIsDark(s ? JSON.parse(s).darkMode === true : false);
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [sessionNum] = useState(1);
  const [sessionTime] = useState(() => new Date());
  const [affirmation] = useState(() => AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
  const [profile, setProfile] = useState<any>(null);

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
  }, []);

  const loadHistory = () => {
    const saved = localStorage.getItem('humura_chat_history_v5');
    if (saved) {
      const parsed = JSON.parse(saved);
      setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
    } else {
      setMessages([{
        role: 'model',
        content: isRw
          ? "Muraho! Jyewe ndi Humura AI, mugenzi wawe mu rugendo rwo gutura umutwaro. Nshobora kugufasha uyu munsi mu buryo bwa CBT. Umeze ute?"
          : "Hello! I am Humura AI, your companion in this journey of healing. I am here to support you with CBT-based guidance. How are you feeling right now?",
        timestamp: new Date()
      }]);
    }
  };

  const saveHistory = (msgs: Message[]) =>
    localStorage.setItem('humura_chat_history_v5', JSON.stringify(msgs));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedMood]);

  const handleSelectMood = async (mood: typeof MOODS[0]) => {
    setSelectedMood(mood.label);
    const content = isRw
      ? `Ubu numva: ${mood.emoji} ${mood.labelRw}`
      : `My current mood: ${mood.emoji} ${mood.label}`;
    await sendMessage(content);
  };

  const sendMessage = async (overrideContent?: string) => {
    const msgContent = overrideContent ?? input;
    if (!msgContent.trim() && !previewImage) return;
    setError(null);
    const userMsg: Message = { role: 'user', content: msgContent, image: previewImage || undefined, timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setPreviewImage(null);
    setIsLoading(true);
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const baseUrl = (import.meta.env.VITE_RENDER_BACKEND_URL || '').replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: userMsg.content,
          image: userMsg.image,
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
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error('No API Key');
        const fallbackRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [
                { role: 'user', parts: [{ text: "You are Humura AI, a compassionate CBT therapy companion in Rwanda." }] },
                ...newMessages.slice(-8).map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.content }] }))
              ]
            })
          }
        );
        const data = await fallbackRes.json();
        addAIMessage(data.candidates?.[0]?.content?.parts?.[0]?.text || "I am here for you. Tell me more.", newMessages);
      } catch (fe: any) {
        if (fe.name !== 'AbortError') setError(isRw ? "Ibibazo by'itumanaho." : "Connection issue. Please try again.");
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
  const addAIMessage = (content: string, currentMsgs: Message[]) => {
    const final = [...currentMsgs, { role: 'model' as const, content, timestamp: new Date() }];
    setMessages(final); saveHistory(final);
  };
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = e => audioChunksRef.current.push(e.data);
      recorder.onstop = () => { setInput(isRw ? "[Ubutumwa bw'ijwi]" : "[Voice Message]"); stream.getTracks().forEach(t => t.stop()); };
      recorder.start();
      setIsRecording(true);
    } catch {}
  };
  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };

  // Colour tokens
  const dk = isDark;
  const bg       = dk ? 'bg-[#0d1117]'  : 'bg-white';
  const surface  = dk ? 'bg-[#131c2e]'  : 'bg-neutral-50';
  const border   = dk ? 'border-[#1f2d47]' : 'border-neutral-100';
  const textPri  = dk ? 'text-[#e2e8f0]' : 'text-primary-900';
  const textMut  = dk ? 'text-[#6b7a99]' : 'text-neutral-400';
  const aiBubble = dk ? 'bg-[#0f2d22] border-[#1a4a35]' : 'bg-neutral-50 border-neutral-100';
  const inputBg  = dk ? 'bg-[#131c2e] border-[#1f2d47]' : 'bg-neutral-50 border-neutral-100';
  const sendBtn  = dk ? 'bg-gradient-to-br from-[#34d399] to-[#6366f1]' : 'bg-primary';

  const initials = profile?.full_name ? profile.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'U';

  return (
    <div className={`flex flex-col ${bg} ${textPri} transition-colors duration-300`} style={{ minHeight: 'calc(100vh - 4rem)' }}>

      {/* ── Sticky Header ── */}
      <div className={`sticky top-0 z-10 ${dk ? 'bg-[#0d1117]/95 border-[#1f2d47]' : 'bg-white/90 border-neutral-100'} border-b backdrop-blur-md px-6 py-3`}>
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className={`p-2 -ml-2 ${textMut}`}><ChevronLeft size={20} /></button>
            <span className={`text-lg font-bold italic tracking-tight ${dk ? 'text-[#e2e8f0]' : 'text-primary-900'}`}>CBT Companion</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <div className={`flex items-center rounded-full p-1 border ${dk ? 'bg-[#1a2543] border-[#1f2d47]' : 'bg-primary-50 border-primary-100'}`}>
              {['en', 'rw'].map(lang => (
                <button key={lang} onClick={() => i18n.changeLanguage(lang)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    i18n.language?.startsWith(lang) ? 'bg-primary text-white shadow' : dk ? 'text-[#6b7a99] hover:bg-[#1f2d47]' : 'text-primary-600 hover:bg-primary-100'
                  }`}>
                  {lang === 'en' ? 'English' : 'Kinyarwanda'}
                </button>
              ))}
            </div>
            <button onClick={() => { setMessages([]); localStorage.removeItem('humura_chat_history_v5'); loadHistory(); setSelectedMood(null); }}
              className={`p-2 ${dk ? 'text-[#3d4f6b] hover:text-red-400' : 'text-neutral-200 hover:text-red-500'} transition-colors`}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Session Info Bar ── */}
      <div className={`text-center py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] ${dk ? 'text-[#3d4f6b] border-b border-[#1f2d47]' : 'text-neutral-300 border-b border-neutral-50'}`}>
        {isRw ? 'Uyu munsi' : 'Today'} · Session {sessionNum} ·{' '}
        {sessionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-xl mx-auto space-y-5">

          {messages.map((msg, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 group ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

              {/* Avatar */}
              {msg.role === 'model' ? (
                <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold ${dk ? 'bg-gradient-to-br from-[#6366f1] to-[#34d399] text-white' : 'bg-primary text-white'}`}>H</div>
              ) : (
                <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-black ${dk ? 'bg-[#1a2543] text-[#34d399]' : 'bg-primary-50 text-primary'}`}>{initials}</div>
              )}

              <div className="flex flex-col max-w-[80%]">
                <div className={`p-4 rounded-2xl border ${msg.role === 'user'
                  ? dk ? 'bg-[#1a4a35] border-[#2a6a50] text-[#e2e8f0] rounded-tr-none' : 'bg-primary text-white border-transparent rounded-tr-none'
                  : `${aiBubble} ${textPri} rounded-tl-none`}`}>
                  {msg.image && <img src={msg.image} className="w-full rounded-xl mb-3" />}
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[9px] font-bold uppercase mt-2 ${msg.role === 'user' ? 'text-right opacity-50' : `${textMut} opacity-70`}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Hover actions */}
                <div className={`flex gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-all ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'user' && (
                    <button onClick={() => startEdit(idx)} className={`${textMut} hover:text-primary flex items-center gap-1 text-[10px] font-bold uppercase`}>
                      <Edit2 size={10} /> Edit
                    </button>
                  )}
                  <button onClick={() => navigator.clipboard.writeText(msg.content)} className={`${textMut} hover:text-emerald-500 flex items-center gap-1 text-[10px] font-bold uppercase`}>
                    <RefreshCcw size={10} /> Copy
                  </button>
                  <button onClick={() => deleteMessage(idx)} className={`${textMut} hover:text-red-500 flex items-center gap-1 text-[10px] font-bold uppercase`}>
                    <Trash2 size={10} /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {/* ── Mood Selector (shows after welcome, before first user msg) ── */}
          {messages.length === 1 && !selectedMood && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 ml-12">
              <p className={`text-sm font-semibold ${textMut}`}>
                {isRw ? 'Hitamo uko umeze ubu:' : 'Select your current mood:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {MOODS.map(mood => (
                  <button key={mood.label} onClick={() => handleSelectMood(mood)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold border transition-all hover:scale-105 active:scale-95 ${
                      dk ? 'bg-[#131c2e] border-[#1f2d47] text-[#a0aec0] hover:border-[#34d399] hover:text-[#34d399]'
                         : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-primary hover:text-primary'}`}>
                    {mood.emoji} {isRw ? mood.labelRw : mood.label}
                  </button>
                ))}
              </div>

              {/* Daily Affirmation Card */}
              <div className={`p-4 rounded-2xl border ${dk ? 'bg-[#1a1b40] border-[#2d2f6e]' : 'bg-violet-50 border-violet-100'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Star size={14} className={dk ? 'text-[#818cf8]' : 'text-violet-500'} />
                  <span className={`text-xs font-black uppercase tracking-widest ${dk ? 'text-[#818cf8]' : 'text-violet-500'}`}>
                    {isRw ? 'Ijambo ry\'uyu munsi' : 'Daily affirmation'}
                  </span>
                </div>
                <p className={`text-sm italic leading-relaxed font-medium ${dk ? 'text-[#a5b4fc]' : 'text-violet-700'}`}>
                  "{affirmation}"
                </p>
              </div>
            </motion.div>
          )}

          {isLoading && (
            <div className={`flex items-center gap-3 ml-12 ${textMut}`}>
              <Loader2 size={14} className="animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest">
                {isRw ? 'Ubutumwa burimo kuza...' : 'AI is responding...'}
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input Bar ── */}
      <div className={`border-t ${border} ${dk ? 'bg-[#0d1117]/95' : 'bg-white/95'} backdrop-blur-xl px-4 py-4`}>
        <div className="max-w-xl mx-auto">
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-1.5 mb-3">
              <p className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <AlertCircle size={12} /> {error}
              </p>
              <button onClick={handleSend} className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase hover:underline">
                <RefreshCcw size={10} /> {isRw ? 'Ongera ugerageze' : 'Try Reconnecting'}
              </button>
            </motion.div>
          )}

          <div className={`flex items-center gap-2 ${inputBg} border rounded-[2rem] p-1.5 relative`}>
            {previewImage && (
              <div className={`absolute -top-16 left-4 p-2 ${dk ? 'bg-[#131c2e] border-[#1f2d47]' : 'bg-white border-neutral-100'} border rounded-xl shadow-xl flex items-center gap-2`}>
                <img src={previewImage} className="w-10 h-10 rounded-lg object-cover" />
                <button onClick={() => setPreviewImage(null)} className="p-1 bg-red-500/10 text-red-400 rounded-full"><X size={12} /></button>
              </div>
            )}

            <button onClick={() => fileInputRef.current?.click()} className={`p-3 ${textMut} hover:text-primary transition-colors`}>
              <ImagePlus size={20} />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
              const file = e.target.files?.[0];
              if (file) { const r = new FileReader(); r.onloadend = () => setPreviewImage(r.result as string); r.readAsDataURL(file); }
            }} />

            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={isRw ? 'Andika hano...' : 'Message Humura AI...'}
              className={`flex-1 px-2 py-3 bg-transparent outline-none text-sm font-semibold ${textPri} placeholder:${textMut}`}
            />

            <button onClick={isRecording ? stopRecording : startRecording}
              className={`p-3 transition-all ${isRecording ? 'text-red-400 animate-pulse' : `${textMut} hover:text-primary`}`}>
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {isLoading ? (
              <button onClick={stopGeneration}
                className="w-11 h-11 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full flex items-center justify-center hover:bg-red-500/20 transition-all">
                <Square size={15} fill="currentColor" />
              </button>
            ) : (
              <button onClick={handleSend} disabled={!input.trim() && !previewImage}
                className={`w-11 h-11 ${sendBtn} text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:grayscale`}>
                {editingId !== null ? <CheckCircle size={18} /> : <Send size={18} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
