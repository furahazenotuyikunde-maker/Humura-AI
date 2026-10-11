import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Calendar, Sparkles, AlertCircle, Loader2,
  ChevronRight, Share2, X, MessageCircle, Send, Mail, Copy,
  BookOpen, Plus, Heart, History, Trash2, AlertTriangle, Video, RefreshCcw,
  Smile, Wind, Sun, Meh, Moon, Frown, Flame, Activity, HeartHandshake, Lock
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useClinicalEvents } from '../../hooks/useClinicalEvents';
import VideoConsultationRoom from '../../components/clinical/VideoConsultationRoom';

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
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('mood');
  const [moods, setMoods] = useState<MoodLog[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [analysis, setAnalysis] = useState<{ summary: string; recommendations: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Journal Form State
  const [newJournal, setNewJournal] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isSavingJournal, setIsSavingJournal] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const MOOD_OPTIONS = [
    { id: 'happy', icon: Smile, en: 'Happy', rw: 'Ndishimye', score: 5, color: 'text-[#D97706]', bg: 'bg-[#FEF8E7]', border: 'border-[#FCE9B6]' },
    { id: 'excited', icon: Sparkles, en: 'Excited', rw: 'Nshonje', score: 5, color: 'text-[#DC2626]', bg: 'bg-[#FFF0F0]', border: 'border-[#FFD9D9]' },
    { id: 'grateful', icon: HeartHandshake, en: 'Grateful', rw: 'Ndashimira', score: 5, color: 'text-[#059669]', bg: 'bg-[#EDF9F3]', border: 'border-[#D1F2E2]' },
    { id: 'calm', icon: Wind, en: 'Calm', rw: 'Ntuze', score: 4, color: 'text-[#2563EB]', bg: 'bg-[#EFF6FF]', border: 'border-[#D6E7FF]' },
    { id: 'hopeful', icon: Sun, en: 'Hopeful', rw: 'Nzizi', score: 4, color: 'text-[#7C3AED]', bg: 'bg-[#F5F2FF]', border: 'border-[#E4DCFB]' },
    { id: 'loved', icon: Heart, en: 'Loved', rw: 'Nkundwa', score: 5, color: 'text-[#DB2777]', bg: 'bg-[#FFF0F6]', border: 'border-[#FFD6E8]' },
    { id: 'neutral', icon: Meh, en: 'Neutral', rw: 'Ahagaze', score: 3, color: 'text-[#495057]', bg: 'bg-[#F8F9FA]', border: 'border-[#E9ECEF]' },
    { id: 'tired', icon: Moon, en: 'Tired', rw: 'Narushye', score: 2, color: 'text-[#2563EB]', bg: 'bg-[#EFF6FF]', border: 'border-[#DAE8FC]' },
    { id: 'sad', icon: Frown, en: 'Sad', rw: 'Ndababaye', score: 2, color: 'text-[#4338CA]', bg: 'bg-[#F1F3FE]', border: 'border-[#DDE1FC]' },
    { id: 'anxious', icon: Activity, en: 'Anxious', rw: 'Mfite ubwoba', score: 1, color: 'text-[#A16207]', bg: 'bg-[#FEFCE8]', border: 'border-[#FEF08A]' },
    { id: 'angry', icon: Flame, en: 'Angry', rw: 'Ndarakaye', score: 1, color: 'text-[#BE123C]', bg: 'bg-[#FFF1F0]', border: 'border-[#FED0CE]' }
  ];

  const [isLoggingMood, setIsLoggingMood] = useState(false);
  const [lastLoggedMood, setLastLoggedMood] = useState<string | null>(null);

  const logMood = async (moodId: string) => {
    if (!user || isLoggingMood) return;
    setIsLoggingMood(true);
    setLastLoggedMood(moodId);
    try {
      const moodObj = MOOD_OPTIONS.find(m => m.id === moodId)!;
      await supabase.from('mood_logs').insert({
        user_id: user.id,
        mood: moodId,
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

    if (data) setMoods(data);
  };

  const fetchJournalData = async (userId: string) => {
    const { data } = await supabase
      .from('journals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) setJournals(data);
  };

  const analyzeProgress = async (userId: string, currentMood?: string) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const baseUrl = (import.meta.env.VITE_RENDER_BACKEND_URL || 'https://humura-ai-1.onrender.com').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/api/progress/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          currentMood,
          lang: isRw ? 'rw' : 'en'
        })
      });

      if (res.ok) {
        const result = await res.json();
        setAnalysis({
          summary: result.summary || "You have been staying mindful and actively tracking your wellness.",
          recommendations: result.recommendations || []
        });
      } else {
        throw new Error("Analysis fallback required");
      }
    } catch (err: any) {
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("No API Key");

        const recentMoods = moods.slice(0, 7).map(m => m.mood);
        const recentJournals = journals.slice(0, 3).map(j => j.content);

        const fallbackRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are Humura AI. Analyze this Rwanda patient's progress.
                  Moods: ${JSON.stringify(recentMoods)}
                  Journals: ${JSON.stringify(recentJournals)}
                  Language: ${isRw ? 'Kinyarwanda' : 'English'}
                  Respond with valid JSON only: { "summary": "...", "recommendations": ["...", "..."] }`
                }]
              }]
            })
          }
        );

        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          const fbText = fbData.candidates?.[0]?.content?.parts?.[0]?.text;
          const jsonMatch = fbText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            setAnalysis({
              summary: parsed.summary,
              recommendations: parsed.recommendations || []
            });
            return;
          }
        }
      } catch (fe) {
        setAnalysis({
          summary: isRw 
            ? "Urakomeza gutera imbere umunsi ku wundi. Gukomeza kwandika uko umerewe bifasha kugarura umutuzo." 
            : "You are making steady progress each day. Continuing to log your feelings builds emotional resilience.",
          recommendations: [
            isRw ? "Fata iminota 5 yo guhumeka ituze" : "Take 5 minutes for mindful breathing",
            isRw ? "Ganira na Humura AI mu buryo bwa CBT" : "Chat with Humura AI for a CBT reframing session"
          ]
        });
      }
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
        mood_emoji: 'private'
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
      const dayLogs = moods.filter(m => m.created_at && toLocalDate(new Date(m.created_at)) === date);
      const score = dayLogs.length > 0 ? (dayLogs[0].score || 3) : 0;
      return { date, value: score };
    });
  };

  const weeklyData = getWeeklyData();

  return (
    <div className="min-h-screen bg-[#F4F8F6] text-[#08352A] p-4 sm:p-8 lg:p-10 font-poppins">
      
      {/* Video consultation modal if active */}
      <AnimatePresence>
        {isRoomOpen && activeSession && (
          <VideoConsultationRoom
            session={activeSession}
            role="patient"
            onEnd={() => setIsRoomOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E2F2EC] text-[#08352A] text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-[#21B48D]" />
              <span>{isRw ? 'Iterambere n’Imyirondoro' : 'Progress & Journal Analytics'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08352A] tracking-tight">
              {isRw ? 'Urugendo Rwanjye rwo Gukira' : 'My Healing & Wellness Journey'}
            </h1>
            <p className="text-xs sm:text-sm text-[#5E8E81] mt-0.5">
              {isRw
                ? 'Gukurikirana imiterere y’umutima n’inyandiko zawe byizewe mu ibanga.'
                : 'Track emotional patterns and confidential reflections over time.'}
            </p>
          </div>

          {/* Tab Pill Selector */}
          <div className="flex items-center bg-white border border-[#DCEBE3] rounded-full p-1.5 shadow-xs self-start md:self-auto">
            <button
              onClick={() => setActiveTab('mood')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'mood'
                  ? 'bg-[#08352A] text-white shadow-xs'
                  : 'text-[#5E8E81] hover:text-[#08352A]'
              }`}
            >
              <TrendingUp size={14} />
              <span>{isRw ? 'Imiterere y’Umutima' : 'Mood Analytics'}</span>
            </button>
            <button
              onClick={() => setActiveTab('journal')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'journal'
                  ? 'bg-[#08352A] text-white shadow-xs'
                  : 'text-[#5E8E81] hover:text-[#08352A]'
              }`}
            >
              <BookOpen size={14} />
              <span>{isRw ? 'Igitabo cy’Ubwiteganyirize' : 'Private Journal'}</span>
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT 8 COLS: Active Tab Content */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === 'mood' ? (
                <motion.div
                  key="mood-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Quick Mood Log Panel (Lucide Icons) */}
                  <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-[#DFEBE5] shadow-xs">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-8 h-8 rounded-xl bg-[#E2F2EC] flex items-center justify-center text-[#08352A]">
                        <Heart size={16} className="text-[#21B48D]" />
                      </div>
                      <h2 className="text-base sm:text-lg font-extrabold text-[#08352A]">
                        {isRw ? 'Andika uko umerewe none' : 'Log Your Current Emotional State'}
                      </h2>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3">
                      {MOOD_OPTIONS.map((mood) => {
                        const Icon = mood.icon;
                        const isSelected = lastLoggedMood === mood.id;
                        return (
                          <button
                            key={mood.id}
                            onClick={() => logMood(mood.id)}
                            disabled={isLoggingMood}
                            className={`${mood.bg} border ${
                              isSelected ? 'border-[#08352A] ring-2 ring-[#08352A]/20 scale-102' : mood.border
                            } rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50`}
                          >
                            <Icon size={20} className={mood.color} />
                            <span className="text-[10px] font-bold text-[#08352A] leading-tight text-center">
                              {isRw ? mood.rw : mood.en}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {lastLoggedMood && (
                      <p className="text-center text-xs font-bold text-[#21B48D] mt-4 animate-in fade-in">
                        ✓ {isRw ? 'Byabitswe neza mu gitabo cyawe!' : 'Mood logged securely in your personal clinical timeline.'}
                      </p>
                    )}
                  </div>

                  {/* Weekly Trends Bar Chart */}
                  <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-[#DFEBE5] shadow-xs">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#E2F2EC] flex items-center justify-center text-[#08352A]">
                          <TrendingUp size={16} className="text-[#21B48D]" />
                        </div>
                        <h2 className="text-base sm:text-lg font-extrabold text-[#08352A]">
                          {isRw ? 'Imiterere y’Icyumweru' : 'Weekly Emotional Trend'}
                        </h2>
                      </div>
                      <span className="text-[11px] font-semibold text-[#5E8E81]">Last 7 Days</span>
                    </div>

                    <div className="flex items-end justify-between h-48 gap-3 sm:gap-4 px-2">
                      {weeklyData.map((day, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                          <div className="w-full relative flex flex-col justify-end h-36 bg-[#F4F8F6] rounded-2xl overflow-hidden p-1">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${(day.value / 5) * 100}%` }}
                              transition={{ duration: 0.5, delay: idx * 0.05 }}
                              className={`w-full rounded-xl transition-all ${
                                day.value === 0 
                                  ? 'bg-transparent' 
                                  : day.value >= 4 
                                  ? 'bg-[#21B48D]' 
                                  : 'bg-[#08352A]'
                              }`}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-[#5E8E81] uppercase">
                            {dayNames[idx]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="journal-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Journal Input Card */}
                  <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-[#DFEBE5] shadow-xs space-y-4">
                    <h2 className="text-base sm:text-lg font-extrabold text-[#08352A] flex items-center gap-2">
                      <Plus size={18} className="text-[#21B48D]" />
                      <span>{isRw ? 'Andika inyandiko nshya mu ibanga' : 'Write a Private Reflection'}</span>
                    </h2>
                    <textarea
                      value={newJournal}
                      onChange={(e) => setNewJournal(e.target.value)}
                      placeholder={
                        isRw 
                          ? 'Andika uko umunsi wagenze, ibyo wishimiye cyangwa ibyakuremereye...' 
                          : 'How was your day? Pour your thoughts here in complete medical confidentiality...'
                      }
                      className="w-full h-36 p-4 bg-[#F4F8F6] rounded-2xl border border-[#DCEBE3] focus:border-[#21B48D] focus:ring-2 ring-[#21B48D]/20 outline-none text-xs sm:text-sm font-medium text-[#08352A] placeholder-[#8DB4A8]"
                    />
                    <button
                      onClick={handleSaveJournal}
                      disabled={isSavingJournal || !newJournal.trim()}
                      className="w-full py-3.5 bg-[#08352A] hover:bg-[#154E3F] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingJournal ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                      <span>{isRw ? 'Bika Inyandiko' : 'Save Reflection'}</span>
                    </button>
                  </div>

                  {/* Previous Journals */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-[#5E8E81] uppercase tracking-wider flex items-center gap-1.5">
                      <History size={13} />
                      <span>{isRw ? 'Ibyo Wanditse Mbere' : 'Previous Journal Entries'}</span>
                    </h3>

                    {journals.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#8DB4A8] bg-white rounded-3xl border border-[#DFEBE5]">
                        {isRw ? 'Nta nyandiko urandika. Tangira ubu!' : 'No journal entries yet. Start writing today!'}
                      </div>
                    ) : (
                      journals.map((j) => (
                        <div
                          key={j.id}
                          className="bg-white rounded-3xl p-5 border border-[#DFEBE5] shadow-xs space-y-2"
                        >
                          <div className="flex items-center justify-between text-[11px] text-[#5E8E81] font-semibold">
                            <span>{new Date(j.created_at).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1 text-[#21B48D]">
                              <Lock size={10} /> Private
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-normal text-[#08352A] leading-relaxed">
                            {j.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT 4 COLS: AI Clinical Insights Card & Emergency Link */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* AI Insights Card */}
            <div className="bg-[#08352A] rounded-[2rem] p-6 sm:p-7 text-white shadow-md flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#154E3F] flex items-center justify-center text-[#21B48D]">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      {isRw ? 'Ubusesenguzi bwa AI' : 'Humura AI Insights'}
                    </h3>
                    <p className="text-[10px] text-[#73A697]">Evidence-based synthesis</p>
                  </div>
                </div>

                {isAnalyzing ? (
                  <div className="py-8 text-center space-y-3">
                    <Loader2 size={24} className="animate-spin text-[#21B48D] mx-auto" />
                    <p className="text-xs font-semibold text-[#8DB4A8]">
                      {isRw ? 'Humura AI iri gusesengura...' : 'Synthesizing clinical patterns...'}
                    </p>
                  </div>
                ) : analysis ? (
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#73A697] mb-1.5">
                        {isRw ? 'Inshamake' : 'Clinical Summary'}
                      </p>
                      <p className="text-xs text-[#E1EFEA] leading-relaxed italic">
                        "{analysis.summary}"
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#73A697]">
                        {isRw ? 'Inama Z’uyu Munsi' : 'Key Recommendations'}
                      </p>
                      {analysis.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 bg-[#0D3F33] p-3 rounded-2xl border border-[#165545] text-xs text-white"
                        >
                          <ChevronRight size={13} className="text-[#21B48D] flex-shrink-0 mt-0.5" />
                          <span className="font-medium leading-relaxed">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                onClick={() => setShowShareModal(true)}
                disabled={!analysis || isAnalyzing}
                className="mt-6 w-full py-3 bg-[#21B48D] hover:bg-[#1DA17D] text-[#08352A] font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Share2 size={14} />
                <span>{isRw ? 'Sangira Raporo' : 'Share Progress Report'}</span>
              </button>
            </div>

            {/* Crisis Hotline Box */}
            <div className="bg-[#FFF1F0] rounded-3xl p-5 border border-[#FFD9D9] flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#E11D48] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-[#881337]">
                  {isRw ? 'Ukeneye Ubutabazi?' : 'Need Immediate Help?'}
                </h4>
                <p className="text-[11px] text-[#9F1239] mt-0.5">
                  Call 114 (Rwanda Toll-Free National Hotline).
                </p>
                <button
                  onClick={() => navigate('/patient/emergency')}
                  className="text-[11px] font-bold text-[#E11D48] hover:underline mt-1 inline-flex items-center gap-1"
                >
                  <span>{isRw ? 'Reba ubutabazi' : 'Open Emergency Hub'}</span> →
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 space-y-6 z-10 border border-[#DFEBE5]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#08352A]">
                  {isRw ? 'Sangira Raporo' : 'Share Wellness Summary'}
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1 text-[#8DB4A8] hover:text-[#08352A] rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'whatsapp', icon: MessageCircle, color: 'bg-green-600', label: 'WhatsApp' },
                  { id: 'email', icon: Mail, color: 'bg-[#08352A]', label: 'Email' },
                  { id: 'copy', icon: Copy, color: 'bg-[#21B48D]', label: isRw ? 'Kopiye' : 'Copy' },
                  { id: 'chat', icon: Send, color: 'bg-blue-600', label: 'Telegram' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      const shareText = `Humura AI Wellness Progress:\n\n${analysis?.summary}\n\nMind Supported, Life Empowered.`;
                      if (p.id === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                      else if (p.id === 'email') window.location.href = `mailto:?subject=Humura AI Progress&body=${encodeURIComponent(shareText)}`;
                      else if (p.id === 'chat') window.open(`https://t.me/share/url?url=${encodeURIComponent(shareText)}`, '_blank');
                      else if (p.id === 'copy') {
                        navigator.clipboard.writeText(shareText);
                        alert(isRw ? 'Byakopewe!' : 'Copied to clipboard!');
                      }
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#F4F8F6] hover:bg-[#EBF3EF] transition-all cursor-pointer"
                  >
                    <div className={`w-10 h-10 ${p.color} text-white rounded-xl flex items-center justify-center shadow-xs`}>
                      <p.icon size={18} />
                    </div>
                    <span className="text-xs font-bold text-[#08352A]">{p.label}</span>
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
