import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar, AlertCircle, TrendingUp, MessageSquare, 
  Search, Filter, ChevronRight, MoreVertical, Bell,
  FileText, Activity, Clock, Shield, Library, BarChart2,
  Settings, LogOut, Phone, Send, Info, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// --- Sub-components ---
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
  
  // Live Data State
  const [patients, setPatients] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [crisisAlerts, setCrisisAlerts] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();
    setupRealtime();
  }, []);

  const fetchInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Doctor Profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setDoctorProfile(profile);

    // 2. Assigned Patients
    const { data: patientList } = await supabase
      .from('patients')
      .select('*, profiles(full_name, avatar_url)')
      .eq('doctor_id', user.id);
    setPatients(patientList || []);

    // 3. Today's Sessions
    const today = new Date().toISOString().split('T')[0];
    const { data: sessionList } = await supabase
      .from('sessions')
      .select('*, profiles:patient_id(full_name)')
      .eq('doctor_id', user.id)
      .gte('scheduled_at', today);
    setSessions(sessionList || []);

    // 4. Crisis Alerts
    const { data: alerts } = await supabase
      .from('crisis_events')
      .select('*, profiles:patient_id(full_name)')
      .is('resolved_at', null);
    setCrisisAlerts(alerts || []);

    setLoading(false);
  };

  const setupRealtime = () => {
    // Listen for new crisis events
    supabase
      .channel('clinical-ops')
      .on('postgres_changes', { event: 'INSERT', table: 'crisis_events' }, payload => {
        fetchInitialData(); // Simple refresh for now
      })
      .on('postgres_changes', { event: 'INSERT', table: 'messages' }, payload => {
        // Notification logic for messages
      })
      .subscribe();
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
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">Clinical Environment</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { id: 'dashboard', icon: Activity, label: 'Dashboard' },
            { id: 'patients', icon: Users, label: 'My patients', count: patients.length },
            { id: 'sessions', icon: Calendar, label: 'Sessions' },
            { id: 'crisis', icon: AlertCircle, label: 'Crisis alerts', count: crisisAlerts.length, danger: true },
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
              {item.count > 0 && (
                <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-black ${
                  item.danger ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4 bg-[#F8F5F2] rounded-3xl border border-[#E8E1DB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-black text-sm shadow-md">
              {doctorProfile?.full_name?.charAt(0) || 'DR'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black text-[#4A2C1A] truncate">{doctorProfile?.full_name}</p>
              <p className="text-[9px] font-bold text-[#8B5E3C] uppercase tracking-tighter">{doctorProfile?.specialty || 'Psychiatrist'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 ml-64 flex flex-col">
        <header className="h-20 bg-white border-b border-[#E8E1DB] flex items-center justify-between px-10 sticky top-0 z-40">
          <div>
            <h2 className="text-xl font-black text-[#4A2C1A]">Good morning, {doctorProfile?.full_name?.split(' ')[0]}</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex bg-[#F8F5F2] p-1 rounded-xl border border-[#E8E1DB]">
              <button className="px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all bg-white shadow-sm text-emerald-700">EN</button>
              <button className="px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all text-neutral-400 hover:text-neutral-600">RW</button>
            </div>
          </div>
        </header>

        <div className="p-10 flex gap-8">
          <div className="flex-1 space-y-8">
            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-6">
              <StatCard label="Today's Sessions" value={sessions.length} sub="Real-time" icon={Calendar} color="bg-emerald-500" />
              <StatCard label="Active Patients" value={patients.length} sub={`${patients.filter(p => p.status === 'active').length} active`} icon={Users} color="bg-blue-500" />
              <StatCard label="Crisis Alerts" value={crisisAlerts.length} sub="Immediate response" icon={AlertCircle} color="bg-red-500" />
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Patient Caseload - Real Data */}
              <div className="bg-white rounded-[2.5rem] border border-[#E8E1DB] overflow-hidden flex flex-col h-[500px]">
                <div className="p-6 border-b border-[#E8E1DB] flex items-center justify-between">
                  <h3 className="font-black text-[#4A2C1A]">Patient caseload</h3>
                  <button className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline">View all</button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {patients.length === 0 ? (
                    <div className="p-10 text-center text-neutral-400 font-medium">No patients assigned yet.</div>
                  ) : patients.map((p, i) => (
                    <div 
                      key={p.id} 
                      onClick={() => setSelectedPatient(p)}
                      className={`p-4 flex items-center gap-4 border-b border-[#F8F5F2] hover:bg-neutral-50 transition-colors cursor-pointer ${selectedPatient?.id === p.id ? 'bg-emerald-50/50' : ''}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xs uppercase">
                        {p.profiles?.full_name?.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-[#4A2C1A]">{p.profiles?.full_name}</p>
                        <p className="text-[10px] font-bold text-neutral-400">{p.primary_concern} · PHQ-9: {p.phq9_score}</p>
                      </div>
                      <ChevronRight size={14} className="text-neutral-300" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Context */}
              <div className="flex flex-col gap-6">
                 {selectedPatient ? (
                   <div className="bg-white rounded-[2.5rem] border border-[#E8E1DB] p-6 space-y-4 flex-1">
                     <div className="flex items-center justify-between">
                       <h3 className="font-black text-[#4A2C1A]">Patient Insights</h3>
                       <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">{selectedPatient.status}</span>
                     </div>
                     <div className="space-y-3">
                       <div className="p-4 bg-neutral-50 rounded-2xl">
                         <p className="text-[9px] font-black text-neutral-400 uppercase mb-1">Primary Concern</p>
                         <p className="text-sm font-black text-primary-900 capitalize">{selectedPatient.primary_concern}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                         <div className="p-4 bg-neutral-50 rounded-2xl">
                           <p className="text-[9px] font-black text-neutral-400 uppercase mb-1">PHQ-9 (Depression)</p>
                           <p className="text-sm font-black text-primary-900">{selectedPatient.phq9_score}/27</p>
                         </div>
                         <div className="p-4 bg-neutral-50 rounded-2xl">
                           <p className="text-[9px] font-black text-neutral-400 uppercase mb-1">GAD-7 (Anxiety)</p>
                           <p className="text-sm font-black text-primary-900">{selectedPatient.gad7_score}/21</p>
                         </div>
                       </div>
                       <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                         <p className="text-[9px] font-black text-red-400 uppercase mb-1">Risk Assessment</p>
                         <p className="text-sm font-black text-red-900">
                           {selectedPatient.self_harm_flag ? '⚠️ Self-harm reported in intake' : 'Low clinical risk'}
                         </p>
                       </div>
                     </div>
                   </div>
                 ) : (
                   <div className="bg-white rounded-[2.5rem] border border-dashed border-[#E8E1DB] flex-1 flex flex-col items-center justify-center p-10 text-center">
                     <Users size={48} className="text-neutral-100 mb-4" />
                     <p className="text-neutral-400 font-bold">Select a patient from caseload to view live clinical context.</p>
                   </div>
                 )}

                 {/* Appointments - Live */}
                 <div className="bg-white p-6 rounded-[2.5rem] border border-[#E8E1DB]">
                   <h3 className="font-black text-[#4A2C1A] text-sm mb-4">Today's appointments</h3>
                   <div className="space-y-3">
                     {sessions.length === 0 ? (
                       <p className="text-xs text-neutral-400">No sessions scheduled for today.</p>
                     ) : sessions.slice(0, 2).map((s, i) => (
                       <div key={s.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
                         <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                         <p className="text-[10px] font-black text-[#4A2C1A]">{new Date(s.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                         <div>
                           <p className="text-xs font-black text-[#4A2C1A]">{s.profiles?.full_name}</p>
                           <p className="text-[9px] font-bold text-neutral-400">Scheduled Session</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Crisis alerts - Real Data */}
          <div className="w-80 space-y-6">
            <div className="bg-red-50 border border-red-100 p-6 rounded-[2.5rem] space-y-4">
              <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest">Live Crisis alerts ({crisisAlerts.length})</h3>
              {crisisAlerts.length === 0 ? (
                <p className="text-xs text-red-700/50">No active alerts. System stable.</p>
              ) : crisisAlerts.map(alert => (
                <div key={alert.id} className="space-y-2 pb-4 border-b border-red-100 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    <p className="text-xs font-black text-red-900">{alert.profiles?.full_name}</p>
                  </div>
                  <p className="text-[9px] font-bold text-red-600/60 uppercase">{alert.trigger_type} · {new Date(alert.triggered_at).toLocaleTimeString()}</p>
                  <p className="text-[10px] font-medium text-red-800 bg-white/50 p-2 rounded-xl border border-red-100 italic">"{alert.last_message}"</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button className="py-2 bg-white text-red-600 text-[10px] font-black uppercase rounded-lg">Call</button>
                    <button className="py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg">Resolve</button>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Clinical Insight */}
            <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2.5rem] space-y-4">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Clinical Insight</h3>
              <p className="text-xs font-medium text-indigo-900 leading-relaxed">
                Gemini is monitoring patient activity. {patients.length > 0 ? `Analyzing data for ${patients.length} active cases.` : 'Waiting for more patient data to generate trends.'}
              </p>
              <button className="text-[10px] font-bold text-indigo-600 hover:underline">Request clinical summary →</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

