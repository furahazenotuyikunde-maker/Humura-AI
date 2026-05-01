import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar, AlertCircle, TrendingUp, MessageSquare, 
  Search, Filter, ChevronRight, MoreVertical, Bell,
  FileText, Activity, Clock, Shield
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// --- Components ---
import PatientManagement from '../components/doctor/PatientManagement';
import SessionInterface from '../components/doctor/SessionInterface';
import AnalyticsOverview from '../components/doctor/AnalyticsOverview';
import CrisisPanel from '../components/doctor/CrisisPanel';

export default function DoctorDashboard() {
  const { t, i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'sessions' | 'crisis'>('overview');
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
        .select('*')
        .eq('id', user.id)
        .single();
      setDoctorProfile(data);
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50/30">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-primary-600 font-bold animate-pulse">
          {isRw ? 'Iri gukora...' : 'Loading Clinical Environment...'}
        </p>
      </div>
    </div>
  );

  // If not a doctor, redirect or show error (for demo, we'll just show the UI)
  if (doctorProfile && doctorProfile.role !== 'doctor') {
    return (
      <div className="p-10 text-center">
        <Shield size={64} className="mx-auto text-red-400 mb-4" />
        <h1 className="text-2xl font-bold text-primary-900">Access Denied</h1>
        <p className="text-primary-600">This area is reserved for verified clinical professionals.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-primary-50 p-6 space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Activity className="text-primary" size={24} />
          </div>
          <span className="font-black text-primary-900 text-lg">Doctor Portal</span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'overview', icon: Activity, label: isRw ? 'Ibiherereye' : 'Overview' },
            { id: 'patients', icon: Users, label: isRw ? 'Abarwayi' : 'Patients' },
            { id: 'sessions', icon: Calendar, label: isRw ? 'Ibiganiro' : 'Sessions' },
            { id: 'crisis', icon: AlertCircle, label: isRw ? 'Ubutabazi' : 'Crisis Alerts', danger: true },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                activeTab === item.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : item.danger 
                    ? 'text-red-500 hover:bg-red-50' 
                    : 'text-primary-400 hover:bg-primary-50 hover:text-primary-700'
              }`}
            >
              <item.icon size={18} />
              {item.label}
              {item.id === 'crisis' && (
                <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">
                  3
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 bg-primary-50 rounded-3xl border border-primary-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm">
              🩺
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black text-primary-900 truncate">{doctorProfile?.full_name}</p>
              <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">Licensed Clinician</p>
            </div>
          </div>
          <button className="w-full py-2 bg-white text-primary text-[10px] font-black uppercase rounded-xl hover:bg-primary-100 transition-colors">
            Account Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-20 bg-white border-b border-primary-50 flex items-center justify-between px-8">
          <div>
            <h1 className="text-xl font-black text-primary-900 capitalize">
              {activeTab}
            </h1>
            <p className="text-xs font-bold text-primary-400">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-300" size={16} />
              <input 
                type="text" 
                placeholder="Search patient or session..."
                className="pl-10 pr-4 py-2 bg-neutral-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 w-64"
              />
            </div>
            <button className="p-2.5 rounded-xl bg-neutral-50 text-primary-400 hover:text-primary transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Active Patients', value: '24', icon: Users, color: 'bg-blue-500' },
                    { label: 'Live Sessions', value: '3', icon: Clock, color: 'bg-emerald-500' },
                    { label: 'Crisis Alerts', value: '3', icon: AlertCircle, color: 'bg-red-500' },
                    { label: 'Avg Mood Score', value: '7.2', icon: TrendingUp, color: 'bg-purple-500' },
                  ].map((stat, i) => (
                    <div key={i} className="glass-card p-6 rounded-[2rem] flex items-center gap-4">
                      <div className={`p-3 ${stat.color} text-white rounded-2xl shadow-lg`}>
                        <stat.icon size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-primary-400 uppercase tracking-widest">{stat.label}</p>
                        <p className="text-2xl font-black text-primary-900">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Today's Appointments */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-black text-primary-900">Today's Appointments</h2>
                      <button className="text-xs font-bold text-primary hover:underline">View All</button>
                    </div>
                    <div className="space-y-3">
                      {[1, 2, 3].map((_, i) => (
                        <div key={i} className="glass-card p-5 rounded-3xl flex items-center justify-between group hover:border-primary/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-xl">
                              {['👤', '👩', '🧔'][i]}
                            </div>
                            <div>
                              <p className="font-bold text-primary-900">Patient Name {i+1}</p>
                              <p className="text-xs text-primary-400">CBT Session · 10:30 AM</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-full">Confirmed</span>
                            <button className="p-2 hover:bg-primary-50 rounded-xl transition-colors">
                              <ChevronRight size={18} className="text-primary-300 group-hover:text-primary" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Crisis Feed */}
                  <div className="space-y-4">
                    <h2 className="font-black text-primary-900">Crisis Feed</h2>
                    <div className="space-y-3">
                      {[1, 2].map((_, i) => (
                        <div key={i} className="bg-red-50 border-2 border-red-100 p-5 rounded-3xl relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <AlertCircle size={16} className="text-red-500" />
                              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Active Alert</span>
                            </div>
                            <span className="text-[10px] font-bold text-red-400">12m ago</span>
                          </div>
                          <p className="font-bold text-red-900 text-sm mb-1">Mugisha Eric</p>
                          <p className="text-xs text-red-700/70 mb-4 line-clamp-2">"I feel like I can't breathe and everything is falling apart..."</p>
                          <div className="flex gap-2">
                            <button className="flex-1 py-2 bg-red-500 text-white text-[10px] font-black uppercase rounded-xl hover:bg-red-600 transition-all">Take Session</button>
                            <button className="px-4 py-2 bg-white border border-red-200 text-red-500 text-[10px] font-black uppercase rounded-xl">Call</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <AnalyticsOverview />
              </motion.div>
            )}

            {activeTab === 'patients' && <PatientManagement />}
            {activeTab === 'sessions' && <SessionInterface />}
            {activeTab === 'crisis' && <CrisisPanel />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
