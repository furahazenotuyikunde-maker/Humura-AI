import React, { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Minimize2 } from 'lucide-react';

interface VideoSessionProps {
  roomUrl: string;
  role: 'doctor' | 'patient';
  sessionId: string;
  onLeave: () => void;
}

const VideoSession: React.FC<VideoSessionProps> = ({ roomUrl, role, sessionId, onLeave }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [callFrame, setCallFrame] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!containerRef.current || callFrame) return;

    const frame = DailyIframe.createFrame(containerRef.current, {
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
        borderRadius: '2rem',
      },
      showLeaveButton: false,
      showFullscreenButton: false,
    });

    frame.join({ url: roomUrl });

    frame.on('left-meeting', () => {
      handleEndCall();
    });

    setCallFrame(frame);

    return () => {
      frame.destroy();
    };
  }, [roomUrl]);

  const handleEndCall = async () => {
    if (callFrame) {
      callFrame.leave();
    }
    
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

  const toggleMute = () => {
    if (callFrame) {
      const current = callFrame.localAudio();
      callFrame.setLocalAudio(!current);
      setIsMuted(current);
    }
  };

  const toggleVideo = () => {
    if (callFrame) {
      const current = callFrame.localVideo();
      callFrame.setLocalVideo(!current);
      setIsCameraOff(current);
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
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/60 to-transparent z-20 flex items-center justify-between px-8 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">
            {role === 'doctor' ? 'Clinical Consultation' : 'Live with Professional'}
          </span>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-white/60 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Daily.co Iframe Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Controls Overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-black/40 backdrop-blur-2xl rounded-full border border-white/10 z-20">
        <button 
          onClick={toggleMute}
          className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        
        <button 
          onClick={handleEndCall}
          className="p-5 bg-red-600 text-white rounded-full shadow-lg shadow-red-900/40 hover:bg-red-500 hover:scale-110 active:scale-95 transition-all"
        >
          <PhoneOff size={24} />
        </button>

        <button 
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-all ${isCameraOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
          {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>
      </div>
    </motion.div>
  );
};

export default VideoSession;
