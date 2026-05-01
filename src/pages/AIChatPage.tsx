import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, User, AlertCircle, Loader2, Mic, MicOff, 
  ImagePlus, Square, Edit2, X, Trash2, Languages,
  ClipboardList, CheckCircle, Sparkles, Heart, Activity
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pendingHomework, setPendingHomework] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHistory();
    fetchHomework();
  }, []);

  const loadHistory = () => {
    const saved = localStorage.getItem('humura_chat_history_v3');
    if (saved) {
      const parsed = JSON.parse(saved);
      setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
    } else {
      // Initial Greeting
      setMessages([{
        role: 'model',
        content: isRw ? "Muraho! Jyewe ndi Humura AI, mugenzi wawe mu rugendo rwo gutura umutwaro. Nshobora kugufasha uyu munsi mu buryo bwa CBT. Umeze ute?" : "Hello! I am Humura AI, your companion in this journey of healing. I am here to support you with CBT-based guidance. How are you feeling right now?",
        timestamp: new Date()
      }]);
    }
  };

  const fetchHomework = async () => {
    // In a real scenario, this would fetch from 'cbt_homework' table
    setPendingHomework({
      id: 'task-1',
      title: isRw ? 'Imyitwarire n\'Imitekerereze' : 'Morning Thought Record',
      desc: isRw ? 'Andika ibintu bitatu uyu munsi wumva biguhangayikishije.' : 'Write down 3 things making you anxious today.',
      type: 'thought_record'
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const saveHistory = (msgs: Message[]) => {
    localStorage.setItem('humura_chat_history_v3', JSON.stringify(msgs));
  };

  const handleSend = async (overrideInput?: string) => {
    const text = overrideInput || input;
    if (!text.trim() && !previewImage) return;

    const userMsg: Message = { 
      role: 'user', 
      content: text, 
      image: previewImage || undefined,
      timestamp: new Date() 
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setPreviewImage(null);
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userId: session?.user?.id,
          image: userMsg.image,
          history: newMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          lang: i18n.language
        })
      });

      if (!response.ok) throw new Error('Network error');
      const data = await response.json();

      const aiMsg: Message = {
        role: 'model',
        content: data.reply,
        timestamp: new Date()
      };

      const finalMsgs = [...newMessages, aiMsg];
      setMessages(finalMsgs);
      saveHistory(finalMsgs);

      // Trigger Crisis Check if needed
      if (data.isCrisis) {
        triggerCrisisAlert(text);
      }

    } catch (err: any) {
      setError(isRw ? "Ibibazo by'itumanaho. Ongera ugerageze." : "Connection issue. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerCrisisAlert = async (text: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/api/crisis/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: user.id,
        type: 'AI_DETECTED',
        lastMsg: text
      })
    });
  };

  const handleHomeworkSubmit = async (val: string) => {
    if (!val.trim()) return;
    setPendingHomework(null);
    handleSend(`[COMPLETED ${pendingHomework.title}]: ${val}`);
  };

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col pt-20">
      {/* --- CBT Top Bar --- */}
      <div className="bg-white border-b border-[#E8E1DB] px-6 py-3 flex items-center justify-between sticky top-20 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-[#4A2C1A]">{isRw ? 'Ubufasha bwa CBT' : 'Interactive CBT Companion'}</h2>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
              <Activity size={10} /> {isRw ? 'Ikirere Kiratekanye' : 'Safe Space Active'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
           <button className="p-2 text-neutral-400 hover:text-primary transition-colors"><Languages size={18} /></button>
           <button 
            onClick={() => { setMessages([]); localStorage.removeItem('humura_chat_history_v3'); loadHistory(); }}
            className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
           >
            <Trash2 size={18} />
           </button>
        </div>
      </div>

      {/* --- Chat Feed --- */}
      <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-32 pt-6">
        <AnimatePresence>
          {pendingHomework && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-primary-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-primary/20 space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <ClipboardList size={24} className="text-primary-200" />
                </div>
                <div>
                  <h3 className="text-lg font-black">{pendingHomework.title}</h3>
                  <p className="text-xs text-primary-200 font-medium">{pendingHomework.desc}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder={isRw ? 'Andika hano...' : 'Type your reflection...'}
                  onKeyDown={(e: any) => e.key === 'Enter' && handleHomeworkSubmit(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-sm outline-none focus:bg-white/20 transition-all font-bold placeholder:text-white/40"
                />
                <button className="w-14 h-14 bg-white text-primary-900 rounded-2xl flex items-center justify-center shadow-lg"><CheckCircle size={24} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.map((msg, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-[85%] p-5 rounded-3xl relative group ${
              msg.role === 'user' 
                ? 'bg-primary text-white rounded-tr-none shadow-xl shadow-primary/10' 
                : 'bg-white border border-[#E8E1DB] text-[#4A2C1A] rounded-tl-none shadow-sm'
            }`}>
              {msg.image && (
                <img src={msg.image} alt="Upload" className="w-full max-h-64 object-cover rounded-2xl mb-3 border border-black/5" />
              )}
              <p className="text-sm font-bold leading-relaxed">{msg.content}</p>
              <div className={`text-[9px] mt-2 font-black uppercase tracking-widest opacity-40 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 text-neutral-400">
            <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
              <Loader2 size={16} className="animate-spin" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest">{isRw ? 'Humura AI aratekereza...' : 'Humura AI is thinking...'}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* --- Controls --- */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#FDFCFB] via-[#FDFCFB] to-transparent">
        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence>
            {previewImage && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative w-20 h-20">
                <img src={previewImage} className="w-full h-full object-cover rounded-2xl border-2 border-primary" />
                <button onClick={() => setPreviewImage(null)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"><X size={12} /></button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white border border-[#E8E1DB] rounded-[2rem] p-2 flex items-center shadow-xl shadow-black/5">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-neutral-400 hover:text-primary transition-colors"
              >
                <ImagePlus size={22} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onImageChange} />
              
              <input 
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={isRw ? 'Andika hano...' : 'Share your thoughts...'}
                className="flex-1 px-4 py-3 bg-transparent outline-none text-sm font-bold text-[#4A2C1A] placeholder:text-neutral-300"
              />

              <button 
                onClick={() => setIsRecording(!isRecording)}
                className={`p-3 rounded-full transition-all ${isRecording ? 'bg-red-50 text-red-500 animate-pulse' : 'text-neutral-400 hover:text-primary'}`}
              >
                {isRecording ? <Square size={22} /> : <Mic size={22} />}
              </button>
            </div>

            <button 
              onClick={() => handleSend()}
              disabled={isLoading || (!input.trim() && !previewImage)}
              className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <Send size={24} />
            </button>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest">
              <AlertCircle size={14} /> {error}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
