import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar, AlertCircle, TrendingUp, MessageSquare, 
  Search, Filter, ChevronRight, MoreVertical, Bell,
  FileText, Activity, Clock, Shield, BarChart2,
  Settings, LogOut, Phone, Send, Info, Loader2, Mail, CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useClinicalEvents } from '../hooks/useClinicalEvents';
import { io } from 'socket.io-client';
import AnalyticsOverview from '../components/doctor/AnalyticsOverview';
import PatientManagement from '../components/doctor/PatientManagement';
import VideoConsultationRoom from '../components/clinical/VideoConsultationRoom';
import ResourceModal from '../components/doctor/ResourceModal';
import VideoSession from '../components/clinical/VideoSession';



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
  const navigate = useNavigate();
  const isRw = i18n.language?.startsWith('rw');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  // Live Data State
  const [patients, setPatients] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [crisisAlerts, setCrisisAlerts] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [moodLogs, setMoodLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [selectedResource, setSelectedResource] = useState<'guidelines' | 'privacy' | null>(null);
  const [activeVideoSession, setActiveVideoSession] = useState<any>(null);

  // Clinical Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportEmail, setReportEmail] = useState('');
  const [generatedReport, setGeneratedReport] = useState<any>(null);


  const { activeSession } = useClinicalEvents(doctorProfile?.id, 'doctor');

  useEffect(() => {
    fetchInitialData();
    
    // Setup Realtime with cleanup
    const channel = supabase
      .channel('clinical-ops')
      .on('postgres_changes', { event: '*', table: 'crisis_events' }, () => fetchInitialData())
      .on('postgres_changes', { event: '*', table: 'patients' }, () => fetchInitialData())
      .on('postgres_changes', { event: '*', table: 'sessions' }, () => fetchInitialData())
      .on(
        'postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'patient_caseload',
          filter: doctorProfile?.id ? `doctor_id=eq.${doctorProfile.id}` : undefined
        }, 
        async (payload) => {
          console.log('[DASHBOARD] Real-time caseload update received:', payload);
          showToast(isRw ? 'Umurwayi mushya yongeyeho!' : 'New patient assigned to caseload!', 'success');
          fetchInitialData(); // Refresh all lists
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctorProfile?.id]); 

  useEffect(() => {
    if (doctorProfile?.id) {
      const socket = io(import.meta.env.VITE_RENDER_BACKEND_URL, {
        query: { 
          userId: doctorProfile.id,
          role: 'doctor'
        },
        transports: ["websocket"]
      });

      socket.on("patient:assigned", (data: any) => {
        showToast(`${isRw ? 'Umurwayi mushya' : 'New Patient'}: ${data.patient_name}`, 'success');
        fetchInitialData();
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [doctorProfile?.id, isRw]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/auth';
      return;
    }

    try {
      // 1. Doctor Profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setDoctorProfile(profile);

      // 2. Assigned Patients (via Handshake table)
      const { data: caseloadData } = await supabase
        .from('patient_caseload')
        .select(`
          *,
          patient:patient_id(
            full_name, avatar_url, phone
          ),
          clinical_info:patients!patient_id(
            primary_concern, phq9_score, gad7_score, status, self_harm_flag, concern_duration, emergency_contact
          )
        `)
        .eq('doctor_id', user.id)
        .eq('status', 'active');
      
      const formattedPatients = (caseloadData || []).map(item => ({
        id: item.patient_id,
        status: item.clinical_info?.[0]?.status || item.status,
        primary_concern: item.clinical_info?.[0]?.primary_concern,
        phq9_score: item.clinical_info?.[0]?.phq9_score,
        gad7_score: item.clinical_info?.[0]?.gad7_score,
        self_harm_flag: item.clinical_info?.[0]?.self_harm_flag,
        concern_duration: item.clinical_info?.[0]?.concern_duration,
        emergency_contact: item.clinical_info?.[0]?.emergency_contact,
        patient_info: item.patient
      }));

      setPatients(formattedPatients);

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
        .select('*, profiles:patient_id(full_name, phone)')
        .is('resolved_at', null);
      setCrisisAlerts(alerts || []);
    } catch (err: any) {
      console.error("Dashboard data fetch failed:", err);
      showToast(isRw ? "Gushaka amakuru byanze" : "Failed to load dashboard data", 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMoodLogs = async (patientId: string) => {
    const { data } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('patient_id', patientId)
      .order('logged_at', { ascending: false })
      .limit(5);
    setMoodLogs(data || []);
  };

  useEffect(() => {
    if (selectedPatient) {
      fetchMoodLogs(selectedPatient.id);
    }
  }, [selectedPatient]);

  const handleResolveCrisis = async (alertId: string) => {
    setActionLoading(alertId);
    try {
      const { error } = await supabase
        .from('crisis_events')
        .update({ 
          resolved_at: new Date().toISOString(),
          resolved_by: doctorProfile.id 
        })
        .eq('id', alertId);

      if (error) throw error;
      showToast(isRw ? "Ikibazo cyakemutse" : "Crisis alert resolved");
      fetchInitialData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptBooking = async (sessionId: string) => {
    setActionLoading(sessionId);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString() 
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      showToast(isRw ? "Wemeye guhura n'umurwayi" : "Booking accepted!");
      fetchInitialData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateSessionStatus = async (sessionId: string, status: 'active' | 'completed' | 'missed' | 'scheduled') => {
    setActionLoading(sessionId);
    try {
      const updates: any = { status };
      if (status === 'active') updates.started_at = new Date().toISOString();
      if (status === 'completed') updates.ended_at = new Date().toISOString();

      const { error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', sessionId);

      if (error) throw error;
      
      const statusLabels: any = {
        active: isRw ? "Ikiganiro cyatangiye" : "Session started",
        completed: isRw ? "Ikiganiro cyarangiye" : "Session completed",
        missed: isRw ? "Umurwayi ntiyabonetse" : "Marked as missed",
        scheduled: isRw ? "Gusubika igihe" : "Rescheduled"
      };

      showToast(statusLabels[status]);
      
      if (status === 'active') {
        const { data: sessionData } = await supabase.from('sessions').select('*, profiles:patient_id(full_name)').eq('id', sessionId).single();
        setCurrentSession(sessionData);
        
        // Notify Patient via Backend Socket
        try {
          await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/api/session/notify-start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientId: sessionData.patient_id,
              sessionId: sessionId,
              doctorName: doctorProfile?.full_name || "Doctor"
            })
          });
          console.log('[DASHBOARD] Real-time join notification sent to patient');
        } catch (e) {
          console.error('[DASHBOARD] Failed to send real-time notification', e);
        }
      } else if (status === 'completed' || status === 'missed') {
        setCurrentSession(null);
      }

      fetchInitialData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const startVideoSession = async (sessionId: string) => {
    if (!doctorProfile?.id) return;
    setActionLoading('video-' + sessionId);
    try {
      const response = await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/api/sessions/${sessionId}/start-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorName: doctorProfile.full_name
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create video room');
      
      setActiveVideoSession({
        id: sessionId,
        room_url: data.video_room_url
      });
      
      showToast(isRw ? 'Icyumba cya videwo kiriteguye!' : 'Video room ready!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestSummary = async (patient: any, email?: string) => {
    if (!patient) return;
    setActionLoading('summary');
    try {
      const response = await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/api/doctor/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          email: email
        })
      });
 
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate report');
      
      setGeneratedReport(data.report);
      showToast(isRw ? "Raporo y'ubuvuzi yabonetse" : email ? `Report sent to ${email}` : "Clinical summary generated");
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };
 
  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;
    setIsAiThinking(true);
    setAiResponse('');
    try {
      const response = await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `CLINICAL QUERY FROM DOCTOR: ${aiQuestion}\n\nContext: You are helping a mental health professional in Rwanda. Provide evidence-based clinical guidance.`,
          history: []
        })
      });
      const data = await response.json();
      setAiResponse(data.reply);
      setAiQuestion('');
    } catch (err: any) {
      showToast(isRw ? "AI ntishoboye gusubiza" : "AI failed to respond", 'error');
    } finally {
      setIsAiThinking(false);
    }
  };

  const toggleLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleCallPatient = (phone: string) => {
    if (!phone) {
      showToast(isRw ? "Nta nomero yabonetse" : "No phone number available", 'error');
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear(); // Clear any cached session or preferences
      window.location.replace('/');
    } catch (err) {
      window.location.replace('/');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex">
      {/* Video Consultation Overlay */}
      <AnimatePresence>
        {currentSession && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100]">
            <VideoConsultationRoom 
              session={currentSession} 
              role="doctor"
              onEnd={() => handleUpdateSessionStatus(currentSession.id, 'completed')} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl font-bold text-sm ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Sidebar --- */}
      <aside className="w-64 bg-white border-r border-[#E8E1DB] flex flex-col p-6 fixed h-full z-50">
        <div className="flex items-center gap-3 mb-4 px-2">
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
            { id: 'dashboard', icon: Activity, label: isRw ? 'Inshamake' : 'Dashboard' },
            { id: 'insights', icon: BarChart2, label: isRw ? 'Ubushakashatsi' : 'Clinical Insights' },
            { id: 'patients', icon: Users, label: isRw ? 'Abarwayi banjye' : 'My patients', count: patients.length },
            { id: 'sessions', icon: Calendar, label: isRw ? 'Guhura' : 'Sessions' },
            { id: 'crisis', icon: AlertCircle, label: isRw ? 'Ibitabaza' : 'Crisis alerts', count: crisisAlerts.length, danger: true },
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

        <div className="mt-auto space-y-4">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} />
            {isRw ? 'Sohoka' : 'Logout'}
          </button>

          <div className="p-4 bg-[#F8F5F2] rounded-3xl border border-[#E8E1DB]">
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
        </div>
      </aside>


      {/* --- Main Content --- */}
      <main className="flex-1 ml-64 flex flex-col">
        <header className="h-20 bg-white border-b border-[#E8E1DB] flex items-center justify-between px-10 sticky top-0 z-40">
          <div>
            <h2 className="text-xl font-black text-[#4A2C1A]">
              {isRw ? 'Mwaramutse' : 'Good morning'}, {doctorProfile?.full_name?.split(' ')[0]}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex bg-[#F8F5F2] p-1 rounded-xl border border-[#E8E1DB]">
              <button 
                onClick={() => toggleLanguage('en')}
                className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${!isRw ? 'bg-white shadow-sm text-emerald-700' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                English
              </button>
              <button 
                onClick={() => toggleLanguage('rw')}
                className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${isRw ? 'bg-white shadow-sm text-emerald-700' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                Kinyarwanda
              </button>
            </div>
            <button className="relative p-2 text-neutral-400 hover:text-primary transition-colors">
              <Bell size={20} />
              {crisisAlerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>
          </div>
        </header>

        <div className="p-10 flex gap-8">
          <div className="flex-1 space-y-8">
            {/* Dashboard View */}
            {activeTab === 'dashboard' && (
              <>
                <div className="grid grid-cols-3 gap-6">
                  <StatCard label={isRw ? "Guhura uyu munsi" : "Today's Sessions"} value={sessions.length} sub="Real-time" icon={Calendar} color="bg-emerald-500" />
                  <StatCard label={isRw ? "Abarwayi bakomeye" : "Active Patients"} value={patients.length} sub={`${patients.filter(p => p.status === 'active').length} active`} icon={Users} color="bg-blue-500" />
                  <StatCard label={isRw ? "Ibitabaza" : "Crisis Alerts"} value={crisisAlerts.length} sub="Immediate response" icon={AlertCircle} color="bg-red-500" />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-white rounded-[2.5rem] border border-[#E8E1DB] overflow-hidden flex flex-col h-[500px]">
                    <div className="p-6 border-b border-[#E8E1DB] flex items-center justify-between">
                      <h3 className="font-black text-[#4A2C1A]">{isRw ? 'Urutonde rw\'abarwayi' : 'Patient caseload'}</h3>
                      <button 
                        onClick={() => setActiveTab('patients')}
                        className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline"
                      >
                        {isRw ? 'Reba bose' : 'View all'}
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {patients.length === 0 ? (
                        <div className="p-10 text-center text-neutral-400 font-medium">{isRw ? 'Nta barwayi baraboneka' : 'No patients assigned yet.'}</div>
                      ) : patients.map((p, i) => (
                        <div 
                          key={p.id} 
                          onClick={() => setSelectedPatient(p)}
                          className={`p-4 flex items-center gap-4 border-b border-[#F8F5F2] hover:bg-neutral-50 transition-colors cursor-pointer ${selectedPatient?.id === p.id ? 'bg-emerald-50/50' : ''}`}
                        >
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xs uppercase">
                            {p.patient_info?.full_name?.charAt(0) || '?'}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-black text-[#4A2C1A]">{p.patient_info?.full_name}</p>
                            <p className="text-[10px] font-bold text-neutral-400">{p.primary_concern} · PHQ-9: {p.phq9_score}</p>
                          </div>

                          <ChevronRight size={14} className="text-neutral-300" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    {selectedPatient ? (
                      <div className="bg-white rounded-[2.5rem] border border-[#E8E1DB] p-6 space-y-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-black text-[#4A2C1A]">{isRw ? 'Imiterere y\'umurwayi' : 'Patient Insights'}</h3>
                          <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">{selectedPatient.status}</span>
                        </div>
                        <div className="space-y-3">
                          <div className="p-4 bg-neutral-50 rounded-2xl">
                            <p className="text-[9px] font-black text-neutral-400 uppercase mb-1">{isRw ? 'Ibibazo afite' : 'Primary Concern'}</p>
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
                            <p className="text-[9px] font-black text-red-400 uppercase mb-1">{isRw ? 'Icyo kwitonderwa' : 'Risk Assessment'}</p>
                            <p className="text-sm font-black text-red-900">
                              {selectedPatient.self_harm_flag ? '⚠️ Self-harm reported in intake' : 'Low clinical risk'}
                            </p>
                          </div>
                          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                            <p className="text-[9px] font-black text-blue-400 uppercase mb-1">{isRw ? 'Igihe bimaze' : 'Duration of Concern'}</p>
                            <p className="text-sm font-black text-blue-900">{selectedPatient.concern_duration || 'Not specified'}</p>
                          </div>
                          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                            <p className="text-[9px] font-black text-emerald-400 uppercase mb-1">{isRw ? 'Ubufasha bwihutirwa' : 'Emergency Contact'}</p>
                            <p className="text-sm font-black text-emerald-900">{selectedPatient.emergency_contact?.name} ({selectedPatient.emergency_contact?.phone})</p>
                          </div>
                          
                          {/* Mood History Mini-Chart/List */}
                          <div className="pt-4">
                            <h4 className="text-[10px] font-black text-neutral-400 uppercase mb-3">{isRw ? 'Imiterere y\'iminsi ishize' : 'Recent Mood History'}</h4>
                            <div className="space-y-2">
                              {moodLogs.length === 0 ? (
                                <p className="text-[10px] text-neutral-400 italic">No mood logs recorded yet.</p>
                              ) : moodLogs.map(log => (
                                <div key={log.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg">{log.emoji || '😐'}</span>
                                    <div>
                                      <p className="text-[10px] font-black text-[#4A2C1A]">{new Date(log.logged_at).toLocaleDateString()}</p>
                                      <p className="text-[9px] font-bold text-neutral-400 uppercase">Score: {log.mood_score}/10</p>
                                    </div>
                                  </div>
                                  <div className={`w-2 h-2 rounded-full ${log.mood_score > 7 ? 'bg-emerald-500' : log.mood_score > 4 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                </div>
                              ))}
                            </div>
                          </div>

                          <button 
                            onClick={() => setShowReportModal(true)}
                            className="w-full py-3 bg-primary text-white font-black text-xs uppercase rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                          >
                            <FileText size={14} />
                            {isRw ? 'Saba inshamake y\'ubuvuzi' : 'Generate Clinical Report'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-[2.5rem] border border-dashed border-[#E8E1DB] flex-1 flex flex-col items-center justify-center p-10 text-center">
                        <Users size={48} className="text-neutral-100 mb-4" />
                        <p className="text-neutral-400 font-bold">{isRw ? 'Hitamo umurwayi kugira ngo urebe amakuru ye' : 'Select a patient from caseload to view live clinical context.'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Patients Tab */}
            {activeTab === 'patients' && (
              <div className="bg-white rounded-[2.5rem] border border-[#E8E1DB] p-8 h-[calc(100vh-200px)]">
                <PatientManagement 
                  patients={patients.map(p => ({
                    id: p.id,
                    name: p.patient_info?.full_name || 'Anonymous',
                    location: 'Rwanda',
                    risk: p.phq9_score > 15 ? 'high' : 'low',
                    status: p.status,
                    diagnosis: p.primary_concern
                  }))} 
                />
              </div>
            )}

            {/* Sessions Tab */}
            {activeTab === 'sessions' && (
              <div className="bg-white rounded-[2.5rem] border border-[#E8E1DB] p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-[#4A2C1A]">{isRw ? 'Guhura' : 'Your Schedule'}</h3>
                  <div className="flex gap-2">
                     <span className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                       {sessions.filter(s => s.status === 'scheduled').length} {isRw ? 'Ibitegerejwe' : 'Pending'}
                     </span>
                  </div>
                </div>

                {sessions.length === 0 ? (
                  <div className="p-20 text-center">
                    <Calendar size={64} className="mx-auto text-neutral-100 mb-4" />
                    <p className="text-neutral-400 font-bold">{isRw ? 'Nta mibonano iteganyijwe' : 'No sessions scheduled yet.'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {[...sessions].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()).map(s => (
                      <div key={s.id} className="p-6 bg-white border border-[#E8E1DB] rounded-3xl flex items-center justify-between hover:shadow-md transition-all">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-[#F8F5F2] rounded-2xl border border-[#E8E1DB] flex flex-col items-center justify-center">
                            <p className="text-[10px] font-black text-neutral-400 uppercase leading-none mb-1">
                              {new Date(s.scheduled_at).toLocaleString('default', { month: 'short' })}
                            </p>
                            <p className="text-2xl font-black text-primary leading-none">
                              {new Date(s.scheduled_at).getDate()}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-black text-[#4A2C1A]">{s.profiles?.full_name}</p>
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                s.status === 'scheduled' ? 'bg-blue-100 text-blue-600' :
                                s.status === 'active' ? 'bg-emerald-100 text-emerald-600 animate-pulse' :
                                s.status === 'completed' ? 'bg-neutral-100 text-neutral-500' :
                                'bg-red-100 text-red-600'
                              }`}>
                                {s.status}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-neutral-400 flex items-center gap-2">
                              <Clock size={12} />
                              {new Date(s.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              <span className="w-1 h-1 bg-neutral-200 rounded-full" />
                              {isRw ? 'Ikiganiro cya videwo' : 'Video Consultation'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {s.status === 'pending' || s.status === 'scheduled' ? (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleUpdateSessionStatus(s.id, 'missed')}
                                disabled={actionLoading === s.id}
                                className="px-4 py-2 text-red-500 font-black text-[10px] uppercase hover:bg-red-50 rounded-lg transition-colors"
                              >
                                {isRw ? 'Ntiyabonetse' : 'Mark Missed'}
                              </button>
                              <button 
                                onClick={() => handleAcceptBooking(s.id)}
                                disabled={actionLoading === s.id}
                                className="px-6 py-2.5 bg-emerald-600 text-white font-black text-xs uppercase rounded-xl shadow-lg shadow-emerald-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                              >
                                {actionLoading === s.id ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                                {isRw ? 'Kwemeza' : 'Accept Request'}
                              </button>
                            </div>
                          ) : s.status === 'confirmed' ? (
                            <button 
                              onClick={() => startVideoSession(s.id)}
                              disabled={actionLoading === 'video-' + s.id}
                              className="px-6 py-2.5 bg-primary text-white font-black text-xs uppercase rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                              {actionLoading === 'video-' + s.id ? <Loader2 size={14} className="animate-spin" /> : <Phone size={14} />}
                              {isRw ? 'Tangira' : 'Start Session'}
                            </button>
                          ) : s.status === 'active' ? (
                            <button 
                              onClick={() => handleUpdateSessionStatus(s.id, 'completed')}
                              className="px-6 py-2.5 bg-neutral-900 text-white font-black text-xs uppercase rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                            >
                              {isRw ? 'Sohora' : 'Complete'}
                            </button>
                          ) : null}
                          {s.status === 'completed' && (
                            <button 
                              onClick={() => { setSelectedPatient({ id: s.patient_id, patient_info: s.profiles }); setActiveTab('dashboard'); }}
                              className="px-4 py-2 bg-neutral-50 text-neutral-500 font-black text-[10px] uppercase rounded-lg hover:bg-neutral-100"
                            >
                              {isRw ? 'Andika inyandiko' : 'View Notes'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Crisis Alerts Tab */}
            {activeTab === 'crisis' && (
              <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-8">
                <h3 className="text-2xl font-black text-red-900 mb-8 flex items-center gap-3">
                  <AlertCircle size={28} />
                  {isRw ? 'Ubutabazi bwihutirwa' : 'Critical Crisis Alerts'}
                </h3>
                {crisisAlerts.length === 0 ? (
                  <div className="p-20 text-center">
                    <Shield size={64} className="mx-auto text-red-100 mb-4" />
                    <p className="text-red-400 font-bold">{isRw ? 'Nta kibazo kidasanzwe cyabonetse' : 'All systems clear. No active crisis alerts.'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {crisisAlerts.map(alert => (
                      <div key={alert.id} className="bg-white p-8 rounded-[2rem] border border-red-100 shadow-sm space-y-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center font-black text-2xl animate-pulse">
                              {alert.profiles?.full_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xl font-black text-red-900">{alert.profiles?.full_name}</p>
                              <p className="font-bold text-red-600 uppercase text-xs tracking-widest">{alert.trigger_type} · {new Date(alert.triggered_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="px-4 py-2 bg-red-600 text-white font-black rounded-xl text-xs uppercase tracking-tighter">
                            High Priority
                          </div>
                        </div>
                        
                        <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100 italic text-red-900 font-medium">
                          {alert.last_message}
                        </div>

                        <div className="flex gap-4">
                          <button 
                            onClick={() => handleCallPatient(alert.profiles?.phone)}
                            className="flex-1 py-4 bg-white border-2 border-red-600 text-red-600 font-black uppercase text-sm rounded-2xl flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
                          >
                            <Phone size={18} />
                            {isRw ? 'Hamagara' : 'Emergency Call'}
                          </button>
                          <button 
                            onClick={() => handleResolveCrisis(alert.id)}
                            disabled={actionLoading === alert.id}
                            className="flex-1 py-4 bg-red-600 text-white font-black uppercase text-sm rounded-2xl flex items-center justify-center gap-2 hover:bg-red-700 transition-all disabled:opacity-50"
                          >
                            {actionLoading === alert.id ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                            {isRw ? 'Kemura ikibazo' : 'Resolve & Close'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Insights Tab */}
            {activeTab === 'insights' && (
              <div className="bg-white rounded-[2.5rem] border border-[#E8E1DB] p-8">
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-[#4A2C1A]">{isRw ? "Ubushakashatsi n'Isesengura" : 'Clinical Analytics'}</h3>
                  <p className="text-sm font-bold text-neutral-400">{isRw ? 'Isesengura rya AI ku barwayi bawe' : 'AI-powered insights across your patient caseload'}</p>
                </div>
                <AnalyticsOverview doctorProfile={doctorProfile} />
              </div>
            )}

          </div>

          {/* Right Sidebar - Dynamic Context */}
          {activeTab === 'dashboard' && (
            <div className="w-80 space-y-6">
              <div className="bg-red-50 border border-red-100 p-6 rounded-[2.5rem] space-y-4">
                <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest">{isRw ? 'Ibitabaza' : 'Live Crisis alerts'} ({crisisAlerts.length})</h3>
                {crisisAlerts.length === 0 ? (
                  <p className="text-xs text-red-700/50">{isRw ? 'Nta bitabaza bihari' : 'No active alerts. System stable.'}</p>
                ) : crisisAlerts.slice(0, 2).map(alert => (
                  <div key={alert.id} className="space-y-2 pb-4 border-b border-red-100 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                      <p className="text-xs font-black text-red-900">{alert.profiles?.full_name}</p>
                    </div>
                    <p className="text-[9px] font-bold text-red-600/60 uppercase">{alert.trigger_type} · {new Date(alert.triggered_at).toLocaleTimeString()}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button 
                        onClick={() => handleCallPatient(alert.profiles?.phone)}
                        className="py-2 bg-white text-red-600 text-[10px] font-black uppercase rounded-lg border border-red-100"
                      >
                        {isRw ? 'Hamagara' : 'Call'}
                      </button>
                      <button 
                        onClick={() => handleResolveCrisis(alert.id)}
                        className="py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg"
                      >
                        {isRw ? 'Kemura' : 'Resolve'}
                      </button>
                    </div>
                  </div>
                ))}
                {crisisAlerts.length > 0 && (
                   <button 
                    onClick={() => setActiveTab('crisis')}
                    className="w-full text-center text-[10px] font-bold text-red-600 hover:underline pt-2 border-t border-red-100"
                   >
                     {isRw ? 'Reba byose' : 'View all alerts'} →
                   </button>
                )}
              </div>

              {/* Ask Humura AI */}
              <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2.5rem] space-y-4">
                <div className="flex items-center gap-2">
                  <Activity className="text-indigo-400" size={16} />
                  <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{isRw ? 'Baza Humura AI' : 'Ask Humura AI'}</h3>
                </div>
                
                <div className="relative">
                  <input 
                    type="text" 
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                    placeholder={isRw ? 'Andika ikibazo hano...' : 'Type clinical query...'}
                    className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-medium focus:ring-2 ring-indigo-200 outline-none pr-10"
                  />
                  <button 
                    onClick={handleAskAI}
                    disabled={isAiThinking || !aiQuestion.trim()}
                    className="absolute right-2 top-1.5 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-30"
                  >
                    {isAiThinking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>

                <AnimatePresence>
                  {aiResponse && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-4 bg-white/50 border border-indigo-100 rounded-2xl"
                    >
                      <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">AI Assistant</p>
                      <p className="text-xs font-medium text-indigo-900 leading-relaxed whitespace-pre-wrap">
                        {aiResponse}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!aiResponse && !isAiThinking && (
                  <p className="text-[10px] font-bold text-indigo-400/60 text-center italic">
                    {isRw ? 'Baza ibyerekeye ubuvuzi cyangwa amabwiriza.' : 'Ask about clinical protocols or guidelines.'}
                  </p>
                )}
              </div>

              {/* Support Resources */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-[#E8E1DB]">
                <h3 className="text-[10px] font-black text-[#4A2C1A] uppercase tracking-widest mb-4">{isRw ? 'ibikoresho' : 'Resources'}</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => setSelectedResource('guidelines')}
                    className="w-full flex items-center justify-between p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={14} className="text-neutral-400" />
                      <span className="text-[10px] font-black text-[#4A2C1A] uppercase">{isRw ? 'Amabwiriza' : 'Clinical Guidelines'}</span>
                    </div>
                    <ChevronRight size={12} className="text-neutral-300" />
                  </button>

                  <button 
                    onClick={() => setSelectedResource('privacy')}
                    className="w-full flex items-center justify-between p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Shield size={14} className="text-neutral-400" />
                      <span className="text-[10px] font-black text-[#4A2C1A] uppercase">{isRw ? 'Umutekano' : 'Privacy Protocol'}</span>
                    </div>
                    <ChevronRight size={12} className="text-neutral-300" />
                  </button>

                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <ResourceModal 
        type={selectedResource}
        isOpen={!!selectedResource}
        onClose={() => setSelectedResource(null)}
        isRw={isRw}
      />

      <ClinicalReportModal 
        isOpen={showReportModal}
        onClose={() => { setShowReportModal(false); setGeneratedReport(null); setReportEmail(''); }}
        patient={selectedPatient}
        onGenerate={(email) => handleRequestSummary(selectedPatient, email)}
        loading={actionLoading === 'summary'}
        report={generatedReport}
        isRw={isRw}
      />

      {/* Daily.co Video Session */}
      <AnimatePresence>
        {activeVideoSession && (
          <VideoSession 
            roomUrl={activeVideoSession.room_url}
            role="doctor"
            sessionId={activeVideoSession.id}
            onLeave={() => setActiveVideoSession(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Report Modal ---
const ClinicalReportModal = ({ isOpen, onClose, patient, onGenerate, loading, report, isRw }: any) => {
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#4A2C1A]">{isRw ? 'Raporo y\'Ubuvuzi' : 'Clinical Progress Report'}</h3>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{patient?.patient_info?.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors">
            <MoreVertical size={20} className="rotate-90 text-neutral-400" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-8">
          {!report ? (
            <div className="space-y-6">
              <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl space-y-3">
                <h4 className="text-sm font-black text-emerald-900 flex items-center gap-2">
                  <Shield size={16} />
                  {isRw ? 'Ibisabwa' : 'Report Parameters'}
                </h4>
                <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                  {isRw 
                    ? 'Raporo ikorwa na AI ishingiye ku makuru y\'umurwayi yo mu byumweru bibiri bishize, harimo n\'ibyanditswe mu kinyamakuru cye.' 
                    : 'The AI will analyze the last 14 days of patient data, including mood logs and journal entries, to generate a professional SOAP-style summary.'}
                </p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">{isRw ? 'Imeli yo kuyohererezaho (Uhitamo)' : 'Destination Email (Optional)'}</span>
                  <div className="mt-1 relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={18} />
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doctor@hospital.rw"
                      className="w-full pl-12 pr-4 py-4 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-primary/30 outline-none font-bold text-sm transition-all"
                    />
                  </div>
                  <p className="text-[9px] text-neutral-400 mt-2 ml-1">
                    {isRw 
                      ? 'Niba ushaka kuyibona hano gusa, reka uyu mwanya urimo ubusa.' 
                      : 'Leave blank to just view the report here.'}
                  </p>
                </label>
              </div>
              
              <button 
                onClick={() => onGenerate(email)}
                disabled={loading}
                className="w-full py-4 bg-primary text-white font-black uppercase text-sm rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Activity size={18} />}
                {isRw ? 'Tangira Gukora Raporo' : 'Generate & Process Report'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-emerald-600" size={20} />
                  <div>
                    <p className="text-xs font-black text-emerald-900">{isRw ? 'Raporo yabonetse' : 'Report Generated Successfully'}</p>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Trend: {report.mood_trend}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-emerald-400 uppercase">Avg Mood</p>
                  <p className="text-lg font-black text-emerald-900 leading-none">{report.avg_mood_score}/10</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-6 bg-neutral-50 rounded-3xl border border-neutral-100">
                  <h4 className="text-[10px] font-black text-neutral-400 uppercase mb-3 tracking-widest">{isRw ? 'Inshamake ya AI' : 'Clinical AI Summary'}</h4>
                  <p className="text-sm font-medium text-primary-900 leading-relaxed whitespace-pre-wrap italic">
                    "{report.ai_summary}"
                  </p>
                </div>

                <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase mb-4 tracking-widest">{isRw ? 'Imyanzuro n\'Inama' : 'Clinical Recommendations'}</h4>
                  <div className="space-y-3">
                    {report.recommendations?.map((rec: string, i: number) => (
                      <div key={i} className="flex gap-3 text-sm font-bold text-indigo-900 bg-white/50 p-3 rounded-xl border border-indigo-50">
                        <span className="text-indigo-400">0{i+1}</span>
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    const text = `CLINICAL REPORT: ${patient?.patient_info?.full_name}\n\nSummary: ${report.ai_summary}\n\nRecommendations:\n${report.recommendations.join('\n')}`;
                    navigator.clipboard.writeText(text);
                    // showToast not available here but maybe we can add a local feedback
                  }}
                  className="flex-1 py-4 bg-neutral-100 text-neutral-600 font-black uppercase text-xs rounded-2xl hover:bg-neutral-200 transition-all"
                >
                  {isRw ? 'Kopi' : 'Copy Text'}
                </button>
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 bg-primary text-white font-black uppercase text-xs rounded-2xl hover:bg-primary-600 shadow-lg shadow-primary/20 transition-all"
                >
                  {isRw ? 'Funga' : 'Close Report'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

