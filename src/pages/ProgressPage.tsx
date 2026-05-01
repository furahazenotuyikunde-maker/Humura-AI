import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Sparkles, AlertCircle, Loader2, ChevronRight, Share2, X, MessageCircle, Send, Mail, Copy } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

interface MoodLog {
  logged_at: string;
  mood: string;
}

const ProgressPage: React.FC = () => {
  const { i18n } = useTranslation();
  
  // Safe-Start: Ensure we have a valid translation context
  const isRw = i18n?.language?.startsWith('rw') || false;
  
  const [moods, setMoods] = useState<MoodLog[]>([]);
  const [analysis, setAnalysis] = useState<{ summary: string; recommendations: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Mood to value mapping for the chart
  const moodMap: Record<string, number> = {
    'happy': 5, 'calm': 4, 'neutral': 3, 'sad': 2, 'stressed': 1, 'angry': 1
  };

  const dayNames = isRw 
    ? ['Kwe', 'Kab', 'Gat', 'Kan', 'Gat', 'Saa', 'Dim'] 
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    let channel: any;

    const initializeData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const userId = session.user.id;
        fetchMoodData(userId);

        // Real-time listener for instant UI updates
        channel = supabase
          .channel('mood-updates')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'mood_logs', filter: `patient_id=eq.${userId}` },
            () => fetchMoodData(userId)
          )
          .subscribe();
      } else {
        setIsLoading(false);
      }
    };

    initializeData();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const fetchMoodData = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('mood_logs')
        .select('logged_at, mood')
        .eq('patient_id', userId)
        .order('logged_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      const validMoods = data || [];
      setMoods(validMoods);
      
      // Trigger AI analysis only if we have data and backend exists
      if (validMoods.length > 0 && import.meta.env.VITE_RENDER_BACKEND_URL) {
        analyzeMoods(validMoods);
      }
    } catch (err) {
      console.error("Error fetching moods:", err);
      setMoods([]);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeMoods = async (data: MoodLog[]) => {
    setIsAnalyzing(true);
    try {
      const moodHistory = data.map(m => ({ 
        date: m.logged_at ? new Date(m.logged_at).toLocaleDateString() : 'N/A', 
        mood: m.mood 
      }));

      const baseUrl = import.meta.env.VITE_RENDER_BACKEND_URL;
      if (!baseUrl) {
        console.warn("VITE_RENDER_BACKEND_URL is not set. Skipping AI analysis.");
        return;
      }

      const response = await fetch(`${baseUrl}/api/ai/analyze-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moods: moodHistory,
          lang: i18n.language || 'en'
        })
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);

      const dataResult = await response.json();
      if (dataResult.success) {
        setAnalysis({
          summary: dataResult.summary,
          recommendations: dataResult.recommendations
        });
      }
    } catch (err) {
      console.error("AI Analysis Error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getWeeklyData = () => {
    try {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      return last7Days.map(date => {
        const log = moods.find(m => m.logged_at && m.logged_at.startsWith(date));
        return {
          date,
          value: log ? (moodMap[log.mood] || 3) : 0,
          mood: log?.mood || 'none'
        };
      });
    } catch (e) {
      console.error("Critical error in getWeeklyData:", e);
      return [];
    }
  };

  const handleShare = async () => {
    if (!analysis) return;

    const shareText = `${isRw ? 'Raporo y\'Iterambere rya Humura AI' : 'Humura AI Progress Report'}\n\n` +
      `${isRw ? 'Incamake' : 'Summary'}: ${analysis.summary}\n\n` +
      `${isRw ? 'Inama' : 'Recommendations'}:\n${analysis.recommendations.map(r => `• ${r}`).join('\n')}\n\n` +
      `${isRw ? 'Byoherejwe binyuze kuri Humura AI' : 'Shared via Humura AI'}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: isRw ? 'Iterambere rya Humura AI' : 'Humura AI Progress',
          text: shareText,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setShowShareModal(true);
        }
      }
    } else {
      setShowShareModal(true);
    }
  };

  const shareText = analysis ? `${isRw ? 'Raporo y\'Iterambere rya Humura AI' : 'Humura AI Progress Report'}\n\n` +
    `${isRw ? 'Incamake' : 'Summary'}: ${analysis.summary}\n\n` +
    `${isRw ? 'Inama' : 'Recommendations'}:\n${analysis.recommendations.map(r => `• ${r}`).join('\n')}\n\n` +
    `${isRw ? 'Byoherejwe binyuze kuri Humura AI' : 'Shared via Humura AI'}` : '';

  const handlePlatformShare = (platform: string) => {
    const encodedText = encodeURIComponent(shareText);
    const subject = encodeURIComponent(isRw ? 'Iterambere rya Humura AI' : 'Humura AI Progress Report');

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=&text=${encodedText}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${subject}&body=${encodedText}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(shareText);
        alert(isRw ? 'Byakopewe!' : 'Copied to clipboard!');
        break;
    }
    setShowShareModal(false);
  };

  const weeklyData = getWeeklyData();

  return (
    <div className="min-h-screen bg-[#FDFCFB] pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#4A2C1A]">{isRw ? 'Iterambere Ryawe' : 'Your Progress'}</h1>
            <p className="text-[#8B5E3C] mt-1">{isRw ? 'Uko umerewe muri iki cyumweru' : 'How you\'ve been feeling this week'}</p>
          </div>
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-[#E8E1DB]">
            <Calendar className="text-[#8B5E3C]" size={24} />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="animate-spin text-[#8B5E3C]" size={48} />
            <p className="text-[#8B5E3C] italic">{isRw ? 'Turi gukusanya amakuru...' : 'Gathering your progress...'}</p>
          </div>
        ) : moods.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-[#E8E1DB] text-center shadow-sm">
            <Sparkles className="mx-auto text-[#E8E1DB] mb-4" size={64} />
            <h2 className="text-xl font-bold text-[#4A2C1A] mb-2">{isRw ? 'Nta makuru aragaragara' : 'No data yet'}</h2>
            <p className="text-[#8B5E3C] max-w-sm mx-auto">
              {isRw ? 'Tangira wandika uko umerewe buri munsi kugira ngo urebe amajyambere yawe hano.' : 'Start logging your mood daily to see your weekly trends and AI insights here.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Chart Card */}
            <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-[#E8E1DB] shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <TrendingUp className="text-[#8B5E3C]" size={20} />
                <h2 className="text-lg font-bold text-[#4A2C1A]">{isRw ? 'Imyitwarire y’Umutima' : 'Mood Trends'}</h2>
              </div>
              
              <div className="flex items-end justify-between h-48 gap-2">
                {weeklyData.map((day, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className="w-full relative flex flex-col justify-end h-full">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(day.value / 5) * 100}%` }}
                        className={`w-full rounded-t-xl transition-all ${
                          day.value === 0 ? 'bg-gray-100' : 'bg-[#D4A373] group-hover:bg-[#8B5E3C]'
                        }`}
                      />
                    </div>
                    <span className="text-xs font-medium text-[#8B5E3C] uppercase">{dayNames[idx]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights Card */}
            <div className="bg-[#8B5E3C] p-8 rounded-3xl text-white shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles size={20} />
                  <h2 className="text-lg font-bold">{isRw ? 'Gusobanurirwa' : 'AI Insights'}</h2>
                </div>
                
                {isAnalyzing ? (
                  <div className="space-y-4 py-8">
                    <Loader2 className="animate-spin opacity-50" size={32} />
                    <p className="text-sm italic opacity-80">{isRw ? 'Humura AI arasesengura...' : 'Humura AI is analyzing...'}</p>
                  </div>
                ) : analysis ? (
                  <div className="space-y-6">
                    <p className="text-sm leading-relaxed font-medium">"{analysis.summary}"</p>
                    <div className="space-y-3">
                      {analysis.recommendations.map((tip, i) => (
                        <div key={i} className="flex gap-2 text-xs bg-white/10 p-3 rounded-xl border border-white/10">
                          <ChevronRight size={14} className="flex-shrink-0" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm opacity-80">
                    <AlertCircle size={16} />
                    <span>{isRw ? 'Ntabwo twashoboye gusesengura.' : 'Could not generate analysis.'}</span>
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleShare}
                disabled={!analysis || isAnalyzing}
                className="mt-8 w-full py-3 bg-white text-[#8B5E3C] rounded-2xl text-sm font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Share2 size={18} />
                {isRw ? 'Sangira n’Inshuti' : 'Share Progress'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#E8E1DB] flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#4A2C1A]">{isRw ? 'Sangira Raporo' : 'Share Report'}</h3>
                <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-[#FDFCFB] rounded-full transition-colors">
                  <X size={20} className="text-[#8B5E3C]" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handlePlatformShare('whatsapp')}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-[#E8E1DB] hover:bg-green-50 hover:border-green-200 transition-all group"
                >
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                    <MessageCircle size={24} />
                  </div>
                  <span className="text-xs font-bold text-[#4A2C1A]">WhatsApp</span>
                </button>
                <button 
                  onClick={() => handlePlatformShare('telegram')}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-[#E8E1DB] hover:bg-blue-50 hover:border-blue-200 transition-all group"
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    <Send size={24} />
                  </div>
                  <span className="text-xs font-bold text-[#4A2C1A]">Telegram</span>
                </button>
                <button 
                  onClick={() => handlePlatformShare('email')}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-[#E8E1DB] hover:bg-red-50 hover:border-red-200 transition-all group"
                >
                  <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
                    <Mail size={24} />
                  </div>
                  <span className="text-xs font-bold text-[#4A2C1A]">Email</span>
                </button>
                <button 
                  onClick={() => handlePlatformShare('copy')}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-[#E8E1DB] hover:bg-[#FDFCFB] transition-all group"
                >
                  <div className="w-12 h-12 bg-[#8B5E3C] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#8B5E3C]/20 group-hover:scale-110 transition-transform">
                    <Copy size={24} />
                  </div>
                  <span className="text-xs font-bold text-[#4A2C1A]">{isRw ? 'Kopiye' : 'Copy'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProgressPage;
