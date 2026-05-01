import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, ChevronRight, Loader2, Sparkles, 
  ChevronLeft, Send, MessageCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';

const MOODS = [
  { id: 'very_low', emoji: '😔', label: { en: 'Very low', rw: 'Nabi cyane' }, score: 1, key: 'angry' },
  { id: 'low', emoji: '😟', label: { en: 'Low', rw: 'Nabi' }, score: 2, key: 'sad' },
  { id: 'okay', emoji: '😐', label: { en: 'Okay', rw: 'Bisanzwe' }, score: 3, key: 'neutral' },
  { id: 'good', emoji: '🙂', label: { en: 'Good', rw: 'Neza' }, score: 4, key: 'calm' },
  { id: 'great', emoji: '😊', label: { en: 'Great', rw: 'Neza cyane' }, score: 5, key: 'happy' },
];

export default function MoodLogPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const [mood, setMood] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  const handleMoodSelect = async (m: any) => {
    setMood(m);
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('mood_logs').insert([{
        patient_id: user.id,
        mood_score: m.score,
        mood: m.key, // Matching the mapping in ProgressPage
        emoji: m.emoji,
        logged_at: new Date().toISOString()
      }]);

      if (error) throw error;
      
      // Navigate to progress for analysis immediately
      navigate('/progress');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6 pt-24 pb-20">
      <div className="w-full max-w-sm space-y-12">
        <header className="space-y-4">
          <button 
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-400 hover:text-primary transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-primary-900 leading-tight">
              {isRw ? 'Umeze ute uyu munsi?' : 'How are you feeling today?'}
            </h1>
            <p className="text-sm font-medium text-primary-600/70">
              {isRw ? 'Gusangira uko wiyumva bidufasha kugukurikirana.' : 'Sharing your mood helps us track your progress.'}
            </p>
          </div>
        </header>

        <main className="space-y-12">
          {/* Mood Selection */}
          <div className="flex justify-between items-center px-2">
            {MOODS.map(m => (
              <button 
                key={m.id}
                onClick={() => handleMoodSelect(m)}
                disabled={loading}
                className={`flex flex-col items-center gap-3 transition-all duration-500 ${mood?.id === m.id ? 'scale-125' : 'opacity-40 hover:opacity-100'} ${loading ? 'cursor-wait' : ''}`}
              >
                <span className={`text-5xl filter drop-shadow-xl transition-all ${mood?.id === m.id ? 'grayscale-0' : 'grayscale'}`}>
                  {m.emoji}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${mood?.id === m.id ? 'text-primary' : 'text-neutral-300'}`}>
                  {isRw ? m.label.rw : m.label.en}
                </span>
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex flex-col items-center gap-4 py-10">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-sm font-bold text-primary/60 italic">
                {isRw ? 'Turi kusesengura...' : 'Analyzing your mood...'}
              </p>
            </div>
          )}
        </main>

        <footer className="pt-10 flex items-center justify-center gap-2 text-neutral-300">
           <Heart size={14} fill="currentColor" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em]">Humura AI · Clinical Care</span>
        </footer>
      </div>
    </div>
  );
}
