import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Brain, Sparkles, MessageSquare } from 'lucide-react';

const data = [
  { name: 'Mon', mood: 4, anxiety: 8 },
  { name: 'Tue', mood: 5, anxiety: 7 },
  { name: 'Wed', mood: 6, anxiety: 5 },
  { name: 'Thu', mood: 5, anxiety: 6 },
  { name: 'Fri', mood: 7, anxiety: 4 },
  { name: 'Sat', mood: 8, anxiety: 3 },
  { name: 'Sun', mood: 7, anxiety: 3 },
];

export default function AnalyticsOverview({ doctorProfile }: { doctorProfile?: any }) {
  const [query, setQuery] = useState('');
  const [reply, setReply] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
 
  const handleQuery = async (customQuery?: string | React.MouseEvent) => {
    const q = typeof customQuery === 'string' ? customQuery : query;
    if (!q.trim() || !doctorProfile?.id) return;
    
    if (typeof customQuery === 'string') {
      setQuery(customQuery);
    }

    setAiLoading(true);
    setReply('');
    try {
      const res = await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/api/doctor/query-caseload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: q, 
          doctorId: doctorProfile.id 
        })
      });
      const result = await res.json();
      if (result.success) {
        setReply(result.reply);
      }
    } catch (err) {
      console.error(err);
      setReply("Failed to fetch caseload intelligence. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mood vs Anxiety Chart */}
        <div className="glass-card p-8 rounded-[2.5rem] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-primary-900">Mood & Anxiety Tracking</h3>
              <p className="text-xs font-bold text-primary-400">Weekly progression average</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-primary rounded-full" />
                 <span className="text-[10px] font-bold text-primary-400">Mood</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-red-400 rounded-full" />
                 <span className="text-[10px] font-bold text-primary-400">Anxiety</span>
               </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} dy={10} />
                <YAxis hide domain={[0, 10]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 800, fontSize: '10px' }}
                />
                <Line type="monotone" dataKey="mood" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="anxiety" stroke="#f87171" strokeWidth={4} dot={{ r: 4, fill: '#f87171', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight Cards */}
        <div className="space-y-6">
           <div className="bg-primary text-white p-8 rounded-[2.5rem] relative overflow-hidden shadow-xl shadow-primary/20">
              <div className="relative z-10 space-y-4">
                 <div className="flex items-center gap-2">
                    <Sparkles size={20} />
                    <h3 className="font-black text-sm uppercase tracking-widest">Clinical Insight</h3>
                 </div>
                 <p className="text-sm font-medium leading-relaxed opacity-90">
                    Your caseload shows a 12% improvement in emotional resilience scores this week. Behavioral activation techniques are yielding the highest engagement among patients with Depression.
                 </p>
                 <button 
                   onClick={() => handleQuery("Provide a full clinical analysis of my current caseload including emotional resilience scores, behavioral activation engagement, and key risk factors.")}
                   disabled={aiLoading}
                   className="flex items-center gap-2 py-2.5 px-6 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-[10px] font-black uppercase transition-all disabled:opacity-50"
                 >
                    {aiLoading ? 'Generating...' : 'View Full Analysis'}
                 </button>
              </div>
              <Sparkles className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10" />
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="glass-card p-6 rounded-3xl space-y-4">
                 <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl w-fit">
                    <Target size={20} />
                 </div>
                 <div>
                    <h4 className="font-black text-primary-900 text-sm">Target Reached</h4>
                    <p className="text-xs text-primary-400 font-bold">84% of CBT goals completed</p>
                 </div>
              </div>
              <div className="glass-card p-6 rounded-3xl space-y-4">
                 <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl w-fit">
                    <Brain size={20} />
                 </div>
                 <div>
                    <h4 className="font-black text-primary-900 text-sm">Engagement</h4>
                    <p className="text-xs text-primary-400 font-bold">Avg. 4.2 sessions / patient</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Free-form AI Query */}
      <div className="glass-card p-8 rounded-[2.5rem] border-primary-100 space-y-6">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-primary-50 text-primary rounded-xl flex items-center justify-center">
              <MessageSquare size={20} />
           </div>
           <div>
              <h3 className="font-black text-primary-900">Clinical Data Assistant</h3>
              <p className="text-xs font-bold text-primary-400">Ask Humura AI anything about your caseload or patient history</p>
           </div>
        </div>

        <div className="relative">
           <input 
             type="text" 
             value={query}
             onChange={e => setQuery(e.target.value)}
             placeholder="e.g. 'Summarize the last 3 sessions for patient Eric'..."
             className="w-full pl-6 pr-32 py-4 bg-neutral-50 border-2 border-primary-50 rounded-2xl text-sm focus:border-primary outline-none transition-all font-medium"
           />
           <button 
             onClick={handleQuery}
             disabled={aiLoading}
             className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase rounded-xl hover:scale-105 transition-all disabled:opacity-50"
           >
              {aiLoading ? 'Thinking...' : 'ASK HUMURA AI'}
           </button>
        </div>

        {reply && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-primary-50/50 border border-primary-100 rounded-3xl text-sm text-primary-900 leading-relaxed flex gap-3"
          >
            <Sparkles size={16} className="text-primary mt-1 flex-shrink-0" />
            <p>{reply}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
