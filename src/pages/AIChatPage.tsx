import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, User, AlertCircle, Loader2, Mic, MicOff, 
  ImagePlus, Square, Edit2, X, Trash2, Languages,
  ClipboardList, CheckCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';

interface Message {
  role: 'user' | 'model';
  content: string;
  translated?: string;
  image?: string;
}

const AIChatPage: React.FC = () => {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingHomework, setPendingHomework] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const STORAGE_KEY = 'humura_chat_history';

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setMessages(JSON.parse(saved));
    fetchHomework();
  }, []);

  const fetchHomework = async () => {
    // Mocking a pending homework for demo
    setPendingHomework({
      id: 'task-1',
      title: isRw ? 'Andika ibyo utekereza' : 'Morning thought record',
      desc: isRw ? 'Andika ibintu bitatu wumva biguteye impungenge uyu munsi.' : 'Write down 3 things making you anxious today.'
    });
  };

  const handleTranslate = async (index: number) => {
    const msg = messages[index];
    if (msg.translated) return;
    
    setIsTranslating(index);
    try {
      const res = await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/api/ai/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg.content, targetLang: isRw ? 'en' : 'rw' })
      });
      const data = await res.json();
      const updated = [...messages];
      updated[index].translated = data.translated;
      setMessages(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTranslating(null);
    }
  };

  const handleHomeworkSubmit = async (response: string) => {
    setIsLoading(true);
    try {
      // 1. Submit to AI for observation
      const res = await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/api/ai/homework-observation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: pendingHomework.title, response })
      });
      const data = await res.json();
      
      // 2. Add to chat history
      setMessages(prev => [...prev, 
        { role: 'user', content: `[HOMEWORK] ${pendingHomework.title}: ${response}` },
        { role: 'model', content: isRw ? 'Urakoze kurangiza uyu mukoro. Muganga wawe azabibona.' : 'Thank you for completing this task. Your doctor has been notified.' }
      ]);
      setPendingHomework(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, userId: session?.user?.id, lang: i18n.language })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
    } catch (e) {
      setError('Chat error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col pt-20">
      {/* Homework Banner */}
      <AnimatePresence>
        {pendingHomework && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-primary-900 text-white p-6 mx-4 mb-4 rounded-3xl shadow-xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="text-primary-300" />
              <div>
                <h3 className="font-black text-sm">{pendingHomework.title}</h3>
                <p className="text-xs text-primary-200">{pendingHomework.desc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder={isRw ? 'Andika hano...' : 'Type your response...'}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm outline-none focus:bg-white/20"
                onKeyDown={(e: any) => e.key === 'Enter' && handleHomeworkSubmit(e.target.value)}
              />
              <button className="p-2 bg-primary rounded-xl"><CheckCircle size={20} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-24">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl relative group ${
              msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white border-2 border-neutral-100 text-primary-900 rounded-tl-none shadow-sm'
            }`}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
              
              {msg.translated && (
                <p className="text-xs mt-2 pt-2 border-t border-black/10 italic opacity-80">
                  <Languages size={10} className="inline mr-1" /> {msg.translated}
                </p>
              )}

              <button 
                onClick={() => handleTranslate(idx)}
                className={`absolute ${msg.role === 'user' ? '-left-8' : '-right-8'} top-1/2 -translate-y-1/2 p-1.5 bg-neutral-100 text-neutral-400 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:text-primary`}
              >
                {isTranslating === idx ? <Loader2 size={12} className="animate-spin" /> : <Languages size={12} />}
              </button>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-neutral-400 text-xs italic">
            <Loader2 size={14} className="animate-spin" />
            {isRw ? 'Humura AI aratekereza...' : 'Humura AI is thinking...'}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-neutral-100">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={isRw ? 'Andika ubutumwa...' : 'Message Humura AI...'}
            className="flex-1 bg-neutral-50 border-2 border-transparent focus:border-primary/20 rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all"
          />
          <button 
            onClick={handleSend}
            className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
