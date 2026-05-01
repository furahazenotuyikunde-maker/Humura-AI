import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, Calendar, ClipboardList, TrendingUp, 
  AlertTriangle, Phone, Heart, ChevronRight, Loader2, Info
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');
  const navigate = useNavigate();
  
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

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

    if (profile?.role === 'doctor') {
      setLoading(false);
      return;
    }

    // 2. Fetch Patient Data
    const { data: patient } = await supabase.from('patients').select('*').eq('id', session.user.id).maybeSingle();
    setPatientData(patient);

    if (!patient?.intake_completed_at) {
      navigate('/intake');
      return;
    }

    // 3. Fetch Doctor
    if (patient.doctor_id) {
      const { data: doc } = await supabase.from('profiles').select('*').eq('id', patient.doctor_id).single();
      setDoctor(doc);
    }

    setLoading(false);
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
          type: 'SOS_BUTTON',
          lastMsg: 'Patient triggered SOS from Home'
        })
      });
      showToast(isRw ? 'Ubufasha buraje! Muganga yamenyeshejwe.' : 'Help is on the way! Your doctor has been alerted.', 'success');
      setTimeout(() => navigate('/emergency'), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  // --- Doctor View ---
  if (profile?.role === 'doctor') {
    return (
      <div className="space-y-6 pb-10 p-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-black text-primary-900 tracking-tight">
            {isRw ? 'Muraho, Muganga! 🩺' : 'Welcome, Doctor! 🩺'}
          </h1>
          <p className="text-primary-600 font-bold text-sm">
            {isRw ? 'Urateganya gufasha abarwayi bawe uyu munsi.' : 'Ready to support your patients today?'}
          </p>
        </header>
        <button 
          onClick={() => navigate('/doctor')}
          className="w-full p-8 bg-primary text-white rounded-[2.5rem] shadow-xl shadow-primary/20 flex flex-col items-start gap-4 text-left group overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all" />
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black">{isRw ? 'Gana ku Biro' : 'Go to Dashboard'}</h3>
            <p className="text-sm font-medium opacity-80 mt-1">Manage caseload, crisis alerts, and clinical reports.</p>
          </div>
        </button>
      </div>
    );
  }

  // --- Patient View ---
  return (
    <div className="space-y-6 pb-20 p-6 relative">
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 20 }} exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl font-bold text-sm ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="space-y-1">
        <h1 className="text-3xl font-black text-primary-900 tracking-tight">
          Hi, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-primary-600 font-bold text-sm">
          {isRw ? 'Umeze ute uyu munsi?' : 'You are not alone.'}
        </p>
      </header>

      {/* Meet Your Professional (Step 4) */}
      {!patientData?.has_met_doctor && doctor && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-primary/5 border-2 border-primary/10 rounded-[2.5rem] p-8 space-y-6"
        >
          <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
            <UserCheck size={16} />
            {isRw ? 'Twaguhitiye umuvuzi' : 'We found someone for you'}
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary text-white rounded-3xl flex items-center justify-center font-black text-2xl shadow-lg">
              {doctor.full_name?.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-black text-primary-900">{doctor.full_name}</h3>
              <p className="text-sm font-bold text-primary-600">{doctor.specialty || 'Psychiatrist'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-white border border-primary/10 rounded-full text-[10px] font-black uppercase text-primary-400">🇷🇼 Kinyarwanda</span>
            <span className="px-3 py-1 bg-white border border-primary/10 rounded-full text-[10px] font-black uppercase text-primary-400">🇬🇧 English</span>
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => navigate('/chat')}
              className="flex-1 py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 text-xs uppercase"
            >
              {isRw ? 'Tangira Ikiganiro' : 'Start chatting now'}
            </button>
            <button 
              onClick={() => navigate('/professionals')}
              className="flex-1 py-4 bg-white border-2 border-primary/10 text-primary-900 font-black rounded-2xl text-xs uppercase"
            >
              {isRw ? 'Saba Gahunda' : 'Book a session'}
            </button>
          </div>
          <p className="text-center text-[10px] font-bold text-neutral-400 flex items-center justify-center gap-2">
            <ShieldCheck size={12} />
            {isRw ? 'Amakuru yawe arinzwe 🔒' : 'Your information is private and secure 🔒'}
          </p>
        </motion.div>
      )}

      {/* Patient Home Summary (Step 5) */}
      <div className="space-y-4">
        {/* Log Mood Card */}
        <button 
          onClick={() => navigate('/intake')}
          className="w-full p-6 bg-white border-2 border-neutral-50 rounded-3xl flex items-center justify-between hover:border-primary-100 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">😊</span>
            </div>
            <p className="font-black text-primary-900">{isRw ? 'Uko wiyumva uyu munsi' : "Log today's mood"}</p>
          </div>
          <ChevronRight size={20} className="text-neutral-200 group-hover:text-primary transition-all" />
        </button>

        {/* Message Card */}
        <button 
          onClick={() => navigate('/chat')}
          className="w-full p-6 bg-white border-2 border-neutral-50 rounded-3xl flex items-center justify-between hover:border-primary-100 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <MessageCircle size={24} />
            </div>
            <div>
              <p className="font-black text-primary-900 text-left">{isRw ? 'Andikira Muganga' : 'Message your Professional'}</p>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-left mt-0.5">{doctor?.full_name || 'Assigned Doctor'}</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-neutral-200 group-hover:text-primary transition-all" />
        </button>

        {/* Session Card */}
        <button 
          onClick={() => navigate('/professionals')}
          className="w-full p-6 bg-white border-2 border-neutral-50 rounded-3xl flex items-center justify-between hover:border-primary-100 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div>
              <p className="font-black text-primary-900 text-left">{isRw ? 'Gahunda itaha' : 'Next session'}</p>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-left mt-0.5">Tuesday 10:00 AM</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-neutral-200 group-hover:text-primary transition-all" />
        </button>

        {/* Homework Card */}
        <button 
          onClick={() => navigate('/chat')}
          className="w-full p-6 bg-white border-2 border-neutral-50 rounded-3xl flex items-center justify-between hover:border-primary-100 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
              <ClipboardList size={24} />
            </div>
            <div>
              <p className="font-black text-primary-900 text-left">{isRw ? 'Umukoro wanjye' : 'My homework'}</p>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-left mt-0.5">1 pending task</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-neutral-200 group-hover:text-primary transition-all" />
        </button>

        {/* Progress Card */}
        <button 
          onClick={() => navigate('/progress')}
          className="w-full p-6 bg-white border-2 border-neutral-50 rounded-3xl flex items-center justify-between hover:border-primary-100 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="font-black text-primary-900 text-left">{isRw ? 'Iterambere ryanjye' : 'My progress'}</p>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest text-left mt-0.5">Improving ✅</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-neutral-200 group-hover:text-primary transition-all" />
        </button>
      </div>

      {/* SOS Button (Always visible) */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
        <button 
          onClick={triggerSOS}
          className="w-full py-5 bg-red-600 text-white font-black rounded-3xl shadow-xl shadow-red-200 flex items-center justify-center gap-3 pointer-events-auto hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <AlertTriangle size={24} className="animate-pulse" />
          {isRw ? 'NKENEYE UBUFASHA UBU' : 'I NEED HELP NOW'}
        </button>
      </div>
    </div>
  );
}
