import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Mic, MessageSquare, Sparkles, AlertCircle, 
  User, CheckCircle, FileText, Languages, HandMetal,
  X, ChevronDown, Download, Eye, Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SessionInterface() {
  const [messages, setMessages] = useState<any[]>([
    { role: 'doctor', content: 'Hello Ancilla, how have you been feeling since our last session?' },
    { role: 'patient', content: 'Not so good. I feel like everything I do is going to fail. It is like a dark cloud.' }
  ]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([
    "It sounds like you're experiencing 'All-or-Nothing' thinking. Can we explore that?",
    "I hear how heavy that feels. What's one small thing that went well today?",
    "Let's look at the evidence for that 'dark cloud'. Is it always there?"
  ]);
  const [distortions, setDistortions] = useState<string[]>(['Catastrophizing', 'Black-and-White Thinking']);
  const [showSignLanguage, setShowSignLanguage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'doctor', content: input }];
    setMessages(newMessages);
    setInput('');
    
    // 1. Fetch AI Suggestions & Analysis
    try {
      const res = await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/clinical/session-assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, lang: i18n.language })
      });
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.suggestions || []);
        setDistortions(data.distortions || []);
      }
    } catch (err) {
      console.error("AI Assist Error:", err);
    }

    // Simulate patient response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'patient', content: "I don't know... I just feel overwhelmed." }]);
    }, 1000);
  };

  return (
    <div className="h-full flex gap-8">
      {/* Session Chat */}
      <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-primary-50 overflow-hidden shadow-2xl shadow-primary/5">
        {/* Session Header */}
        <div className="px-8 py-5 border-b border-primary-50 flex items-center justify-between bg-primary-50/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm">🤟</div>
            <div>
              <h2 className="font-black text-primary-900">Live Session: Kanyange Ancilla</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Active · 08:42</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSignLanguage(!showSignLanguage)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                showSignLanguage ? 'bg-primary text-white' : 'bg-white border border-primary-100 text-primary-600'
              }`}
            >
              <HandMetal size={16} />
              Sign Language
            </button>
            <button className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-emerald-200">
              Complete Session
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-primary-50" ref={scrollRef}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'doctor' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] p-5 rounded-3xl text-sm font-medium leading-relaxed ${
                m.role === 'doctor' 
                  ? 'bg-primary text-white rounded-tr-none' 
                  : 'bg-neutral-50 text-primary-900 border border-primary-50 rounded-tl-none'
              }`}>
                {m.content}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-8 border-t border-primary-50 bg-neutral-50/30">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your clinical response..."
                className="w-full pl-6 pr-14 py-4 bg-white border-2 border-primary-50 rounded-[2rem] text-sm focus:border-primary outline-none shadow-sm transition-all"
              />
              <button 
                onClick={handleSend}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-primary text-white rounded-2xl hover:scale-105 transition-all"
              >
                <Send size={18} />
              </button>
            </div>
            <button className="p-4 bg-white border-2 border-primary-50 text-primary-300 rounded-[1.5rem] hover:text-primary transition-colors">
              <Mic size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Side Intelligence Panel */}
      <div className="w-80 space-y-6 flex flex-col">
        {/* AI Clinical Assistant */}
        <div className="glass-card rounded-[2.5rem] p-6 border-primary-100 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-primary" size={20} />
            <h3 className="font-black text-primary-900 text-sm uppercase tracking-widest">Claude AI Assistant</h3>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-none">
            {/* Suggestions */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-primary-300 uppercase tracking-widest px-1">Response Suggestions</p>
              {suggestions.map((s, i) => (
                <button 
                  key={i}
                  onClick={() => setInput(s)}
                  className="w-full p-4 bg-primary-50/50 border border-primary-100 rounded-2xl text-left text-xs text-primary-700 font-bold hover:bg-primary-50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Cognitive Distortions */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-primary-300 uppercase tracking-widest px-1">Distortions Detected</p>
              <div className="flex flex-wrap gap-2">
                {distortions.map((d, i) => (
                  <span key={i} className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase rounded-lg flex items-center gap-1.5">
                    <AlertCircle size={12} />
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Recommended Techniques */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-primary-300 uppercase tracking-widest px-1">CBT Techniques</p>
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                <p className="text-xs font-black text-emerald-700 mb-1">Thought Record</p>
                <p className="text-[10px] text-emerald-600 font-medium">Guide patient to write down the evidence for and against their 'dark cloud' thought.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Accessibility Preview */}
        {showSignLanguage && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="glass-card rounded-[2.5rem] overflow-hidden border-primary-200"
          >
            <div className="aspect-video bg-neutral-900 relative flex items-center justify-center">
              <div className="text-white/20 text-xs font-bold uppercase tracking-widest">Sign Language Avatar</div>
              {/* This would be an iframe or video player for the avatar */}
              <div className="absolute bottom-4 left-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
                <p className="text-[10px] text-white font-medium">Translating: {messages[messages.length-1].content}</p>
              </div>
            </div>
            <div className="p-3 bg-white flex justify-between items-center">
              <span className="text-[10px] font-black text-primary-900 uppercase">Rwandan Sign Language</span>
              <div className="flex gap-2">
                <button className="p-1.5 hover:bg-primary-50 rounded-lg text-primary"><Eye size={14} /></button>
                <button className="p-1.5 hover:bg-primary-50 rounded-lg text-primary"><X size={14} onClick={() => setShowSignLanguage(false)} /></button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Documentation Tool */}
        <div className="p-6 bg-white border border-primary-50 rounded-[2.5rem] space-y-4 shadow-xl shadow-primary/5">
          <h3 className="text-xs font-black text-primary-900 uppercase tracking-widest">Clinical Export</h3>
          <div className="grid grid-cols-2 gap-2">
            <button className="flex flex-col items-center gap-2 p-4 bg-neutral-50 rounded-2xl hover:bg-primary-50 group transition-all">
              <Download size={18} className="text-primary-300 group-hover:text-primary" />
              <span className="text-[8px] font-black text-primary-400 uppercase">Export PDF</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-neutral-50 rounded-2xl hover:bg-primary-50 group transition-all">
              <Type size={18} className="text-primary-300 group-hover:text-primary" />
              <span className="text-[8px] font-black text-primary-400 uppercase">Braille .BRF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
