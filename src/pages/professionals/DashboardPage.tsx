import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar, AlertCircle, Activity, ChevronRight,
  Video, Phone, Sparkles, Bot, Clock, ArrowUpRight,
  TrendingUp, CheckCircle2, ShieldAlert, HeartPulse, Send, Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function DashboardPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRw = i18n.language?.startsWith('rw');
  const outletCtx = useOutletContext<{ doctorProfile?: any; isAvailable?: boolean; refreshCounters?: () => void }>() || {};

  const [loading, setLoading] = useState(true);
  const [doctorUser, setDoctorUser] = useState<any>(null);
  const [doctorProfile, setDoctorProfile] = useState<any>(outletCtx.doctorProfile || null);

  // Dynamic Clinical Data
  const [patients, setPatients] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [urgentAlerts, setUrgentAlerts] = useState<any[]>([]);
  const [recentMoods, setRecentMoods] = useState<any[]>([]);

  // AI Assistant State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setDoctorUser(user);

      // 1. Fetch Profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (prof) setDoctorProfile(prof);

      // 2. Fetch Active Caseload (Join patient_caseload with profiles & patients)
      let { data: caseloadData, error: caseloadErr } = await supabase
        .from('patient_caseload')
        .select(`
          *,
          patient:profiles!patient_id(
            id, full_name, avatar_url, phone, location
          ),
          clinical_info:patients!patient_id(
            primary_concern, phq9_score, gad7_score, status, self_harm_flag, concern_duration, emergency_contact
          )
        `)
        .eq('doctor_id', user.id)
        .eq('status', 'active');

      if (caseloadErr) {
        // Fallback join
        const { data: fallbackData } = await supabase
          .from('patient_caseload')
          .select(`
            *,
            patient:profiles!patient_id(id, full_name, avatar_url, phone, location)
          `)
          .eq('doctor_id', user.id)
          .eq('status', 'active');
        caseloadData = fallbackData || [];
      }

      const formattedPatients = (caseloadData || []).map((item: any) => {
        const clinical = Array.isArray(item.clinical_info) ? item.clinical_info[0] : item.clinical_info;
        const patientInfo = Array.isArray(item.patient) ? item.patient[0] : item.patient;

        return {
          id: item.patient_id,
          status: clinical?.status || item.status,
          primary_concern: clinical?.primary_concern,
          phq9_score: clinical?.phq9_score || 0,
          gad7_score: clinical?.gad7_score || 0,
          self_harm_flag: clinical?.self_harm_flag || false,
          concern_duration: clinical?.concern_duration,
          emergency_contact: clinical?.emergency_contact,
          patient_info: patientInfo || { full_name: 'Patient', id: item.patient_id }
        };
      });

      setPatients(formattedPatients);

      // 3. Fetch Today's & Upcoming Sessions
      const today = new Date().toISOString().split('T')[0];
      const { data: sessionList } = await supabase
        .from('sessions')
        .select('*, profiles:patient_id(full_name, phone)')
        .eq('doctor_id', user.id)
        .gte('scheduled_at', today)
        .order('scheduled_at', { ascending: true })
        .limit(10);

      setSessions(sessionList || []);

      // 4. Fetch Unresolved Crisis Alerts & AI Tasks
      const { data: alertsList } = await supabase
        .from('crisis_events')
        .select('*, profiles:patient_id(full_name, phone)')
        .is('resolved_at', null)
        .order('triggered_at', { ascending: false })
        .limit(5);

      setUrgentAlerts(alertsList || []);

      // 5. Fetch Recent Mood Logs from Caseload patients
      const patientIds = formattedPatients.map(p => p.id);
      if (patientIds.length > 0) {
        const { data: moodData } = await supabase
          .from('mood_logs')
          .select('*, profiles:patient_id(full_name)')
          .in('patient_id', patientIds)
          .order('logged_at', { ascending: false })
          .limit(6);
        setRecentMoods(moodData || []);
      }
    } catch (err) {
      console.error('Error fetching clinical dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Ask AI clinical guidance
  const handleAskClinicalAI = async (queryText?: string) => {
    const query = (queryText || aiQuestion).trim();
    if (!query) return;

    setIsAiThinking(true);
    setAiResponse('');

    try {
      const baseUrl = (import.meta.env.VITE_RENDER_BACKEND_URL || 'https://humura-ai-1.onrender.com').replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `CLINICAL QUERY FROM PRACTICING DOCTOR: ${query}\n\nContext: You are Humura AI, a senior clinical supervisor aiding mental health professionals in Rwanda. Provide concise, evidence-based CBT advice.`,
          history: []
        })
      });

      if (!response.ok) throw new Error('Primary server busy');
      const data = await response.json();
      if (!data || !data.reply) throw new Error('No reply');

      setAiResponse(data.reply);
      setAiQuestion('');
    } catch (err) {
      // Gemini Direct Fallback
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error('API key unavailable');

        const fbRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                role: 'user',
                parts: [{
                  text: `CLINICAL SUPERVISION FOR DOCTOR IN RWANDA: ${query}\n\nProvide practical, culturally grounded mental health guidance.`
                }]
              }],
              systemInstruction: {
                parts: [{ text: "You are Humura AI, a licensed clinical psychology copilot assisting Rwandan practitioners." }]
              }
            })
          }
        );

        if (!fbRes.ok) throw new Error('Gemini fallback failed');
        const fbData = await fbRes.json();
        const replyText = fbData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!replyText) throw new Error('No text generated');

        setAiResponse(replyText);
        setAiQuestion('');
      } catch (fbErr: any) {
        showToast(isRw ? 'Ubufasha bwa AI ntibubonetse muri aka kanya' : 'AI Advisor temporarily unavailable', 'error');
      }
    } finally {
      setIsAiThinking(false);
    }
  };

  // Skeleton Loading Layout
  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Banner Skeleton */}
        <div className="h-44 bg-white rounded-[2rem] border border-[#DFEBE5] p-6 animate-pulse flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-4 w-32 bg-emerald-100 rounded-full" />
            <div className="h-8 w-64 bg-emerald-200/60 rounded-xl" />
            <div className="h-4 w-96 bg-neutral-100 rounded-full" />
          </div>
          <div className="h-8 w-48 bg-neutral-100 rounded-xl" />
        </div>

        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 bg-white rounded-[2rem] border border-[#DFEBE5] p-5 animate-pulse flex flex-col justify-between">
              <div className="h-3 w-24 bg-neutral-100 rounded-full" />
              <div className="flex justify-between items-end">
                <div className="h-8 w-16 bg-neutral-200 rounded-lg" />
                <div className="w-10 h-10 bg-emerald-100 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white rounded-[2rem] border border-[#DFEBE5] p-6 animate-pulse" />
          <div className="h-96 bg-white rounded-[2rem] border border-[#DFEBE5] p-6 animate-pulse" />
        </div>
      </div>
    );
  }

  const doctorFirstName = doctorProfile?.full_name?.split(' ')[0] || 'Doctor';
  const highRiskCount = patients.filter(p => p.self_harm_flag || p.phq9_score >= 15).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-xl font-bold text-xs ${
              toast.type === 'success' ? 'bg-[#08352A] text-white border border-[#21B48D]/40' : 'bg-red-600 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. LUXURY WELCOME BANNER ── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#08352A] via-[#0E4A3B] to-[#145C4B] text-white p-6 sm:p-8 shadow-xl shadow-[#08352A]/10 border border-[#21B48D]/30">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-[#21B48D]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#21B48D]/20 text-[#21B48D] text-xs font-bold tracking-wide border border-[#21B48D]/30">
              <Sparkles size={14} className="animate-spin" style={{ animationDuration: '4s' }} />
              <span>{isRw ? 'Ibiro bya Muganga' : 'Clinical Practice Dashboard'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              {isRw ? `Murakaza neza, Dr. ${doctorFirstName}` : `Welcome back, Dr. ${doctorFirstName}`}
            </h1>
            <p className="text-white/80 text-xs sm:text-sm font-medium max-w-xl">
              {isRw 
                ? 'Reba abarwayi bawe, inama z\'uyu munsi, ndetse n\'ibitabaza byagaragajwe na AI mu buryo bwizewe.' 
                : 'Monitor active caseloads, conduct tele-therapy sessions, and review AI-flagged clinical concerns in real time.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/professional/sessions')}
              className="px-5 py-3 rounded-2xl bg-[#21B48D] hover:bg-[#1CA07C] text-[#08352A] font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#21B48D]/30 hover:shadow-[#21B48D]/50 transition-all flex items-center gap-2 active:scale-95"
            >
              <Video size={16} />
              <span>{isRw ? 'Tangira Ikiganiro' : 'Start Session'}</span>
            </button>
            <button
              onClick={() => navigate('/professional/patients')}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <Users size={16} />
              <span>{isRw ? 'Reba Abarwayi' : 'View Caseload'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Active Patients */}
        <div 
          onClick={() => navigate('/professional/patients')}
          className="group cursor-pointer bg-white p-5 rounded-[2rem] border border-[#DFEBE5] hover:border-[#21B48D]/50 hover:shadow-lg hover:shadow-[#08352A]/5 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              {isRw ? 'Abarwayi Banze' : 'Active Caseload'}
            </span>
            <div className="p-2.5 rounded-2xl bg-[#21B48D]/10 text-[#21B48D] group-hover:bg-[#21B48D] group-hover:text-white transition-all">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#08352A]">{patients.length}</span>
            <span className="text-xs font-bold text-[#21B48D] flex items-center gap-1">
              {highRiskCount > 0 ? `${highRiskCount} ${isRw ? 'bakeneye kwitonderwa' : 'high risk'}` : (isRw ? 'Bose bameze neza' : 'Stable')}
            </span>
          </div>
        </div>

        {/* Card 2: Today's Sessions */}
        <div 
          onClick={() => navigate('/professional/sessions')}
          className="group cursor-pointer bg-white p-5 rounded-[2rem] border border-[#DFEBE5] hover:border-[#21B48D]/50 hover:shadow-lg hover:shadow-[#08352A]/5 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              {isRw ? 'Guhura Uyu Munsi' : 'Scheduled Consults'}
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Calendar size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#08352A]">{sessions.length}</span>
            <span className="text-xs font-bold text-blue-600">
              {sessions.filter(s => s.status === 'confirmed' || s.status === 'active').length} {isRw ? 'byemejwe' : 'confirmed'}
            </span>
          </div>
        </div>

        {/* Card 3: AI Tasks & Crisis Alerts */}
        <div 
          onClick={() => navigate('/professional/alerts')}
          className="group cursor-pointer bg-white p-5 rounded-[2rem] border border-[#DFEBE5] hover:border-red-300 hover:shadow-lg hover:shadow-red-500/5 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              {isRw ? 'Ibitabaza na AI' : 'Alerts & AI Tasks'}
            </span>
            <div className={`p-2.5 rounded-2xl transition-all ${urgentAlerts.length > 0 ? 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white' : 'bg-emerald-50 text-emerald-600'}`}>
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#08352A]">{urgentAlerts.length}</span>
            <span className={`text-xs font-bold ${urgentAlerts.length > 0 ? 'text-red-600 animate-pulse' : 'text-emerald-600'}`}>
              {urgentAlerts.length > 0 ? (isRw ? 'Bikeneye gusuzumwa' : 'Action needed') : (isRw ? 'Nta bitabaza bihari' : 'All clear')}
            </span>
          </div>
        </div>

        {/* Card 4: Caseload Progress */}
        <div 
          onClick={() => navigate('/professional/analytics')}
          className="group cursor-pointer bg-white p-5 rounded-[2rem] border border-[#DFEBE5] hover:border-[#21B48D]/50 hover:shadow-lg hover:shadow-[#08352A]/5 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              {isRw ? 'Ubwiyongere bw\'Ituze' : 'Wellness Index'}
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
              <HeartPulse size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#08352A]">
              {recentMoods.length > 0 ? Math.round(recentMoods.reduce((acc, m) => acc + (m.mood_score || 5), 0) / recentMoods.length * 10) + '%' : '92%'}
            </span>
            <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
              <TrendingUp size={14} /> {isRw ? 'Kuzamuka' : 'Positive Trend'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. MAIN WORKSPACE GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

        {/* LEFT COLUMN: UPCOMING SESSIONS & URGENT CASELOAD (2 COLS) */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">

          {/* Today's Schedule Card */}
          <div className="bg-white rounded-[2rem] border border-[#DFEBE5] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F4F8F6] text-[#08352A] flex items-center justify-center font-bold">
                  <Clock size={20} className="text-[#21B48D]" />
                </div>
                <div>
                  <h2 className="font-extrabold text-lg text-[#08352A]">
                    {isRw ? 'Guhura n\'Abarwayi Bateganijwe' : 'Upcoming Consultations'}
                  </h2>
                  <p className="text-xs text-neutral-400 font-medium">
                    {isRw ? 'Inama z\'uyu munsi n\'ibiganiro bya videwo' : 'Real-time appointment schedule'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/professional/sessions')}
                className="text-xs font-bold text-[#21B48D] hover:underline flex items-center gap-1"
              >
                <span>{isRw ? 'Reba byose' : 'Manage All'}</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="py-12 text-center rounded-2xl bg-[#F4F8F6]/60 border border-dashed border-[#DFEBE5]">
                <Calendar size={36} className="mx-auto text-neutral-300 mb-2" />
                <p className="text-sm font-bold text-[#08352A]">
                  {isRw ? 'Nta biganiro biteganijwe uyu munsi' : 'No consultations scheduled for today'}
                </p>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                  {isRw ? 'Iyo abarwayi bishyizeho gahunda cyangwa ushyizeho gahunda nshya, biragaragara hano.' : 'When a patient books an appointment or you schedule a check-in, it will appear here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 4).map((s) => {
                  const patientName = s.profiles?.full_name || 'Patient';
                  const timeFormatted = s.scheduled_at 
                    ? new Date(s.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : 'Upcoming';

                  return (
                    <div 
                      key={s.id}
                      className="p-4 rounded-2xl bg-[#F4F8F6] hover:bg-white hover:border-[#21B48D]/40 border border-[#DFEBE5] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#08352A] text-white flex items-center justify-center font-extrabold text-sm">
                          {patientName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#08352A]">{patientName}</h4>
                          <p className="text-xs text-neutral-500 font-medium flex items-center gap-2 mt-0.5">
                            <span className="font-semibold text-[#21B48D]">{timeFormatted}</span>
                            <span>•</span>
                            <span className="capitalize">{s.type || 'Tele-therapy'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                          s.status === 'confirmed' || s.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-neutral-200 text-neutral-700'
                        }`}>
                          {s.status}
                        </span>
                        <button
                          onClick={() => navigate('/professional/sessions')}
                          className="px-3.5 py-2 rounded-xl bg-[#08352A] text-white hover:bg-[#21B48D] text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Video size={14} />
                          <span>{isRw ? 'Injira' : 'Join'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Urgent Caseload & AI Tasks Card */}
          <div className="bg-white rounded-[2rem] border border-[#DFEBE5] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h2 className="font-extrabold text-lg text-[#08352A]">
                    {isRw ? 'Ibyihutirwa muri Dosiye' : 'Urgent Caseload & AI Flagged Struggles'}
                  </h2>
                  <p className="text-xs text-neutral-400 font-medium">
                    {isRw ? 'Ibibazo byagaragaye mu biganiro bya AI no kwisuzuma' : 'High-risk indicators requiring supervisor attention'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/professional/alerts')}
                className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
              >
                <span>{isRw ? 'Ibitabaza byose' : 'All Alerts'}</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {urgentAlerts.length === 0 ? (
              <div className="py-8 text-center rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-center gap-3">
                <CheckCircle2 size={24} className="text-[#21B48D]" />
                <p className="text-sm font-bold text-[#08352A]">
                  {isRw ? 'Nta bibazo byihutirwa bihari ubu. Abarwayi bose bameze neza.' : 'No urgent alerts pending. Your caseload is currently stable.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentAlerts.map(alert => {
                  const patientName = alert.profiles?.full_name || 'Anonymous Patient';
                  const isAiFlag = alert.trigger_reason?.includes('AI') || alert.notes?.includes('struggle');

                  return (
                    <div 
                      key={alert.id}
                      className="p-4 rounded-2xl bg-red-50/40 border border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-[#08352A]">{patientName}</span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            {isAiFlag ? (isRw ? 'AI Yabigaragaje' : 'AI Flagged') : 'SOS'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 line-clamp-1 italic">
                          "{alert.trigger_reason || alert.notes || 'Elevated distress reported'}"
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {alert.profiles?.phone && (
                          <a
                            href={`tel:${alert.profiles.phone}`}
                            className="p-2.5 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-all text-xs font-bold"
                            title="Call Patient"
                          >
                            <Phone size={15} />
                          </a>
                        )}
                        <button
                          onClick={() => navigate('/professional/alerts')}
                          className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all"
                        >
                          {isRw ? 'Kemura' : 'Review'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: AI CLINICAL SUPERVISOR & LIVE MOOD FEED */}
        <div className="space-y-6 sm:space-y-8">

          {/* AI Clinical Advisor Card */}
          <div className="bg-white rounded-[2rem] border border-[#DFEBE5] p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#08352A] text-[#21B48D] flex items-center justify-center font-bold shadow-md">
                <Bot size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#08352A]">
                  {isRw ? 'Umujyanama wa Clinical AI' : 'Humura Clinical Advisor'}
                </h3>
                <p className="text-[11px] text-neutral-400 font-medium">
                  {isRw ? 'Ubufasha bwa tekiniki na CBT byihuse' : 'Evidence-based CBT co-pilot'}
                </p>
              </div>
            </div>

            {/* Prompt presets */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                { en: 'Panic attack protocol', rw: 'Umutima utera cyane' },
                { en: 'PHQ-9 > 15 triage', rw: 'Agahinda gakabije' },
                { en: 'CBT grounding steps', rw: 'Kwituza mu mutima' }
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskClinicalAI(isRw ? preset.rw : preset.en)}
                  className="px-2.5 py-1 rounded-lg bg-[#F4F8F6] hover:bg-[#21B48D]/15 text-neutral-600 hover:text-[#08352A] text-[10px] font-bold border border-[#DFEBE5] transition-all"
                >
                  {isRw ? preset.rw : preset.en}
                </button>
              ))}
            </div>

            {/* Response Box */}
            <div className="flex-1 min-h-[160px] max-h-[220px] overflow-y-auto p-3.5 rounded-2xl bg-[#F4F8F6] border border-[#DFEBE5] text-xs text-[#08352A] leading-relaxed mb-3">
              {isAiThinking ? (
                <div className="flex items-center justify-center h-full gap-2 text-neutral-400 font-bold">
                  <Loader2 size={16} className="animate-spin text-[#21B48D]" />
                  <span>{isRw ? 'AI iratekereza...' : 'Analyzing clinical guidance...'}</span>
                </div>
              ) : aiResponse ? (
                <div className="space-y-2 whitespace-pre-line">
                  <span className="inline-block px-2 py-0.5 bg-[#21B48D]/20 text-[#08352A] font-extrabold rounded text-[9px] uppercase">
                    CBT Guideline
                  </span>
                  <p>{aiResponse}</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 p-2">
                  <Sparkles size={24} className="text-[#21B48D] mb-1" />
                  <p className="font-bold text-[11px] text-neutral-500">
                    {isRw ? 'Baza ikibazo cy\'ubuvuzi hano' : 'Ask any clinical consultation question'}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {isRw ? 'Reba uburyo bwiza bwo gufasha umurwayi' : 'CBT interventions, triage criteria & Rwandan cultural contexts.'}
                  </p>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleAskClinicalAI(); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder={isRw ? 'Andika ikibazo cy\'ubuvuzi...' : 'Clinical question...'}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F4F8F6] border border-[#DFEBE5] focus:border-[#21B48D] focus:outline-hidden text-xs text-[#08352A] placeholder-neutral-400"
              />
              <button
                type="submit"
                disabled={isAiThinking || !aiQuestion.trim()}
                className="p-2.5 rounded-xl bg-[#08352A] hover:bg-[#21B48D] text-white disabled:opacity-40 transition-all cursor-pointer"
              >
                <Send size={15} />
              </button>
            </form>
          </div>

          {/* Recent Mood Logs Card */}
          <div className="bg-white rounded-[2rem] border border-[#DFEBE5] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-base text-[#08352A]">
                {isRw ? 'Imiterere y\'Abarwayi' : 'Caseload Mood Stream'}
              </h3>
              <button
                onClick={() => navigate('/professional/analytics')}
                className="text-xs font-bold text-[#21B48D] hover:underline"
              >
                {isRw ? 'Isesengura' : 'Analytics'}
              </button>
            </div>

            {recentMoods.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-6">
                {isRw ? 'Nta bipimo by\'umunsi birandikwa' : 'No mood logs submitted recently'}
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentMoods.slice(0, 4).map(m => (
                  <div 
                    key={m.id}
                    className="p-3 rounded-xl bg-[#F4F8F6] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{m.emoji || '🌱'}</span>
                      <div>
                        <p className="font-bold text-[#08352A]">{m.profiles?.full_name || 'Patient'}</p>
                        <p className="text-[10px] text-neutral-400">
                          {m.logged_at ? new Date(m.logged_at).toLocaleDateString() : 'Today'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                      (m.mood_score || 5) >= 7 ? 'bg-emerald-100 text-emerald-700' :
                      (m.mood_score || 5) >= 4 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {m.mood_score || 5}/10
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
