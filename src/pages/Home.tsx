import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Calendar, ChevronRight, Loader2, Info,
  TrendingUp, Star, Heart, Clock, AlertCircle
} from 'lucide-react';

import { supabase } from '../lib/supabaseClient';

const MOODS = [
  { id: 'very_low', emoji: '😔', score: 1, key: 'stressed' },
  { id: 'low', emoji: '😟', score: 2, key: 'sad' },
  { id: 'okay', emoji: '😐', score: 3, key: 'neutral' },
  { id: 'good', emoji: '🙂', score: 4, key: 'calm' },
  { id: 'great', emoji: '😊', score: 5, key: 'happy' },
];

export default function Home() {
  const { t, i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const navigate = useNavigate();
  
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [moodLogs, setMoodLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingMood, setLoggingMood] = useState(false);

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

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    setProfile(profile);

    // Fetch last 7 days of mood logs
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: logs } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('patient_id', session.user.id)
      .gte('logged_at', sevenDaysAgo.toISOString())
      .order('logged_at', { ascending: true });
    
    setMoodLogs(logs || []);
    setLoading(false);
  };

  const handleQuickLog = async (moodItem: any) => {
    if (!session?.user?.id || loggingMood) return;
    setLoggingMood(true);
    try {
      const { error } = await supabase.from('mood_logs').insert([{
        patient_id: session.user.id,
        mood_score: moodItem.score,
        mood: moodItem.key,
        emoji: moodItem.emoji,
        logged_at: new Date().toISOString()
      }]);

      if (error) throw error;
      fetchInitialData(); // Refresh logs
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingMood(false);
    }
  };

  const getDayData = (daysAgo: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);
    const dateStr = targetDate.toISOString().split('T')[0];
    
    return moodLogs.find(log => log.logged_at.startsWith(dateStr));
  };

  const weekDays = isRw 
    ? ['Kwe', 'Kab', 'Gat', 'Kan', 'Gat', 'Saa', 'Dim'] 
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] pt-24 pb-20 px-6 overflow-x-hidden">
      <div className="max-w-xl mx-auto space-y-12">
        
        {/* Welcome Header */}
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-primary-900">
              {isRw ? `Muraho, ${profile?.full_name?.split(' ')[0]}` : `Hello, ${profile?.full_name?.split(' ')[0]}`}
            </h1>
            <p className="text-sm font-bold text-primary-600/60">
              {isRw ? 'Umeze ute uyu munsi?' : "How's your wellness today?"}
            </p>
          </div>
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-center text-primary">
            <Heart size={24} fill="currentColor" className="opacity-10" />
          </div>
        </header>

        {/* 7-Day Mood Tracker */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-primary-900 flex items-center gap-2">
              <Calendar size={20} className="text-primary" />
              {isRw ? 'Icyumweru cyanjye' : 'Your 7-Day Journey'}
            </h2>
            <button 
              onClick={() => navigate('/progress')}
              className="text-[10px] font-black text-primary-400 uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1"
            >
              {isRw ? 'Reba byose' : 'View History'} <ChevronRight size={12} />
            </button>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm flex justify-between gap-2 overflow-x-auto no-scrollbar">
            {[6, 5, 4, 3, 2, 1, 0].map((daysAgo) => {
              const log = getDayData(daysAgo);
              const date = new Date();
              date.setDate(date.getDate() - daysAgo);
              const isToday = daysAgo === 0;

              return (
                <div key={daysAgo} className="flex flex-col items-center gap-3 flex-shrink-0">
                  <span className={`text-[9px] font-black uppercase tracking-tighter ${isToday ? 'text-primary' : 'text-neutral-300'}`}>
                    {weekDays[date.getDay() === 0 ? 6 : date.getDay() - 1]}
                  </span>
                  <div 
                    className={`w-12 h-16 rounded-2xl border-2 flex items-center justify-center transition-all ${
                      log ? 'bg-primary-50 border-primary-100' : isToday ? 'bg-white border-primary border-dashed' : 'bg-neutral-50 border-neutral-50'
                    }`}
                  >
                    {log ? (
                      <span className="text-2xl">{log.emoji}</span>
                    ) : isToday ? (
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      </div>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-neutral-200" />
                    )}
                  </div>
                  {isToday && !log && (
                    <div className="h-1 w-1 rounded-full bg-primary" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Log Action */}
        {!getDayData(0) && (
          <section className="bg-primary p-8 rounded-[3rem] shadow-2xl shadow-primary/30 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles size={100} className="text-white" />
            </div>
            <div className="relative z-10 space-y-2">
              <h3 className="text-2xl font-black text-white">
                {isRw ? 'Umeze ute ubu?' : 'Log your mood now'}
              </h3>
              <p className="text-xs font-medium text-white/70">
                {isRw ? 'Hitamo uko wiyumva kugira ngo AI igufashe.' : 'Pick your state for instant AI insights.'}
              </p>
            </div>

            <div className="relative z-10 flex justify-between gap-2">
              {MOODS.map(m => (
                <button 
                  key={m.id}
                  onClick={() => handleQuickLog(m)}
                  disabled={loggingMood}
                  className="flex-1 bg-white/10 hover:bg-white/20 active:scale-95 py-4 rounded-2xl transition-all flex items-center justify-center text-3xl filter hover:drop-shadow-lg"
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* AI Insight CTA */}
        <button 
          onClick={() => navigate('/progress')}
          className="w-full p-8 bg-white border-2 border-primary/5 rounded-[3rem] shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/10 group-hover:scale-110 transition-transform">
              <Sparkles size={28} />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-black text-primary-900">
                {isRw ? 'Andebere uko nifashe' : 'Get AI Analysis'}
              </h3>
              <p className="text-xs font-bold text-neutral-400">
                {isRw ? 'Reba inama za AI kuri iki cyumweru.' : 'Unlock recommendations for the week.'}
              </p>
            </div>
          </div>
          <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-300 group-hover:bg-primary group-hover:text-white transition-all">
            <ChevronRight size={24} />
          </div>
        </button>

        {/* Tips / Quote Card */}
        <div className="bg-neutral-50 p-6 rounded-[2.5rem] flex gap-4 items-start">
           <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-primary flex-shrink-0 shadow-sm">
             <Star size={18} fill="currentColor" />
           </div>
           <div>
             <p className="text-sm font-black text-primary-900 italic mb-2">
               {isRw ? '"Umutima usanzwe ni ishingiro ry’ubuzima."' : '"Your mental wellness is your greatest wealth."'}
             </p>
             <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">— Humura AI Wellness</p>
           </div>
        </div>

        {/* Floating Chat Bar */}
        <section className="pt-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/80 backdrop-blur-xl border border-neutral-100 p-2 rounded-[2.5rem] flex items-center gap-2 shadow-xl shadow-primary/5">
              <button className="w-11 h-11 flex items-center justify-center text-neutral-400 hover:text-primary hover:bg-primary-50 rounded-full transition-all">
                <div className="relative">
                  <div className="w-5 h-5 border-2 border-current rounded-md flex items-center justify-center">
                    <div className="w-1 h-1 bg-current rounded-full mb-1 ml-1" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white flex items-center justify-center text-[6px] font-black text-white">+</div>
                </div>
              </button>
              
              <input 
                type="text"
                placeholder={isRw ? "Vugana na Humura AI..." : "Message Humura AI..."}
                className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-primary-900 placeholder:text-neutral-300 px-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate('/chat');
                }}
              />

              <button className="w-11 h-11 flex items-center justify-center text-neutral-400 hover:text-primary hover:bg-primary-50 rounded-full transition-all">
                <div className="w-5 h-5 border-2 border-current rounded-full flex items-center justify-center">
                   <div className="w-1.5 h-1.5 bg-current rounded-full" />
                </div>
              </button>

              <button 
                onClick={() => navigate('/chat')}
                className="w-12 h-12 bg-neutral-400 text-white rounded-full flex items-center justify-center shadow-lg shadow-neutral-400/20 hover:bg-primary hover:shadow-primary/30 transition-all active:scale-95"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
