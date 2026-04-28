import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Sparkles, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

interface MoodLog {
  created_at: string;
  mood: string;
}

const ProgressPage: React.FC = () => {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const [moods, setMoods] = useState<MoodLog[]>([]);
  const [analysis, setAnalysis] = useState<{ summary: string; tips: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mood to value mapping for the chart
  const moodMap: Record<string, number> = {
    'happy': 5,
    'calm': 4,
    'neutral': 3,
    'sad': 2,
    'stressed': 1,
    'angry': 1
  };

  const dayNames = isRw 
    ? ['Kwe', 'Kab', 'Gat', 'Kan', 'Gat', 'Saa', 'Dim'] 
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    fetchMoodData();
  }, []);

  const fetchMoodData = async () => {
    setIsLoading(true);
    try {
      // Fetch last 7 days of mood logs
      const { data, error } = await supabase
        .from('mood_logs')
        .select('created_at, mood')
        .order('created_at', { ascending: false })
        .limit(30); // Get enough to find the last 7 distinct days

      if (error) throw error;

      if (data && data.length > 0) {
        setMoods(data);
        analyzeMoods(data);
      }
    } catch (err) {
      console.error("Error fetching moods:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeMoods = async (data: MoodLog[]) => {
    setIsAnalyzing(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const moodHistory = data.map(m => `${new Date(m.created_at).toLocaleDateString()}: ${m.mood}`).join(', ');

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this user's mood history for the past week: [${moodHistory}].
              Provide a response in ${isRw ? 'Kinyarwanda' : 'English'} in the following JSON format:
              {
                "summary": "A warm, empathetic 2-sentence summary of their emotional trend, aware of Rwandan context.",
                "tips": ["Tip 1 (culturally aware)", "Tip 2 (practical)", "Tip 3 (mental health focused)"]
              }
              Ensure the advice is supportive and uses Rwandan cultural references where appropriate (e.g., family support, community, nature).`
            }]
          }]
        })
      });

      const result = await response.json();
      const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (aiResponse) {
        // Handle potential markdown backticks in JSON response
        const cleanJson = aiResponse.replace(/```json|```/g, '').trim();
        setAnalysis(JSON.parse(cleanJson));
      }
    } catch (err) {
      console.error("AI Analysis Error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getWeeklyData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const log = moods.find(m => m.created_at.startsWith(date));
      return {
        date,
        value: log ? moodMap[log.mood] || 3 : 0,
        mood: log?.mood || 'none'
      };
    });
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
                      {analysis.tips.map((tip, i) => (
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
              
              <button className="mt-8 w-full py-3 bg-white text-[#8B5E3C] rounded-2xl text-sm font-bold hover:bg-opacity-90 transition-all">
                {isRw ? 'Sangira n’Inshuti' : 'Share Progress'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressPage;
