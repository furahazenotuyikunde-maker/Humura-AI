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

  const handleSaveMood = async () => {
    if (!mood) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('mood_logs').insert([{
        patient_id: user.id,
        mood_score: mood.score,
        mood: mood.key, // Matching the mapping in ProgressPage
        emoji: mood.emoji,
        note: note,
        logged_at: new Date().toISOString()
      }]);

      if (error) throw error;
      
      // Navigate to progress for analysis
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
                onClick={() => setMood(m)}
                className={`flex flex-col items-center gap-3 transition-all duration-500 ${mood?.id === m.id ? 'scale-125' : 'opacity-40 hover:opacity-100'}`}
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

          {/* Optional Note */}
          <AnimatePresence>
            {mood && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="relative group">
                  <div className="absolute left-5 top-5 text-primary-300 group-focus-within:text-primary transition-colors">
                    <MessageCircle size={20} />
                  </div>
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={isRw ? 'Hari icyo wakongeraho? (udateganyijwe)' : 'Any notes on why you feel this way? (optional)'}
                    className="w-full bg-neutral-50 border-2 border-neutral-50 focus:border-primary/20 focus:bg-white rounded-[2rem] p-5 pl-14 text-sm font-medium text-primary-900 outline-none transition-all min-h-[120px] resize-none"
                  />
                </div>

                <button 
                  onClick={handleSaveMood}
                  disabled={loading}
                  className="w-full py-5 bg-primary text-white font-black rounded-3xl shadow-xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                  {isRw ? 'Bika Ububiko' : 'Log Mood & See Analysis'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="pt-10 flex items-center justify-center gap-2 text-neutral-300">
           <Heart size={14} fill="currentColor" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em]">Humura AI · Clinical Care</span>
        </footer>
      </div>
    </div>
  );
}
