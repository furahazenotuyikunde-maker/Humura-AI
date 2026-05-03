import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Calendar, Sparkles, AlertCircle, Loader2, 
  ChevronRight, Share2, X, MessageCircle, Send, Mail, Copy,
  BookOpen, Plus, Heart, History, Trash2, AlertTriangle, Video
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import { useClinicalEvents } from '../hooks/useClinicalEvents';
import VideoConsultationRoom from '../components/clinical/VideoConsultationRoom';

interface MoodLog {
  created_at: string;
  mood: string;
  emoji?: string;
  score?: number;
}

interface JournalEntry {
  id: string;
  content: string;
  mood_emoji: string;
  created_at: string;
}

type TabType = 'mood' | 'journal';

export default function ProgressPage() {
  const { i18n } = useTranslation();
  const isRw = i18n?.language?.startsWith('rw') || false;
  
  const [activeTab, setActiveTab] = useState<TabType>('mood');
  const [moods, setMoods] = useState<MoodLog[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [analysis, setAnalysis] = useState<{ summary: string; recommendations: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Journal Form State
  const [newJournal, setNewJournal] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [user, setUser] = useState<any>(null);
  const [isSavingJournal, setIsSavingJournal] = useState(false);

  const { activeSession } = useClinicalEvents(user?.id, 'patient');
  const [isRoomOpen, setIsRoomOpen] = useState(false);

  useEffect(() => {
    if (activeSession?.status === 'active') {
      setIsRoomOpen(true);
    } else {
      setIsRoomOpen(false);
    }
  }, [activeSession?.status]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const MOODS = [
    { id: 'happy',     emoji: '😊', en: 'Happy',      rw: 'Ndishimye',     score: 5, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
    { id: 'excited',   emoji: '🤩', en: 'Excited',    rw: 'Nshonje',       score: 5, color: 'bg-orange-50 border-orange-200 text-orange-700' },
    { id: 'grateful',  emoji: '🙏', en: 'Grateful',   rw: 'Ndashimira',    score: 5, color: 'bg-green-50 border-green-200 text-green-700' },
    { id: 'calm',      emoji: '😌', en: 'Calm',       rw: 'Ntuze',         score: 4, color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { id: 'hopeful',   emoji: '🌟', en: 'Hopeful',    rw: 'Nzizi',         score: 4, color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
    { id: 'loved',     emoji: '🥰', en: 'Loved',      rw: 'Nkundwa',       score: 5, color: 'bg-pink-50 border-pink-200 text-pink-700' },
    { id: 'neutral',   emoji: '😐', en: 'Neutral',    rw: 'Ahagaze',       score: 3, color: 'bg-gray-50 border-gray-200 text-gray-700' },
    { id: 'tired',     emoji: '😴', en: 'Tired',      rw: 'Narushye',      score: 2, color: 'bg-slate-50 border-slate-200 text-slate-700' },
    { id: 'lonely',    emoji: '🥺', en: 'Lonely',     rw: 'Ndi Ngenyine',  score: 2, color: 'bg-purple-50 border-purple-200 text-purple-700' },
    { id: 'confused',  emoji: '😕', en: 'Confused',   rw: 'Sinsobanukiwe', score: 2, color: 'bg-amber-50 border-amber-200 text-amber-700' },
    { id: 'sad',       emoji: '😢', en: 'Sad',        rw: 'Ndababaye',     score: 2, color: 'bg-blue-50 border-blue-300 text-blue-800' },
    { id: 'anxious',   emoji: '😰', en: 'Anxious',    rw: 'Mfite ubwoba',  score: 1, color: 'bg-yellow-50 border-yellow-300 text-yellow-800' },
    { id: 'stressed',  emoji: '😤', en: 'Stressed',   rw: 'Nagoye',        score: 1, color: 'bg-red-50 border-red-200 text-red-700' },
    { id: 'angry',     emoji: '😠', en: 'Angry',      rw: 'Ndarakaye',     score: 1, color: 'bg-red-50 border-red-300 text-red-800' },
    { id: 'hopeless',  emoji: '😞', en: 'Hopeless',   rw: 'Ntakizere',     score: 1, color: 'bg-neutral-50 border-neutral-300 text-neutral-700' },
    { id: 'scared',    emoji: '😨', en: 'Scared',     rw: 'Ndigutinya',    score: 1, color: 'bg-violet-50 border-violet-200 text-violet-700' },
  ];

  const moodMap: Record<string, number> = Object.fromEntries(MOODS.map(m => [m.id, m.score]));
  const [isLoggingMood, setIsLoggingMood] = useState(false);
  const [lastLoggedMood, setLastLoggedMood] = useState<string | null>(null);

  const logMood = async (moodId: string) => {
    if (!user || isLoggingMood) return;
    setIsLoggingMood(true);
    setLastLoggedMood(moodId);
    try {
      const moodObj = MOODS.find(m => m.id === moodId)!;
      await supabase.from('mood_logs').insert({
        user_id: user.id,
        mood: moodId,
        emoji: moodObj.emoji,
        score: moodObj.score,
        created_at: new Date().toISOString()
      });
      await fetchMoodData(user.id);
      analyzeProgress(user.id, moodId);
    } catch (err) {
      console.error('Mood log error:', err);
    } finally {
      setIsLoggingMood(false);
    }
  };

  const dayNames = isRw 
    ? ['Kwe', 'Kab', 'Gat', 'Kan', 'Gat', 'Saa', 'Dim'] 
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const fetchInitialData = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const userId = session.user.id;
      setUser(session.user);
      await Promise.all([
        fetchMoodData(userId),
        fetchJournalData(userId)
      ]);
      
      // Trigger AI analysis with combined context
      analyzeProgress(userId);
    }
    setIsLoading(false);
  };

  const fetchMoodData = async (userId: string) => {
    const { data } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    setMoods(data || []);
  };

  const fetchJournalData = async (userId: string) => {
    const { data } = await supabase
      .from('journals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setJournals(data || []);
  };

  const analyzeProgress = async (userId: string, currentMood?: string) => {
    try {
      setIsAnalyzing(true);
      const recentMoods = moods.slice(0, 7).map(m => m.mood);
      const recentJournals = journals.slice(0, 3).map(j => j.content);
      const moodObj = currentMood ? MOODS.find(m => m.id === currentMood) : null;

      const backendUrl = (import.meta.env.VITE_RENDER_BACKEND_URL || 'https://humura-ai-1.onrender.com').replace(/\/$/, '');
      
      const response = await fetch(`${backendUrl}/api/analyze-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          userId,
          moods: recentMoods,
          journals: recentJournals,
          isSignLanguage: true,
          currentMood: currentMood || null,
          currentMoodEmoji: moodObj?.emoji || null,
          currentMoodLabel: moodObj ? (isRw ? moodObj.rw : moodObj.en) : null,
          lang: isRw ? 'rw' : 'en'
        })
      });

      const text = await response.text();
      if (text.trim().startsWith('{')) {
        const result = JSON.parse(text);
        // Handle rate limit gracefully
        if (result.rateLimited) {
          setAnalysis({
            summary: isRw ? result.summaryRw : result.summary,
            recommendations: []
          });
          return;
        }
        setAnalysis({
          summary: result.summary,
          recommendations: result.recommendations || []
        });
      } else {
        throw new Error("Non-JSON response from server");
      }
    } catch (err: any) {
      console.error("Gemini Analysis Error:", err.message);
      const errorMsg = isRw
        ? "Imiterere ya sisitemu ntabwo iri gukora neza ubu. Gerageza nyuma gato."
        : "The AI system is temporarily unavailable. Please try again in a few minutes.";
      setAnalysis({
        summary: errorMsg,
        recommendations: []
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveJournal = async () => {
    if (!newJournal.trim()) return;
    setIsSavingJournal(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.from('journals').insert({
        user_id: session.user.id,
        content: newJournal,
        mood_emoji: '📝'
      });

      if (error) throw error;
      setNewJournal('');
      await fetchJournalData(session.user.id);
      analyzeProgress(session.user.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingJournal(false);
    }
  };

  const getWeeklyData = () => {
    // Build last 7 days in LOCAL timezone (not UTC) to avoid off-by-one for +02:00 users
    const toLocalDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return toLocalDate(d);
    }).reverse();

    return last7Days.map(date => {
      // Find the LAST mood logged on this local calendar day
      const dayLogs = moods.filter(m => m.created_at && toLocalDate(new Date(m.created_at)) === date);
      const log = dayLogs[dayLogs.length - 1]; // most recent entry for that day
      return {
        date,
        value: log ? (moodMap[log.mood] || 3) : 0,
        mood: log?.mood || 'none'
      };
    });
  };

  const weeklyData = getWeeklyData();

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] p-6 lg:p-10">
      {/* Video Room Overlay */}
      <AnimatePresence>
        {isRoomOpen && activeSession && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100]">
            <VideoConsultationRoom 
               session={{ profiles: { full_name: 'Dr. Kalisa' } }} 
               role="patient"
               onEnd={() => setIsRoomOpen(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-10">
        {/* Active Session Notification */}
        <AnimatePresence>
          {activeSession?.status === 'active' && !isRoomOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-primary text-white p-6 rounded-[2.5rem] shadow-xl shadow-primary/20 flex flex-col md:flex-row items-center justify-between gap-6 mb-10"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
                  <Video className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg">{isRw ? 'Guhura kwanjye kuri Live!' : 'Your Session is Live!'}</h3>
                  <p className="text-sm font-bold opacity-80">{isRw ? 'Umuganga wawe aragutegereje.' : 'Your doctor is waiting for you in the video room.'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRoomOpen(true)}
                className="px-8 py-3 bg-white text-primary font-black rounded-2xl shadow-lg hover:scale-105 transition-all"
              >
                {isRw ? 'Injira ubu' : 'Join Now'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <button 
            onClick={() => setActiveTab('mood')}
            className={`p-6 rounded-[2.5rem] border-2 transition-all text-left flex flex-col justify-between h-40 ${activeTab === 'mood' ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20' : 'bg-white border-neutral-100 text-primary-900'}`}
          >
            <Heart size={32} fill={activeTab === 'mood' ? 'white' : 'transparent'} className={activeTab === 'mood' ? 'opacity-100' : 'text-primary opacity-20'} />
            <div>
              <h3 className="font-black text-lg leading-tight">{isRw ? 'Uko Ndwaye' : 'Mood Journey'}</h3>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${activeTab === 'mood' ? 'text-white/60' : 'text-neutral-400'}`}>{moods.length} {isRw ? 'Ibimaze kwandikwa' : 'Logs recorded'}</p>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('journal')}
            className={`p-6 rounded-[2.5rem] border-2 transition-all text-left flex flex-col justify-between h-40 ${activeTab === 'journal' ? 'bg-[#8B5E3C] border-[#8B5E3C] text-white shadow-xl shadow-[#8B5E3C]/20' : 'bg-white border-neutral-100 text-primary-900'}`}
          >
            <BookOpen size={32} fill={activeTab === 'journal' ? 'white' : 'transparent'} className={activeTab === 'journal' ? 'opacity-100' : 'text-[#8B5E3C] opacity-20'} />
            <div>
              <h3 className="font-black text-lg leading-tight">{isRw ? 'Inyandiko Zanjye' : 'Daily Journal'}</h3>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${activeTab === 'journal' ? 'text-white/60' : 'text-neutral-400'}`}>{journals.length} {isRw ? 'Inyandiko' : 'Entries'}</p>
            </div>
          </button>
        </header>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Visualization Content */}
          <div className="md:col-span-2 space-y-8">
            <AnimatePresence mode="wait">
              {activeTab === 'mood' ? (
                <motion.div 
                  key="mood-view"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Mood Logger */}
                  <div className="bg-white p-8 rounded-[3rem] border border-neutral-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <Heart className="text-primary" size={20} />
                      <h2 className="text-xl font-black text-primary-900">{isRw ? 'Ubu Wiyumva Bite?' : 'How Are You Feeling Now?'}</h2>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {MOODS.map(mood => (
                        <motion.button
                          key={mood.id}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => logMood(mood.id)}
                          disabled={isLoggingMood}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all font-bold text-[10px] uppercase tracking-tight ${
                            lastLoggedMood === mood.id
                              ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105'
                              : `${mood.color} hover:scale-105`
                          } disabled:opacity-50`}
                        >
                          <span className="text-2xl">{mood.emoji}</span>
                          <span className="leading-tight text-center">{isRw ? mood.rw : mood.en}</span>
                        </motion.button>
                      ))}
                    </div>
                    {lastLoggedMood && (
                      <p className="text-center text-xs text-primary font-bold mt-4 animate-pulse">
                        ✓ {isRw ? 'Byabitseho! AI irimo gusesengura...' : 'Logged! AI is analyzing your data...'}
                      </p>
                    )}
                  </div>

                  {/* Weekly Trends Chart */}
                  <div className="bg-white p-8 rounded-[3rem] border border-neutral-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-10">
                      <TrendingUp className="text-primary" size={20} />
                      <h2 className="text-xl font-black text-primary-900">{isRw ? 'Imiterere y\'Icyumweru' : 'Weekly Trends'}</h2>
                    </div>
                    <div className="flex items-end justify-between h-56 gap-2">
                      {weeklyData.map((day, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-4">
                          <div className="w-full relative flex flex-col justify-end h-full">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${(day.value / 5) * 100}%` }}
                              className={`w-full rounded-t-2xl transition-all ${
                                day.value === 0 ? 'bg-neutral-50' : 'bg-primary shadow-lg shadow-primary/10'
                              }`}
                            />
                          </div>
                          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter">{dayNames[idx]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="journal-view"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Journal Input */}
                  <div className="bg-white p-6 rounded-[2.5rem] border-2 border-[#8B5E3C]/10 shadow-sm space-y-4">
                    <h2 className="text-lg font-black text-[#8B5E3C] flex items-center gap-2">
                      <Plus size={20} />
                      {isRw ? 'Andika inyandiko nshya' : 'Write a new entry'}
                    </h2>
                    <textarea 
                      value={newJournal}
                      onChange={(e) => setNewJournal(e.target.value)}
                      placeholder={isRw ? 'Andika uko wiyumva...' : 'How was your day? Pour your heart out...'}
                      className="w-full h-32 p-4 bg-neutral-50 rounded-2xl border-none focus:ring-2 ring-[#8B5E3C]/20 outline-none font-medium text-sm"
                    />
                    <button 
                      onClick={handleSaveJournal}
                      disabled={isSavingJournal || !newJournal.trim()}
                      className="w-full py-4 bg-[#8B5E3C] text-white font-black text-xs uppercase rounded-xl shadow-lg shadow-[#8B5E3C]/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSavingJournal ? <Loader2 className="animate-spin" /> : <Send size={16} />}
                      {isRw ? 'Bika' : 'Save Entry'}
                    </button>
                  </div>

                  {/* Journal List */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-neutral-400 font-black text-[10px] uppercase tracking-widest">
                       <History size={12} />
                       {isRw ? 'Ibyanditswe' : 'Previous Entries'}
                    </div>
                    {journals.length === 0 ? (
                      <div className="p-10 text-center text-neutral-300 font-bold italic border-2 border-dashed border-neutral-100 rounded-3xl">
                        No entries yet. Start writing to see your journey.
                      </div>
                    ) : (
                      journals.map(j => (
                        <div key={j.id} className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-3">
                           <div className="flex items-center justify-between">
                             <span className="text-[10px] font-black text-neutral-300">{new Date(j.created_at).toLocaleDateString()}</span>
                             <span className="text-lg">{j.mood_emoji}</span>
                           </div>
                           <p className="text-sm font-medium text-primary-900 leading-relaxed">{j.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI Recommendations Sidebar */}
          <div className="space-y-6">
            <div className="bg-primary p-8 rounded-[3rem] text-white shadow-2xl shadow-primary/20 flex flex-col justify-between h-full min-h-[500px]">
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Sparkles size={20} />
                  </div>
                  <h2 className="text-xl font-black">{isRw ? 'Ubujyanama' : 'AI Insights'}</h2>
                </div>
                
                {isAnalyzing ? (
                  <div className="space-y-6 py-10">
                    <div className="flex gap-2">
                       <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                       <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                       <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-60">{isRw ? 'Humura AI arasesengura...' : 'Analyzing your week...'}</p>
                  </div>
                ) : analysis ? (
                  <div className="space-y-8">
                    <div className="space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{isRw ? 'Inshamake' : 'Weekly Summary'}</p>
                       <p className="text-sm font-medium leading-relaxed italic">"{analysis.summary}"</p>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{isRw ? 'Inama' : 'Recommendations'}</p>
                      <div className="space-y-3">
                        {analysis.recommendations.map((tip, i) => (
                          <div key={i} className="flex gap-3 text-xs bg-white/10 p-4 rounded-2xl border border-white/10 group hover:bg-white/20 transition-all cursor-default">
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                               <ChevronRight size={10} />
                            </div>
                            <span className="font-bold">{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-20 text-center opacity-40">
                    <AlertCircle size={40} />
                    <p className="text-xs font-bold uppercase tracking-widest">{isRw ? 'Nta makuru ahagije' : 'Not enough data for insights'}</p>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setShowShareModal(true)}
                disabled={!analysis || isAnalyzing}
                className="mt-10 w-full py-4 bg-white text-primary rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                <Share2 size={18} />
                {isRw ? 'Sangira Raporo' : 'Share Report'}
              </button>
            </div>
            
            {/* Crisis Quick Link */}
            <div className="bg-red-50 p-6 rounded-[2.5rem] border border-red-100 flex items-center gap-4">
               <div className="w-10 h-10 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                 <AlertTriangle size={20} />
               </div>
               <div>
                 <p className="text-xs font-black text-red-900">{isRw ? 'Ubufasha bwihutirwa?' : 'Need urgent help?'}</p>
                 <button onClick={() => window.location.href = '/emergency'} className="text-[10px] font-bold text-red-600 hover:underline">
                   {isRw ? 'Kanda hano ubu' : 'Click here now'} →
                 </button>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal - Reused from previous version but styled better */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowShareModal(false)} className="absolute inset-0 bg-primary-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-sm bg-white rounded-[3rem] shadow-2xl overflow-hidden p-8 space-y-8">
               <div className="flex items-center justify-between">
                 <h3 className="text-xl font-black text-primary-900">{isRw ? 'Sangira Raporo' : 'Share Progress'}</h3>
                 <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-neutral-50 rounded-full transition-colors">
                   <X size={20} className="text-neutral-300" />
                 </button>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'whatsapp', icon: MessageCircle, color: 'bg-green-500', label: 'WhatsApp' },
                    { id: 'telegram', icon: Send, color: 'bg-blue-500', label: 'Telegram' },
                    { id: 'email', icon: Mail, color: 'bg-red-500', label: 'Email' },
                    { id: 'copy', icon: Copy, color: 'bg-primary', label: isRw ? 'Kopiye' : 'Copy' },
                  ].map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => {
                        const shareText = `Humura AI Progress Report:\n\n${analysis?.summary}\n\nMind Supported, Life Empowered.`;
                        if (p.id === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                        else if (p.id === 'telegram') window.open(`https://t.me/share/url?url=${encodeURIComponent(shareText)}`, '_blank');
                        else if (p.id === 'email') window.location.href = `mailto:?subject=My Humura AI Progress&body=${encodeURIComponent(shareText)}`;
                        else if (p.id === 'copy') {
                          navigator.clipboard.writeText(shareText);
                          alert(isRw ? 'Byakopewe!' : 'Copied to clipboard!');
                        }
                      }}
                      className="flex flex-col items-center gap-3 p-6 rounded-[2rem] bg-neutral-50 hover:bg-neutral-100 transition-all group"
                    >
                       <div className={`w-12 h-12 ${p.color} text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                         <p.icon size={20} />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-primary-900">{p.label}</span>
                    </button>
                  ))}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
