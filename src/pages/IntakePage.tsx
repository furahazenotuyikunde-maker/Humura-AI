import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, AlertCircle, Loader2, ChevronRight, 
  ChevronLeft, MessageCircle, AlertTriangle, 
  History, UserCheck, ShieldCheck 
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
  const [subStep, setSubStep] = useState('3a'); // 3a, 3b, 3c
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRw, setIsRw] = useState(false);

  // Form State
  const [mood, setMood] = useState<any>(null);
  const [aiAck, setAiAck] = useState('');
  const [concern, setConcern] = useState<any>(null);
  const [duration, setDuration] = useState('');
  const [priorTherapy, setPriorTherapy] = useState('');

  useEffect(() => {
    // Check language pref
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('language_pref').eq('id', user.id).single().then(({ data }) => {
          if (data?.language_pref === 'rw') setIsRw(true);
        });
      }
    });
  }, []);

  const handleMoodSelect = async (m: any) => {
    setMood(m);
    // Call Gemini for acknowledgement
    try {
      const res = await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/api/ai/intake-ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moodScore: m.score, lang: isRw ? 'rw' : 'en' })
      });
      const data = await res.json();
      setAiAck(data.ack);
    } catch (e) {
      console.error(e);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Save Intake Data
      await supabase.from('patients').upsert({
        id: user.id,
        primary_concern: concern.id,
        concern_duration: duration,
        phq9_score: mood.score * 2, // Mocking phq9 from mood for now
        intake_completed_at: new Date().toISOString(),
        status: 'active'
      });

      // 2. Initial Mood Log
      await supabase.from('mood_logs').insert([{
        patient_id: user.id,
        mood: mood.id,
        emoji: mood.emoji,
        score: mood.score
      }]);

      // 3. Match Doctor
      const res = await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/api/patients/match-doctor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: user.id,
          concern: concern.id,
          lang: isRw ? 'rw' : 'en'
        })
      });
      const data = await res.json();

      if (data.success) {
        navigate('/'); // Go home where "Meet Your Professional" will show
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-10 text-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="mb-6">
        <Loader2 size={48} className="text-primary" />
      </motion.div>
      <h2 className="text-xl font-black text-primary-900">{isRw ? 'Duhura na muganga...' : 'Finding your professional...'}</h2>
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
                  {isRw ? 'Nhuze n\'umuvuzi' : 'Connect me now'} <ChevronRight size={20} />
                </button>
                <button 
                  onClick={handleComplete}
                  className="w-full text-center text-xs font-bold text-neutral-400 hover:text-primary transition-colors"
                >
                  {isRw ? 'Simbuka ubu' : 'Skip, just connect me'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
