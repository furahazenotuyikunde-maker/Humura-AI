'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../layout';

/**
 * Sign Language Detection Page
 * Features: Real-time webcam feed, frame capture with client-side compression (max 512px, JPEG 0.7),
 * and Gemini 2.5 Flash Vision integration.
 */
export default function SignDetectPage() {
  const { session } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detected, setDetected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Rule: Same isSending guard as Page 1 to prevent rapid duplicate detections
  const isSending = useRef(false);

  useEffect(() => {
    async function startWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
            facingMode: "user" 
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    }
    startWebcam();
    
    return () => {
      // Cleanup stream
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const detectSign = async () => {
    // Rule: isSending guard checked at top
    if (isSending.current || !videoRef.current || !canvasRef.current || !session?.user) return;

    isSending.current = true;
    setLoading(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Rule: Resize/compress client-side (max 512px)
      const maxDim = 512;
      let width = video.videoWidth;
      let height = video.videoHeight;

      if (width > height) {
        if (width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      
      // Draw frame to canvas
      ctx?.drawImage(video, 0, 0, width, height);
      
      // Rule: JPEG quality 0.7 to stay under 2MB limit
      const frameData = canvas.toDataURL('image/jpeg', 0.7);

      const { data: { session: currentSession } } = await supabase.auth.getSession();

      console.log('[SIGN] ▶ Gemini 2.5 Flash Vision request fired | id=REQ-' + Date.now());

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sign-detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession?.access_token}`,
        },
        body: JSON.stringify({
          frameData,
          userId: session.user.id
        }),
      });

      if (!response.ok) throw new Error('Detection failed');

      const data = await response.json();
      if (data.detectedSign) {
        setDetected(data.detectedSign);
      }
    } catch (error) {
      console.error("Detection error:", error);
    } finally {
      // Rule: release guard in finally{}
      isSending.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-10 py-10">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">Sign Detection</h2>
        <p className="text-white/50">Capture a sign gesture to translate it instantly</p>
      </div>

      <div className="relative group w-full max-w-2xl">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-[32px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative rounded-[30px] overflow-hidden border border-white/10 shadow-2xl bg-black aspect-video">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover" 
          />
          {loading && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-blue-400 font-bold text-lg tracking-widest animate-pulse">ANALYZING GESTURE...</div>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl flex flex-col items-center justify-center text-center">
          <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Detected Sign</h3>
          <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-cyan-300">
            {detected || "—"}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={detectSign}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-white/20 rounded-3xl font-bold text-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 border border-blue-400/30"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            Capture Frame
          </button>
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] text-white/40 leading-relaxed">
            Position your hand clearly within the frame. Gemini 2.5 Flash Vision will analyze the visual patterns to identify sign language letters and words.
          </div>
        </div>
      </div>
    </div>
  );
}
