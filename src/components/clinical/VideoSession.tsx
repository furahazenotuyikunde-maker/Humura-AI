import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Maximize2, Minimize2, HandMetal, Sparkles, Loader2 } from 'lucide-react';

interface VideoSessionProps {
  roomUrl: string;
  role: 'doctor' | 'patient';
  sessionId: string;
  onLeave: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const VideoSession: React.FC<VideoSessionProps> = ({ roomUrl, role, sessionId, onLeave }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [roomName] = useState(() => roomUrl.split('/').pop() || '');

  // Sign Language Logic
  const [isSignMode, setIsSignMode] = useState(false);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadJitsiScript().then(() => {
      if (containerRef.current && !jitsiApiRef.current) {
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

        jitsiApiRef.current.addEventListener("readyToClose", handleEndCall);
      }
    });

    return () => {
      jitsiApiRef.current?.dispose();
      stopSignAnalysis();
    };
  }, [roomName]);

  const loadJitsiScript = () => {
    return new Promise<void>((resolve) => {
      if (window.JitsiMeetExternalAPI) return resolve();
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  };

  const handleEndCall = async () => {
    try {
      await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/api/video/end-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
    } catch (err) {
      console.error("Error ending session:", err);
    }
    onLeave();
  };

  // ── Sign Language Interpretation Logic ──
  
  const startSignAnalysis = async () => {
    setIsSignMode(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play();
      }

      analysisIntervalRef.current = setInterval(captureAndAnalyze, 5000); // Analyze every 5 seconds
    } catch (err) {
      console.error("Camera access failed for Sign Analysis:", err);
    }
  };

  const stopSignAnalysis = () => {
    setIsSignMode(false);
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
    formData.append('prompt', "Interpret this Rwandan sign language gesture. Return JSON: {'detectedSign': '...', 'explanation': '...'}");

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

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed z-[100] bg-neutral-900 shadow-2xl transition-all duration-500 overflow-hidden ${
        isFullscreen 
          ? 'inset-0 rounded-0' 
          : 'bottom-6 right-6 w-[400px] h-[600px] md:w-[800px] md:h-[500px] rounded-[3rem] border-4 border-white/10'
      }`}
    >
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent z-20 flex items-center justify-between px-8 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] drop-shadow-md">
            {role === 'doctor' ? 'Clinical Consultation' : 'Live with Professional'}
          </span>
        </div>
        <div className="flex items-center gap-3 pointer-events-auto">
          <button 
            onClick={() => isSignMode ? stopSignAnalysis() : startSignAnalysis()}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              isSignMode ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
            }`}
          >
            <HandMetal size={14} />
            {isSignMode ? 'Sign Mode Active' : 'Enable Sign AI'}
          </button>
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-white/60 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Jitsi Iframe Container */}
      <div ref={containerRef} className="w-full h-full bg-slate-900" />

      {/* ── Sign Language AI Overlay ── */}
      <AnimatePresence>
        {isSignMode && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-20 right-6 w-48 space-y-3 z-30 pointer-events-none"
          >
            <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-2xl bg-black">
              <video ref={localVideoRef} className="w-full aspect-video object-cover opacity-60" muted />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center">
                {isAnalyzing && <Loader2 className="text-emerald-400 animate-spin" size={24} />}
              </div>
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-emerald-500/90 px-2 py-1 rounded-full">
                <Sparkles size={10} className="text-white" />
                <span className="text-[8px] font-black text-white uppercase">AI Monitoring</span>
              </div>
            </div>

            {interpretation && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white/95 backdrop-blur-md p-3 rounded-2xl border-l-4 border-emerald-500 shadow-xl"
              >
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Detected Sign</p>
                <p className="text-sm font-black text-slate-900 leading-tight">{interpretation}</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* End Call Button Overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <button 
          onClick={handleEndCall}
          className="p-5 bg-red-600 text-white rounded-full shadow-2xl shadow-red-900/40 hover:bg-red-500 hover:scale-110 active:scale-95 transition-all group"
        >
          <PhoneOff size={24} className="group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};

export default VideoSession;
