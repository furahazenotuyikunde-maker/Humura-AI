import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  MessageSquare, Sparkles, AlertCircle, 
  User, CheckCircle, FileText, HandMetal,
  Settings, Maximize2, MoreVertical, Send, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  session: any;
  onEnd: () => void;
  role: 'doctor' | 'patient';
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function VideoConsultationRoom({ session, onEnd, role }: Props) {
  const { t, i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  
  const [showChat, setShowChat] = useState(false);
  const [showSignLanguage, setShowSignLanguage] = useState(false);
  const [showNotes, setShowNotes] = useState(role === 'doctor');
  const [timer, setTimer] = useState(0);

  // Sign Language Logic
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // SOAP Notes State (Doctor only)
  const [soapNotes, setSoapNotes] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });

  useEffect(() => {
    const interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    
    // Load Jitsi
    loadJitsiScript().then(() => {
      if (containerRef.current && !jitsiApiRef.current) {
        const roomName = session.video_room_url?.split('/').pop() || `humura-${session.id}`;
        jitsiApiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
          roomName: roomName,
          width: '100%',
          height: '100%',
          parentNode: containerRef.current,
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              "microphone", "camera", "hangup", "chat", "tileview", "settings"
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_BRAND_WATERMARK: false,
          }
        });

        jitsiApiRef.current.addEventListener("readyToClose", onEnd);
      }
    });

    return () => {
      clearInterval(interval);
      jitsiApiRef.current?.dispose();
      stopSignAnalysis();
    };
  }, []);

  const loadJitsiScript = () => {
    return new Promise<void>((resolve) => {
      if (window.JitsiMeetExternalAPI) return resolve();
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  };

  const startSignAnalysis = async () => {
    setShowSignLanguage(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play();
      }
      analysisIntervalRef.current = setInterval(captureAndAnalyze, 5000);
    } catch (err) {
      console.error("Camera access failed for Sign Analysis:", err);
    }
  };

  const stopSignAnalysis = () => {
    setShowSignLanguage(false);
    if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    if (localVideoRef.current?.srcObject) {
      const tracks = (localVideoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
    }
    setInterpretation(null);
  };

  const captureAndAnalyze = async () => {
    if (!localVideoRef.current || !canvasRef.current || isAnalyzing) return;
    
    setIsAnalyzing(true);
    const canvas = canvasRef.current;
    const video = localVideoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.6));
    if (!blob) return;

    const formData = new FormData();
    formData.append('image', blob);
    formData.append('prompt', "Interpret this sign language gesture for clinical use. Return JSON: {'detectedSign': '...', 'explanation': '...'}");

    try {
      const res = await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/analyze-sign`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      const reply = JSON.parse(data.reply);
      if (reply.detectedSign && reply.detectedSign !== 'none') {
        setInterpretation(reply.detectedSign);
      }
    } catch (err) {
      console.error("Analysis Error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter">AI Ready</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={() => showSignLanguage ? stopSignAnalysis() : startSignAnalysis()}
             className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
               showSignLanguage ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white hover:bg-white/10'
             }`}
           >
             <HandMetal size={16} className="inline mr-2" />
             {showSignLanguage ? 'Sign Mode Active' : 'Enable Sign AI'}
           </button>
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
          <div ref={containerRef} className="w-full h-full rounded-[3rem] bg-neutral-900 overflow-hidden relative group border border-white/5 shadow-inner" />
          
          {/* Sign Language Interpretation Overlay */}
          <AnimatePresence>
            {showSignLanguage && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-10 right-10 w-64 space-y-4 z-40"
              >
                <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-500 bg-black shadow-2xl">
                  <video ref={localVideoRef} className="w-full aspect-video object-cover opacity-70" muted />
                  <canvas ref={canvasRef} className="hidden" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Loader2 className="text-emerald-400 animate-spin" size={32} />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-emerald-500 px-3 py-1 rounded-full">
                    <Sparkles size={12} className="text-white" />
                    <span className="text-[10px] font-black text-white uppercase">AI Analysis</span>
                  </div>
                </div>

                {interpretation && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-5 rounded-[2rem] border-l-8 border-emerald-500 shadow-2xl"
                  >
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Detected Gesture</p>
                    <p className="text-lg font-black text-slate-900 leading-tight">"{interpretation}"</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Side Panel (Doctor Only) */}
        <AnimatePresence>
          {showNotes && role === 'doctor' && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-white border-l border-neutral-100 flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-neutral-100 bg-neutral-50/50">
                 <h3 className="text-lg font-black text-primary-900 uppercase tracking-widest">Clinical Handshake</h3>
                 <p className="text-xs font-bold text-neutral-400">Live SOAP Documentation</p>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                 <div>
                   <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Subjective Observation</label>
                   <textarea 
                     className="w-full p-6 bg-neutral-50 rounded-[2rem] text-sm border-2 border-transparent focus:border-primary outline-none transition-all h-48 resize-none shadow-inner font-medium"
                     placeholder="How is the patient feeling?..."
                     value={soapNotes.subjective}
                     onChange={e => setSoapNotes({...soapNotes, subjective: e.target.value})}
                   />
                 </div>

                 <div className="p-6 bg-gradient-to-br from-primary/10 to-indigo-50 rounded-[2.5rem] border border-primary/20">
                    <div className="flex items-center gap-3 mb-4">
                      <Sparkles size={20} className="text-primary" />
                      <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Live Insights</span>
                    </div>
                    <p className="text-xs font-bold text-primary-900 leading-relaxed italic">
                      {soapNotes.subjective.length > 30 
                        ? "AI detects strong emotional markers. Recommended: Validate their recent progress and focus on breathing techniques."
                        : "Start typing observation to activate AI clinical assistance..."}
                    </p>
                 </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
