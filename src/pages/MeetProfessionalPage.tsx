import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, Calendar, ClipboardList, 
  AlertTriangle, Phone, Heart, ChevronRight, Loader2, Info,
  UserCheck, ShieldCheck, Search, Users, Star
} from 'lucide-react';

import { supabase } from '../lib/supabaseClient';
import { useClinicalEvents } from '../hooks/useClinicalEvents';
import IncomingCall from '../components/clinical/IncomingCall';
import VideoSession from '../components/clinical/VideoSession';

export default function MeetProfessionalPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');
  const navigate = useNavigate();
  
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Video Session State
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeVideoSession, setActiveVideoSession] = useState<any>(null);

  const { activeSession } = useClinicalEvents(profile?.id, 'patient');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }
    setSession(session);

    // 1. Fetch Profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    setProfile(profile);

    // 2. Fetch Patient Data
    const { data: patient } = await supabase.from('patients').select('*').eq('id', session.user.id).maybeSingle();
    setPatientData(patient);

    // 3. Fetch Doctor
    if (patient?.doctor_id) {
      const { data: doc } = await supabase.from('profiles').select('*').eq('id', patient.doctor_id).single();
      setDoctor(doc);
    }

    // 4. Check for active video session
    const { data: activeVideo } = await supabase
      .from('sessions')
      .select('*, profiles:doctor_id(full_name)')
      .eq('patient_id', session.user.id)
      .not('video_room_url', 'is', null)
      .order('video_started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeVideo && !activeVideoSession) {
      setActiveVideoSession({
        id: activeVideo.id,
        room_url: activeVideo.video_room_url,
        doctor_name: activeVideo.profiles?.full_name || 'Your Doctor'
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    // Check for session-based active video (from Shell navigation)
    const stored = sessionStorage.getItem('active_video_session');
    if (stored) {
      const parsed = JSON.parse(stored);
      setActiveVideoSession(parsed);
      sessionStorage.removeItem('active_video_session');
    }
  }, []);

  const handleDeclineCall = async () => {
    if (!incomingCall) return;
    try {
      await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/api/video/end-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: incomingCall.id })
      });
      setIncomingCall(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    setActiveVideoSession(incomingCall);
    setIncomingCall(null);
  };

  const triggerSOS = async () => {
    if (!session?.user?.id) return;
    try {
      await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/api/crisis/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: session.user.id,
          doctorId: patientData?.doctor_id,
          type: 'SOS_button',
          lastMsg: 'Patient triggered SOS from Professional Hub'
        })
      });
      showToast(isRw ? 'Ubufasha buraje! Muganga yamenyeshejwe.' : 'Help is on the way! Your doctor has been alerted.', 'success');
      setTimeout(() => navigate('/emergency'), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookSession = async () => {
    if (!doctor || !session?.user?.id) return;
    setBookingLoading(true);
    try {
      const { error } = await supabase
        .from('sessions')
        .insert({
          patient_id: session.user.id,
          doctor_id: doctor.id,
          status: 'scheduled',
          scheduled_at: new Date().toISOString()
        });

      if (error) throw error;
      showToast(isRw ? 'Gusaba byoherejwe!' : 'Booking request sent!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] pt-24 pb-20 px-6">
      <div className="max-w-xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-4xl font-black text-primary-900 leading-tight">
            {isRw ? 'Gura na Muganga' : 'Clinical Workspace'}
          </h1>
          <p className="text-sm font-medium text-primary-600/70 italic">
            {isRw ? 'Ubufasha bw’inzobere mu gihe ubuvukeneye.' : 'Mental health professional support when you need it most.'}
          </p>
        </header>

        {/* SOS Button */}
        <button 
          onClick={triggerSOS}
          className="w-full p-6 bg-red-50 border-2 border-red-100 rounded-[2.5rem] flex items-center gap-5 group hover:bg-red-500 transition-all active:scale-95"
        >
          <div className="w-14 h-14 bg-red-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-red-500/20 group-hover:bg-white group-hover:text-red-500 transition-all">
            <AlertTriangle size={28} />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-black text-red-600 group-hover:text-white transition-all">
              {isRw ? 'Ubufasha bwihutirwa' : 'SOS Emergency'}
            </h2>
            <p className="text-xs font-bold text-red-400 group-hover:text-red-100 transition-all">
              {isRw ? 'Kanda hano uhabwe ubufasha ubu' : 'Alert your doctor immediately'}
            </p>
          </div>
        </button>

        {/* Professional Handshake Status - The Action Zone */}
        {doctor ? (
          <div className="relative group">
            {/* Background Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary-600/20 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative bg-white p-8 rounded-[3rem] border border-neutral-100 shadow-xl space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-700 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-primary/20">
                      {doctor.full_name?.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1">Your Mental Health Professional</p>
                    <h3 className="text-2xl font-black text-primary-900 leading-tight">{doctor.full_name}</h3>
                    <p className="text-xs font-bold text-primary-600/60">Clinical Psychologist · Online</p>
                  </div>
                </div>
              </div>

              {/* Action Grid */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleBookSession}
                  disabled={bookingLoading}
                  className="group relative flex flex-col items-center justify-center gap-3 p-6 bg-neutral-50 hover:bg-primary rounded-[2.5rem] transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary group-hover:bg-white/20 group-hover:text-white transition-all shadow-sm">
                    <Calendar size={24} />
                  </div>
                  <span className="text-xs font-black text-primary-900 group-hover:text-white transition-all uppercase tracking-tighter">
                    {bookingLoading ? <Loader2 className="animate-spin" /> : (isRw ? 'Guhura' : 'Book Session')}
                  </span>
                </button>

                <button 
                  onClick={() => {
                    if (activeSession?.status === 'confirmed' || activeSession?.status === 'active') {
                      navigate('/chat');
                    } else {
                      showToast(isRw ? 'Utegereje ko muganga yemera...' : 'Waiting for mental health professional approval...', 'error');
                    }
                  }}
                  className={`group relative flex flex-col items-center justify-center gap-3 p-6 rounded-[2.5rem] transition-all duration-300 ${
                    activeSession?.status === 'confirmed' || activeSession?.status === 'active' 
                      ? 'bg-primary-50 hover:bg-primary ring-2 ring-primary/20' 
                      : 'bg-neutral-50/50 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                    activeSession?.status === 'confirmed' || activeSession?.status === 'active'
                      ? 'bg-white text-primary group-hover:bg-white/20 group-hover:text-white'
                      : 'bg-neutral-100 text-neutral-300'
                  }`}>
                    <MessageCircle size={24} className={activeSession?.status === 'confirmed' ? 'animate-bounce' : ''} />
                  </div>
                  <span className={`text-xs font-black uppercase tracking-tighter transition-all ${
                    activeSession?.status === 'confirmed' || activeSession?.status === 'active'
                      ? 'text-primary-900 group-hover:text-white'
                      : 'text-neutral-300'
                  }`}>
                    {isRw ? 'Kuvugana' : 'Start Chat'}
                  </span>
                  
                  {(activeSession?.status === 'confirmed' || activeSession?.status === 'active') && (
                    <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                  )}
                </button>
              </div>

              {/* Status Footer */}
              <div className="pt-2 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-neutral-50 rounded-full border border-neutral-100">
                  <div className={`w-1.5 h-1.5 rounded-full ${activeSession ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                    {activeSession ? `Status: ${activeSession.status}` : 'Status: Ready to Connect'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-10 rounded-[3rem] border border-dashed border-neutral-200 text-center space-y-6">
            <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-neutral-300">
              <Users size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-primary-900">{isRw ? 'Nta muvuzi urahabwa' : 'No Mental Health Professional Assigned'}</h3>
              <p className="text-xs font-bold text-neutral-400">
                {isRw ? 'Ugomba guhitamo umuvuzi kugira ngo utangire.' : 'You need to select a mental health professional to begin your journey.'}
              </p>
            </div>
            <button 
              onClick={() => navigate('/intake')}
              className="w-full py-5 bg-primary text-white font-black rounded-3xl flex items-center justify-center gap-2"
            >
              {isRw ? 'Hitamo umuvuzi' : 'Find Mental Health Professional'}
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-primary-50/50 p-6 rounded-[2.5rem] border border-primary-100 flex gap-4">
           <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-primary flex-shrink-0">
             <ShieldCheck size={20} />
           </div>
           <div>
             <h4 className="text-sm font-black text-primary-900 mb-1">
               {isRw ? 'Ubwihure n\'umutekano' : 'Privacy & Security'}
             </h4>
             <p className="text-[10px] font-bold text-primary-600 leading-relaxed">
               {isRw ? 'Ibivugirwa hano byose ni ibanga hagati yawe na muganga wawe.' : 'All clinical sessions and messages are encrypted and strictly confidential.'}
             </p>
           </div>
        </div>

      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-24 left-6 right-6 p-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 ${
              toast.type === 'success' ? 'bg-primary-900 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? <Info size={18} /> : <AlertTriangle size={18} />}
            <p className="text-sm font-bold">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Logic */}
      <AnimatePresence>
        {incomingCall && (
          <IncomingCall 
            doctorName={doctor?.full_name || (isRw ? 'Muganga' : 'Doctor')}
            onAccept={handleAcceptCall}
            onDecline={handleDeclineCall}
          />
        )}
        {activeVideoSession && (
          <VideoSession 
            roomUrl={activeVideoSession.room_url}
            role="patient"
            sessionId={activeVideoSession.id}
            onLeave={() => setActiveVideoSession(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
