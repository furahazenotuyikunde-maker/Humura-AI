import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  MessageSquare, Sparkles, AlertCircle, 
  User, CheckCircle, FileText, HandMetal,
  Settings, Maximize2, MoreVertical, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  session: any;
  onEnd: () => void;
  role: 'doctor' | 'patient';
}

export default function VideoConsultationRoom({ session, onEnd, role }: Props) {
  const { t, i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSignLanguage, setShowSignLanguage] = useState(false);
  const [showNotes, setShowNotes] = useState(role === 'doctor');
  const [messages, setMessages] = useState<any[]>([
    { role: 'system', content: isRw ? 'Guhura kwatangiye' : 'Session started' }
  ]);
  const [input, setInput] = useState('');
  const [timer, setTimer] = useState(0);

  // SOAP Notes State (Doctor only)
  const [soapNotes, setSoapNotes] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });

  useEffect(() => {
    const interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role, content: input }]);
    setInput('');
  };

  return (
    <div className="fixed inset-0 bg-neutral-950 z-[100] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-20 bg-neutral-900/50 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-black">H</div>
          <div>
            <h2 className="text-white font-bold text-sm">
              {role === 'doctor' ? (isRw ? 'Ubuvuzi bwa' : 'Consultation with') : (isRw ? 'Guhura na' : 'Session with')} 
              <span className="text-primary-400 ml-1">{role === 'doctor' ? session?.profiles?.full_name : 'Dr. Kalisa'}</span>
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{formatTime(timer)}</span>
              <div className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter">AI Triage: Stable</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button className="p-3 text-white/60 hover:text-white transition-colors"><Settings size={20} /></button>
           <div className="h-6 w-[1px] bg-white/10 mx-2" />
           <button 
             onClick={onEnd}
             className="px-6 py-2.5 bg-red-600 text-white font-black text-xs uppercase rounded-xl shadow-lg shadow-red-900/20 hover:bg-red-500 transition-all flex items-center gap-2"
           >
             <PhoneOff size={16} />
             {isRw ? 'Sohoka' : 'End Call'}
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 relative p-6 bg-black">
          {/* Main Feed (The other person) */}
          <div className="w-full h-full rounded-[3rem] bg-neutral-900 overflow-hidden relative group border border-white/5 shadow-inner">
            {/* Connection Status Indicator */}
            <div className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-white uppercase tracking-tighter">Secure Connection Active</span>
            </div>

            {/* Placeholder for Remote Stream */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10">
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }} 
                transition={{ duration: 4, repeat: Infinity }}
                className="w-32 h-32 rounded-full bg-neutral-800 flex items-center justify-center text-5xl mb-6 shadow-2xl border-4 border-white/5"
              >
                {role === 'doctor' ? '👤' : '👨‍⚕️'}
              </motion.div>
              <h3 className="text-white font-black text-xl mb-2">{role === 'doctor' ? session?.profiles?.full_name : 'Dr. Kalisa'}</h3>
              <p className="text-white/40 font-bold text-sm max-w-xs">
                {isRw ? 'Warindiriye ko umurwayi yinjira mu kiganiro...' : 'Waiting for patient to join the secure session...'}
              </p>
            </div>
            
            {/* Mirror Feed (Self) */}
            <div className="absolute top-6 right-6 w-48 aspect-video bg-neutral-800 rounded-2xl border-2 border-primary/50 shadow-2xl overflow-hidden z-20">
               {isCameraOff ? (
                 <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                    <VideoOff size={24} className="text-white/20" />
                 </div>
               ) : (
                 <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
                    <div className="w-full h-full bg-gradient-to-tr from-neutral-800 to-neutral-700 flex items-center justify-center">
                      <span className="text-white/20 text-[10px] font-black uppercase tracking-widest">Self View</span>
                    </div>
                 </div>
               )}
            </div>

            {/* Sign Language Overlay */}
            <AnimatePresence>
              {showSignLanguage && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="absolute bottom-6 right-6 w-80 aspect-video bg-neutral-900/90 backdrop-blur-2xl rounded-3xl border-2 border-primary shadow-[0_0_50px_rgba(var(--color-primary),0.3)] overflow-hidden z-40"
                >
                  <div className="w-full h-full relative flex items-center justify-center bg-neutral-800/50">
                    <div className="text-center">
                      <div className="text-3xl mb-2 animate-bounce">🤟</div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">SL Interpreter (Live)</p>
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                        <span className="text-[8px] text-emerald-500 font-black uppercase">Gesture Ready</span>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                        <p className="text-[10px] text-white font-bold italic truncate">
                          {messages[messages.length-1]?.content || 'Waiting for dialogue...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* In-Video Controls */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 bg-black/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 z-30">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                aria-label={isMuted ? "Unmute" : "Mute"}
                className={`p-5 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white shadow-lg shadow-red-900/40' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              <button 
                onClick={() => setIsCameraOff(!isCameraOff)}
                aria-label={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                className={`p-5 rounded-full transition-all ${isCameraOff ? 'bg-red-500 text-white shadow-lg shadow-red-900/40' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {isCameraOff ? <VideoOff size={24} /> : <Video size={24} />}
              </button>
              <button 
                onClick={() => setShowChat(!showChat)}
                aria-label="Toggle Chat"
                className={`p-5 rounded-full transition-all ${showChat ? 'bg-primary text-white shadow-lg shadow-primary/40' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                <MessageSquare size={24} />
              </button>
              {role === 'doctor' && (
                <button 
                  onClick={() => setShowNotes(!showNotes)}
                  aria-label="Toggle Clinical Notes"
                  className={`p-5 rounded-full transition-all ${showNotes ? 'bg-primary text-white shadow-lg shadow-primary/40' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  <FileText size={24} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel (Doctor Only or Chat) */}
        <AnimatePresence>
          {(showChat || (role === 'doctor' && showNotes)) && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-white border-l border-neutral-100 flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="flex border-b border-neutral-100 bg-neutral-50/50">
                {role === 'doctor' && (
                  <button 
                    onClick={() => { setShowNotes(true); setShowChat(false); }}
                    className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${showNotes ? 'text-primary bg-white border-b-2 border-primary shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FileText size={14} />
                      Clinical Notes
                    </div>
                  </button>
                )}
                <button 
                  onClick={() => { setShowNotes(false); setShowChat(true); }}
                  className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${showChat ? 'text-primary bg-white border-b-2 border-primary shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <MessageSquare size={14} />
                    Session Chat
                  </div>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {showNotes && role === 'doctor' ? (
                  <div className="space-y-8">
                    <div className="space-y-6">
                       <div>
                         <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Subjective (Patient's Voice)</label>
                         <textarea 
                           className="w-full p-5 bg-neutral-50 rounded-3xl text-sm border-2 border-transparent focus:border-primary outline-none transition-all h-32 resize-none shadow-inner"
                           placeholder="Enter patient feelings, complaints, and mood descriptions..."
                           value={soapNotes.subjective}
                           onChange={e => setSoapNotes({...soapNotes, subjective: e.target.value})}
                         />
                       </div>
                       <div>
                         <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">AI Clinical Insights</label>
                         <div className="bg-gradient-to-br from-primary/5 to-indigo-50 p-6 rounded-[2rem] border border-primary/10 relative overflow-hidden group">
                           <div className="relative z-10">
                             <div className="flex items-center justify-between mb-4">
                               <div className="flex items-center gap-2">
                                 <Sparkles size={16} className="text-primary" />
                                 <span className="text-[10px] font-black text-primary uppercase tracking-widest">Real-Time Analysis</span>
                               </div>
                               <div className="px-2 py-0.5 bg-primary/10 rounded-full text-[8px] font-black text-primary uppercase">Active</div>
                             </div>
                             <p className="text-xs text-neutral-900 font-bold leading-relaxed">
                               {soapNotes.subjective.length > 20 
                                 ? "AI detects recurring themes of 'isolation'. Recommended: Screen for adjustment disorder and provide visual coping tools."
                                 : "Waiting for clinical input to provide deep insights..."}
                             </p>
                           </div>
                           <Sparkles size={60} className="absolute -bottom-6 -right-6 text-primary/5 group-hover:scale-110 transition-transform" />
                         </div>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    <div className="flex-1 space-y-4">
                      {messages.map((m, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, x: m.role === role ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex ${m.role === role ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-bold leading-relaxed ${
                            m.role === role 
                              ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10' 
                              : 'bg-neutral-100 text-neutral-900 rounded-tl-none'
                          }`}>
                            {m.content}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-6 flex gap-3 p-1 bg-neutral-50 rounded-[1.5rem] border border-neutral-100 shadow-inner">
                      <input 
                        type="text" 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                        className="flex-1 bg-transparent border-none rounded-xl px-4 py-3 text-xs outline-none font-bold"
                        placeholder={isRw ? 'Andika ubutumwa...' : 'Type a message...'}
                      />
                      <button 
                        onClick={handleSend}
                        aria-label="Send Message"
                        className="p-3 bg-primary text-white rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Mobile Controls */}
      <footer className="h-24 bg-neutral-900 border-t border-white/10 flex items-center justify-center gap-6 px-8">
         <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-red-600' : 'bg-white/5 hover:bg-white/10'} text-white`}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button 
            onClick={() => setIsCameraOff(!isCameraOff)}
            className={`p-4 rounded-2xl transition-all ${isCameraOff ? 'bg-red-600' : 'bg-white/5 hover:bg-white/10'} text-white`}
          >
            {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
          
          <div className="h-10 w-[1px] bg-white/10 mx-4" />

          <button 
            onClick={() => setShowSignLanguage(!showSignLanguage)}
            className={`p-4 rounded-2xl transition-all ${showSignLanguage ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-white hover:bg-white/10'}`}
            aria-label="Toggle Sign Language Interpreter"
          >
            <HandMetal size={20} />
          </button>
          <button className="p-4 bg-white/5 text-white rounded-2xl hover:bg-white/10 transition-all">
            <Maximize2 size={20} />
          </button>
      </footer>
    </div>
  );
}
