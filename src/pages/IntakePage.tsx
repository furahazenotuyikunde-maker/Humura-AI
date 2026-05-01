import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, AlertCircle, Loader2, ChevronRight, 
  ChevronLeft, MessageCircle, AlertTriangle, 
  History, UserCheck, ShieldCheck, Users, Star, ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const MOODS = [
  { id: 'very_low', emoji: '😔', label: { en: 'Very low', rw: 'Nabi cyane' }, score: 1 },
  { id: 'low', emoji: '😟', label: { en: 'Low', rw: 'Nabi' }, score: 2 },
  { id: 'okay', emoji: '😐', label: { en: 'Okay', rw: 'Bisanzwe' }, score: 3 },
  { id: 'good', emoji: '🙂', label: { en: 'Good', rw: 'Neza' }, score: 4 },
  { id: 'great', emoji: '😊', label: { en: 'Great', rw: 'Neza cyane' }, score: 5 },
];

const CONCERNS = [
  { id: 'anxiety', icon: '🌀', label: { en: 'I feel anxious or worried', rw: 'Mfite impungenge cyangwa nshobya' } },
  { id: 'depression', icon: '😞', label: { en: 'I feel sad or hopeless', rw: 'Mfite agahinda cyangwa ntabyiringiro' } },
  { id: 'trauma', icon: '💔', label: { en: 'I went through something painful', rw: 'Nahuye n\'ikibazo kibabaje' } },
  { id: 'dissociation', icon: '😶', label: { en: "I just don't feel like myself", rw: 'Ntabwo nimeze nk\'uko bisanzwe' } },
  { id: 'crisis', icon: '🆘', label: { en: 'I need help urgently', rw: 'Nkeneye ubufasha bwihutirwa' } },
  { id: 'general', icon: '💬', label: { en: 'I want to talk to someone', rw: 'Nshaka kugira uwo tuvugana' } },
];

export default function IntakePage() {
  const navigate = useNavigate();
  const [subStep, setSubStep] = useState('3a'); // 3a, 3b, 3c, 4 (Selection)
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isRw, setIsRw] = useState(false);

  // Form State
  const [mood, setMood] = useState<any>(null);
  const [aiAck, setAiAck] = useState('');
  const [concern, setConcern] = useState<any>(null);
  const [duration, setDuration] = useState('');
  const [priorTherapy, setPriorTherapy] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('language_pref').eq('id', user.id).single().then(({ data }) => {
          if (data?.language_pref === 'rw') setIsRw(true);
        });
      }
    });
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'doctor');
    setDoctors(data || []);
  };

  const getBackendUrl = () => {
    const rawUrl = import.meta.env.VITE_RENDER_BACKEND_URL || '';
    return rawUrl.replace(/\/$/, '');
  };

  const handleMoodSelect = async (m: any) => {
    setMood(m);
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Initial AI Acknowledgement (Fire and forget or wait if needed)
      fetch(`${getBackendUrl()}/api/ai/intake-ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moodScore: m.score, lang: isRw ? 'rw' : 'en' })
      });

      // 2. Save the mood log immediately
      await supabase.from('mood_logs').insert([{
        patient_id: user.id,
        mood_score: m.score,
        mood: MOODS.find(mood => mood.id === m.id)?.score === 5 ? 'happy' : 
              MOODS.find(mood => mood.id === m.id)?.score === 4 ? 'calm' :
              MOODS.find(mood => mood.id === m.id)?.score === 3 ? 'neutral' :
              MOODS.find(mood => mood.id === m.id)?.score === 2 ? 'sad' : 'stressed',
        emoji: m.emoji,
        logged_at: new Date().toISOString()
      }]);

      // 3. If they already have a doctor, go straight to progress
      const { data: patient } = await supabase.from('patients').select('doctor_id').eq('id', user.id).maybeSingle();
      if (patient?.doctor_id) {
        navigate('/progress');
      } else {
        // Otherwise continue the intake flow
        setSubStep('3b');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = async (docId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Save Intake Data
      await supabase.from('patients').upsert({
        id: user.id,
        doctor_id: docId,
        primary_concern: concern?.id || 'general',
        concern_duration: duration,
        phq9_score: (mood?.score || 3) * 2,
        intake_completed_at: new Date().toISOString(),
        status: 'active'
      });

      // 2. Initial Mood Log
      if (mood) {
        await supabase.from('mood_logs').insert([{
          patient_id: user.id,
          mood_score: mood.score,
          emoji: mood.emoji,
          logged_at: new Date().toISOString()
        }]);
      }

      navigate('/');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setSubStep('4'); // Move to doctor selection list
  };

  if (subStep === '4') return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center p-6 pb-20">
      <header className="w-full max-w-lg pt-10 mb-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-6">
          <Users size={32} className="text-primary" />
        </div>
        <h2 className="text-3xl font-black text-primary-900 mb-2">
          {isRw ? 'Hitamo umuvuzi wawe' : 'Choose your professional'}
        </h2>
        <p className="text-sm font-medium text-primary-600">
          {isRw ? 'Dufite inzobere ziteguye kugufasha uyu munsi.' : 'We have professionals ready to support you today.'}
        </p>
      </header>

      <main className="w-full max-w-lg space-y-4">
        {doctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center space-y-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-sm font-bold text-neutral-400">
               {isRw ? 'Turashaka abavuzi...' : 'Looking for available professionals...'}
            </p>
          </div>
        ) : (
          doctors.map((doc) => (
            <motion.button
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleSelectDoctor(doc.id)}
              disabled={loading}
              className="w-full p-6 bg-white rounded-[2.5rem] border-2 border-transparent hover:border-primary shadow-sm hover:shadow-xl transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-primary font-black text-2xl uppercase">
                  {doc.full_name?.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1">{doc.specialty || 'Mental Health Professional'}</p>
                  <h3 className="text-xl font-black text-primary-900 group-hover:text-primary transition-colors">{doc.full_name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={10} fill="#D4A373" className="text-[#D4A373]" />)}
                    <span className="text-[10px] font-bold text-neutral-400 ml-1">Top Rated</span>
                  </div>
                </div>
              </div>
              <div className="w-10 h-10 bg-neutral-50 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={20} />}
              </div>
            </motion.button>
          ))
        )}
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6 pb-20">
      <header className="w-full max-w-sm pt-10 mb-10 flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
          <Heart size={24} className="text-primary" />
        </div>
        <div className="flex gap-2 mb-8">
           {['3a', '3b', '3c'].map(s => (
             <div key={s} className={`h-1.5 w-8 rounded-full ${subStep >= s ? 'bg-primary' : 'bg-primary-50'}`} />
           ))}
        </div>
      </header>

      <main className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          {subStep === '3a' && (
            <motion.div 
              key="3a" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <h2 className="text-3xl font-black text-primary-900 leading-tight">
                {isRw ? 'Umeze ute uyu munsi?' : 'How are you feeling today?'}
              </h2>
              <div className="flex justify-between">
                {MOODS.map(m => (
                  <button 
                    key={m.id}
                    onClick={() => handleMoodSelect(m)}
                    className={`flex flex-col items-center gap-2 p-2 rounded-2xl transition-all ${mood?.id === m.id ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
                  >
                    <span className={`text-4xl filter drop-shadow-md ${mood?.id === m.id ? 'grayscale-0' : 'grayscale'}`}>{m.emoji}</span>
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${mood?.id === m.id ? 'text-primary' : 'text-neutral-400'}`}>
                      {isRw ? m.label.rw : m.label.en}
                    </span>
                  </button>
                ))}
              </div>
              {aiAck && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center italic text-primary-600 font-medium text-sm leading-relaxed">
                  "{aiAck}"
                </motion.p>
              )}
              {mood && (
                <button 
                  onClick={() => setSubStep('3b')}
                  className="w-full py-5 bg-primary text-white font-black rounded-3xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {isRw ? 'Komeza' : 'Continue'} <ChevronRight size={20} />
                </button>
              )}
            </motion.div>
          )}

          {subStep === '3b' && (
            <motion.div 
              key="3b" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <h2 className="text-3xl font-black text-primary-900 leading-tight">
                {isRw ? 'Ni iki kikutegereje uyu munsi?' : "What brings you here today?"}
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {CONCERNS.map(c => (
                  <button 
                    key={c.id}
                    onClick={() => {
                      setConcern(c);
                      if (c.id === 'crisis') navigate('/emergency');
                    }}
                    className={`p-5 rounded-[2rem] border-2 flex items-center gap-4 transition-all ${concern?.id === c.id ? 'border-primary bg-primary/5' : 'border-neutral-50 hover:border-primary-100'}`}
                  >
                    <span className="text-2xl">{c.icon}</span>
                    <span className={`text-sm font-bold text-left leading-tight ${concern?.id === c.id ? 'text-primary-900' : 'text-primary-700'}`}>
                      {isRw ? c.label.rw : c.label.en}
                    </span>
                  </button>
                ))}
              </div>
              {concern && (
                <button 
                  onClick={() => setSubStep('3c')}
                  className="w-full py-5 bg-primary text-white font-black rounded-3xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {isRw ? 'Komeza' : 'Continue'} <ChevronRight size={20} />
                </button>
              )}
            </motion.div>
          )}

          {subStep === '3c' && (
            <motion.div 
              key="3c" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-primary-900 leading-tight">
                  {isRw ? 'Andi makuru make' : 'A little more'}
                </h2>
                <p className="text-sm font-medium text-primary-600">
                  {isRw ? 'Ibi bidufasha kugushakira umuganga w\'ukuri.' : 'This helps us find the right professional for you.'}
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">How long have you felt this way?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Just today', 'A few days', 'Weeks', 'Months'].map(opt => (
                      <button 
                        key={opt} onClick={() => setDuration(opt)}
                        className={`py-3 rounded-2xl font-bold text-xs border-2 transition-all ${duration === opt ? 'bg-primary border-primary text-white' : 'bg-neutral-50 border-neutral-50 text-primary-400'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">Spoken to anyone before?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['No, first time', 'Yes, before'].map(opt => (
                      <button 
                        key={opt} onClick={() => setPriorTherapy(opt)}
                        className={`py-3 rounded-2xl font-bold text-xs border-2 transition-all ${priorTherapy === opt ? 'bg-primary border-primary text-white' : 'bg-neutral-50 border-neutral-50 text-primary-400'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <button 
                  onClick={handleComplete}
                  className="w-full py-5 bg-primary text-white font-black rounded-3xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {isRw ? 'Reba inzobere' : 'View professionals'} <ChevronRight size={20} />
                </button>
                <button 
                  onClick={handleComplete}
                  className="w-full text-center text-xs font-bold text-neutral-400 hover:text-primary transition-colors"
                >
                  {isRw ? 'Simbuka' : 'Skip, see all'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
