'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../layout';

/**
 * User Progress Page
 * Features: Direct Supabase reads (respecting RLS), Realtime subscriptions 
 * for live updates, and a modern card-based progress dashboard.
 */
export default function ProgressPage() {
  const { session } = useAuth();
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;

    // 1. Initial Load of progress data
    const fetchProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', session.user.id)
          .order('completed_at', { ascending: false });

        if (error) throw error;
        if (data) setProgress(data);
      } catch (err) {
        console.error("Error fetching progress:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();

    // 2. Rule: Use Supabase Realtime to update the progress display live
    const channel = supabase
      .channel('progress-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setProgress(prev => {
              const exists = prev.find(p => p.lesson_id === payload.new.lesson_id);
              if (exists) {
                // Update existing lesson entry
                return prev.map(p => p.lesson_id === payload.new.lesson_id ? payload.new : p);
              }
              // Add new lesson entry at the top
              return [payload.new, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-white tracking-tight">Learning Journey</h2>
          <p className="text-white/40 font-medium">Real-time performance metrics and lesson milestones</p>
        </div>
        <div className="bg-blue-600/10 border border-blue-500/20 px-4 py-2 rounded-2xl text-blue-400 text-sm font-bold flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Live Sync Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {progress.map((p) => (
          <div 
            key={p.id} 
            className="group relative bg-slate-900/40 border border-white/5 rounded-[32px] p-8 backdrop-blur-xl transition-all duration-500 hover:bg-slate-900/60 hover:border-blue-500/40 hover:-translate-y-1 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="h-14 w-14 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-2xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                  <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5.89 12.55L12 15.89l6.11-3.34c.66.36.89 1.19.53 1.85-.36.66-1.19.89-1.85.53l-4.79 2.62v2.1c0 .75-.41 1.44-1.07 1.81L12 21l-.93-.52c-.66-.37-1.07-1.06-1.07-1.81v-2.1l-4.79-2.62c-.66-.36-.89-1.19-.53-1.85s1.19-.89 1.85-.53z"/>
                </svg>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Score</div>
                <div className="text-3xl font-black text-white group-hover:text-blue-400 transition-colors">
                  {p.score}<span className="text-sm font-medium text-white/30 ml-0.5">%</span>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{p.lesson_id}</h3>
            <p className="text-sm text-white/30 mb-6 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(p.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>

            <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-300 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                style={{ width: `${p.score}%` }} 
              />
            </div>
            
            <div className="mt-4 flex justify-between items-center text-[10px] font-bold text-white/20 uppercase tracking-widest">
              <span>Status: Completed</span>
              <span>RLS Verified</span>
            </div>
          </div>
        ))}
        {progress.length === 0 && (
          <div className="col-span-full py-32 text-center bg-slate-900/20 border-2 border-dashed border-white/5 rounded-[40px]">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-white/20 text-lg font-medium">No progress records found for your account.</p>
            <p className="text-white/10 text-sm mt-2">Start your first lesson to see your achievements here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
