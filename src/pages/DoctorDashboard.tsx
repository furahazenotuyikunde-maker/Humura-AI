import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar, AlertCircle, TrendingUp, MessageSquare, 
  Search, Filter, ChevronRight, MoreVertical, Bell,
  FileText, Activity, Clock, Shield, Library, BarChart2,
  Settings, LogOut, Phone, Send, Info
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// --- Sub-components (could be moved to separate files later) ---
const StatCard = ({ label, value, sub, icon: Icon, color }: any) => (
  <div className="bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm flex flex-col justify-between h-32">
    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
    <div className="flex items-end justify-between">
      <div>
        <p className="text-3xl font-black text-primary-900 leading-none">{value}</p>
        <p className="text-[10px] font-bold text-neutral-400 mt-1">{sub}</p>
      </div>
      <div className={`p-2.5 ${color} text-white rounded-2xl`}>
        <Icon size={18} />
      </div>
    </div>
  </div>
);

export default function DoctorDashboard() {
  const { t, i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('role, plan_type, full_name')
        .eq('id', user.id)
        .single();
      
      // If not a doctor/professional, we might want to redirect, but for now we let them stay
      // so the user can verify the UI.
      setDoctorProfile(data);
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex">
      {/* --- Sidebar --- */}
      <aside className="w-64 bg-white border-r border-[#E8E1DB] flex flex-col p-6 fixed h-full z-50">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-black text-xl border border-emerald-100">
            H
          </div>
          <div>
            <h1 className="font-black text-[#4A2C1A] text-lg leading-tight">Humura AI</h1>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">Mental health platform</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-4 px-2">Main</p>
          {[
            { id: 'dashboard', icon: Activity, label: 'Dashboard' },
            { id: 'patients', icon: Users, label: 'My patients', count: 18 },
            { id: 'sessions', icon: Calendar, label: 'Sessions' },
            { id: 'crisis', icon: AlertCircle, label: 'Crisis alerts', count: 2, danger: true },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === item.id 
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
                  : 'text-neutral-500 hover:bg-neutral-50'
              }`}
            >
              <item.icon size={18} className={activeTab === item.id ? 'text-emerald-600' : 'text-neutral-400'} />
              {item.label}
              {item.count && (
                <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-black ${
                  item.danger ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}

          <div className="pt-8 space-y-1">
            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-4 px-2">Tools</p>
            {[
              { id: 'cbt', icon: Library, label: 'CBT library' },
              { id: 'insights', icon: BarChart2, label: 'Progress insights' },
              { id: 'braille', icon: FileText, label: 'Braille export' },
              { id: 'referrals', icon: MessageSquare, label: 'Referral letters' },
            ].map((item) => (
              <button key={item.id} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-neutral-500 hover:bg-neutral-50 transition-all">
                <item.icon size={18} className="text-neutral-400" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-8 space-y-1">
            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-4 px-2">Admin</p>
            {[
              { id: 'reports', icon: FileText, label: 'Reports' },
              { id: 'settings', icon: Settings, label: 'Settings' },
            ].map((item) => (
              <button key={item.id} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-neutral-500 hover:bg-neutral-50 transition-all">
                <item.icon size={18} className="text-neutral-400" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="mt-auto p-4 bg-[#F8F5F2] rounded-3xl border border-[#E8E1DB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-black text-sm shadow-md">
              DR
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black text-[#4A2C1A] truncate">{doctorProfile?.full_name || 'Dr. Uwimana A.'}</p>
              <p className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-tighter">Psychiatrist · Kigali</p>
            </div>
          </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 ml-64 flex flex-col">
        {/* Header */}
        <header className="h-20 bg-white border-b border-[#E8E1DB] flex items-center justify-between px-10 sticky top-0 z-40">
          <div>
            <h2 className="text-xl font-black text-[#4A2C1A]">Good morning, Dr. Uwimana</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex bg-[#F8F5F2] p-1 rounded-xl border border-[#E8E1DB]">
              <button className="px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all bg-white shadow-sm text-emerald-700">EN</button>
              <button className="px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all text-neutral-400 hover:text-neutral-600">RW</button>
            </div>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#F8F5F2] border border-[#E8E1DB] flex items-center justify-center text-neutral-400 hover:text-emerald-600 cursor-pointer transition-colors">
                <Bell size={18} />
              </div>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-50 text-red-600 text-[10px] font-black flex items-center justify-center rounded-full border border-red-100 shadow-sm">2</span>
            </div>
          </div>
        </header>

        <div className="p-10 flex gap-8">
          {/* Dashboard Body */}
          <div className="flex-1 space-y-8">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-6">
              <StatCard label="Today's Sessions" value="6" sub="Next: 9:30 AM" icon={Calendar} color="bg-emerald-500" />
              <StatCard label="Active Patients" value="18" sub="3 new this week" icon={Users} color="bg-blue-500" />
              <StatCard label="Crisis Alerts" value="2" sub="Needs attention" icon={AlertCircle} color="bg-red-500" />
            </div>

            {/* Two Column Section */}
            <div className="grid grid-cols-2 gap-8">
              {/* Patient Caseload */}
              <div className="bg-white rounded-[2.5rem] border border-[#E8E1DB] overflow-hidden flex flex-col h-[500px]">
                <div className="p-6 border-b border-[#E8E1DB] flex items-center justify-between">
                  <h3 className="font-black text-[#4A2C1A]">Patient caseload</h3>
                  <button className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline">View all</button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {[
                    { name: 'Mutesi Uwase', task: 'Anxiety disorder', session: 7, initial: 'MU', color: 'bg-emerald-100 text-emerald-600' },
                    { name: 'Jean Ndayisaba', task: 'Depression', session: 3, initial: 'JN', color: 'bg-amber-100 text-amber-600' },
                    { name: 'Aline Rugira', task: 'PTSD', session: 12, initial: 'AR', color: 'bg-blue-100 text-blue-600', active: true },
                    { name: 'Emmanuel Keza', task: 'Grief', session: 5, initial: 'EK', color: 'bg-purple-100 text-purple-600' },
                    { name: 'Claudine Akimana', task: 'Bipolar II', session: 9, initial: 'CA', color: 'bg-orange-100 text-orange-600' },
                  ].map((p, i) => (
                    <div key={i} className={`p-4 flex items-center gap-4 border-b border-[#F8F5F2] hover:bg-neutral-50 transition-colors cursor-pointer ${p.active ? 'bg-emerald-50/50' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${p.color}`}>
                        {p.initial}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-[#4A2C1A]">{p.name}</p>
                        <p className="text-[10px] font-bold text-neutral-400">{p.task} · Session {p.session}</p>
                      </div>
                      {p.active && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Session & Today's Appointments */}
              <div className="flex flex-col gap-6">
                {/* Active Session Chat */}
                <div className="bg-white rounded-[2.5rem] border border-[#E8E1DB] overflow-hidden flex flex-col flex-1">
                  <div className="p-6 border-b border-[#E8E1DB] flex items-center justify-between bg-[#FDFCFB]/50">
                    <div className="flex items-center gap-3">
                      <h3 className="font-black text-[#4A2C1A]">Active session</h3>
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase rounded-full">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Live
                      </span>
                    </div>
                    <p className="text-[10px] font-black text-[#4A2C1A]">Mutesi Uwase</p>
                  </div>
                  
                  <div className="flex-1 p-6 space-y-4 overflow-y-auto text-xs bg-[#FDFCFB]/30">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-black text-[10px]">DR</div>
                      <div className="bg-indigo-50 p-4 rounded-3xl rounded-tl-none max-w-[80%] text-[#4A2C1A] font-medium leading-relaxed">
                        Muraho Mutesi, how have you been feeling since our last session?
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <div className="bg-neutral-100 p-4 rounded-3xl rounded-tr-none max-w-[80%] text-[#4A2C1A] font-medium leading-relaxed">
                        I still feel worried a lot but I tried the breathing exercise. It helped a little.
                      </div>
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-[10px]">MU</div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-black text-[10px]">DR</div>
                      <div className="bg-indigo-50 p-4 rounded-3xl rounded-tl-none max-w-[80%] text-[#4A2C1A] font-medium leading-relaxed">
                        That is great to hear. Let's explore what triggered the worry this week.
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <div className="bg-emerald-50/80 p-4 rounded-3xl border border-emerald-100 text-[11px] leading-relaxed text-emerald-900 font-medium relative">
                        <div className="absolute -top-2 left-4 px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black uppercase rounded-full">AI suggest</div>
                        Consider introducing a thought record to work on the "worry" — patient shows readiness to identify cognitive distortions. Possible pattern: catastrophic...
                      </div>
                    </div>
                  </div>
                </div>

                {/* Today's Appointments Horizontal */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-[#E8E1DB]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-[#4A2C1A] text-sm">Today's appointments</h3>
                    <button className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline">Full calendar</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <p className="text-[10px] font-black text-[#4A2C1A]">9:30</p>
                      <div>
                        <p className="text-xs font-black text-[#4A2C1A]">Mutesi U.</p>
                        <p className="text-[9px] font-bold text-neutral-400">CBT session</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      <p className="text-[10px] font-black text-[#4A2C1A]">11:00</p>
                      <div>
                        <p className="text-xs font-black text-[#4A2C1A]">Jean N.</p>
                        <p className="text-[9px] font-bold text-neutral-400">Crisis follow-up</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar Area */}
          <div className="w-80 space-y-6">
            {/* Crisis Alerts (Right Sidebar) */}
            <div className="bg-red-50 border border-red-100 p-6 rounded-[2.5rem] space-y-4">
              <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest">Crisis alerts (114)</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    <p className="text-xs font-black text-red-900">Jean Ndayisaba</p>
                  </div>
                  <p className="text-[9px] font-bold text-red-600/60 uppercase">SOS triggered · 08:14 AM · Kigali</p>
                  <p className="text-[10px] font-medium text-red-800 leading-relaxed bg-white/50 p-2 rounded-xl border border-red-100">AI risk: High · Last msg: "I can't do this"</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2.5 bg-white border border-red-200 text-red-600 text-[10px] font-black uppercase rounded-xl hover:bg-red-100 transition-colors">Call 114</button>
                  <button className="py-2.5 bg-[#4A2C1A] text-white text-[10px] font-black uppercase rounded-xl hover:bg-black transition-colors">Message</button>
                </div>
              </div>
            </div>

            {/* CBT Progress */}
            <div className="bg-white border border-[#E8E1DB] p-6 rounded-[2.5rem] space-y-4">
              <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">CBT progress</h3>
              <div className="space-y-3">
                {[
                  { name: 'Mutesi U.', prog: 72, color: 'bg-emerald-500' },
                  { name: 'Aline R.', prog: 58, color: 'bg-indigo-500' },
                  { name: 'Emmanuel K.', prog: 45, color: 'bg-blue-500' },
                  { name: 'Jean N.', prog: 21, color: 'bg-orange-500' },
                ].map((p, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-[#4A2C1A]">{p.name}</span>
                      <span className="text-neutral-400">{p.prog}%</span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div className={`h-full ${p.color}`} style={{ width: `${p.prog}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mood Trend Chart */}
            <div className="bg-white border border-[#E8E1DB] p-6 rounded-[2.5rem] space-y-4">
              <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Mutesi — mood trend</h3>
              <div className="flex items-end justify-between h-20 gap-1.5">
                {[30, 45, 40, 65, 55, 80, 75].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div 
                      className={`w-full rounded-md transition-all ${i === 6 ? 'bg-emerald-900' : 'bg-emerald-600/60 group-hover:bg-emerald-600'}`} 
                      style={{ height: `${h}%` }} 
                    />
                    <span className="text-[8px] font-bold text-neutral-400 uppercase">W{i+1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Accessibility Tools */}
            <div className="bg-white border border-[#E8E1DB] p-6 rounded-[2.5rem] space-y-4">
              <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Accessibility tools</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Sign language', icon: '🟢' },
                  { label: 'Braille export', icon: '⚪' },
                  { label: 'Kinyarwanda', icon: '🟢' },
                  { label: 'High contrast', icon: '⚪' },
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-[#F8F5F2] rounded-xl border border-[#E8E1DB]">
                    <span className="text-[8px]">{t.icon}</span>
                    <span className="text-[9px] font-bold text-[#4A2C1A]">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insight of the Day */}
            <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2.5rem] space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Info size={48} className="text-indigo-900" />
              </div>
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">AI insight of the day</h3>
              <p className="text-xs font-medium text-indigo-900 leading-relaxed">
                3 of your patients show improving mood scores this week. Aline R. may benefit from graduated exposure therapy based on session patterns.
              </p>
              <button className="text-[10px] font-bold text-indigo-600 hover:underline">Ask AI for full report →</button>
            </div>
          </div>
        </div>
      </main>

      {/* --- Mobile Bottom Nav (not shown in desktop image but kept for responsiveness) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E1DB] h-16 flex items-center justify-around z-50">
        <Activity size={24} className="text-emerald-600" />
        <Users size={24} className="text-neutral-400" />
        <Calendar size={24} className="text-neutral-400" />
        <AlertCircle size={24} className="text-neutral-400" />
      </nav>
    </div>
  );
}

const Loader2 = ({ className, size }: any) => (
  <svg 
    className={`animate-spin ${className}`} 
    width={size} height={size} 
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

