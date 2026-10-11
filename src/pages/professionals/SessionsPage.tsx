import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Video, Clock, CheckCircle2, XCircle, AlertCircle, 
  Plus, Users, Search, Phone, ChevronRight, X, Loader2, Sparkles,
  Play, Check, MessageSquare
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function SessionsPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRw = i18n.language?.startsWith('rw');
  const outletCtx = useOutletContext<{ doctorProfile?: any; isAvailable?: boolean; refreshCounters?: () => void }>() || {};

  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [caseload, setCaseload] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'active' | 'completed'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New Session Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [sessionType, setSessionType] = useState('Video Tele-Therapy');
  const [sessionNotes, setSessionNotes] = useState('');
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setDoctorId(user.id);

      // 1. Fetch Sessions
      const { data: sessionData, error } = await supabase
        .from('sessions')
        .select(`
          *,
          patient:profiles!patient_id(id, full_name, phone, avatar_url)
        `)
        .eq('doctor_id', user.id)
        .order('scheduled_at', { ascending: false });

      if (error) {
        // Fallback simple fetch
        const { data: fallbackData } = await supabase
          .from('sessions')
          .select('*')
          .eq('doctor_id', user.id)
          .order('scheduled_at', { ascending: false });
        setSessions(fallbackData || []);
      } else {
        setSessions(sessionData || []);
      }

      // 2. Fetch Active Caseload for Booking dropdown
      const { data: caseloadData } = await supabase
        .from('patient_caseload')
        .select(`
          patient_id,
          patient:profiles!patient_id(id, full_name)
        `)
        .eq('doctor_id', user.id)
        .eq('status', 'active');

      const formattedCaseload = (caseloadData || []).map((c: any) => ({
        id: c.patient_id,
        name: (Array.isArray(c.patient) ? c.patient[0]?.full_name : c.patient?.full_name) || 'Patient'
      }));
      setCaseload(formattedCaseload);
    } catch (err: any) {
      console.error(err);
      showToast(isRw ? 'Gushaka gahunda byanze' : 'Failed to load sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Start Video Room
  const handleStartVideo = async (sessionId: string, patientName: string) => {
    setActionLoading('video-' + sessionId);
    try {
      const baseUrl = (import.meta.env.VITE_RENDER_BACKEND_URL || 'https://humura-ai-1.onrender.com').replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/sessions/${sessionId}/start-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorName: outletCtx.doctorProfile?.full_name || 'Clinician' })
      });

      if (!response.ok) {
        // Direct database activation fallback
        const videoRoomUrl = `https://meet.jit.si/humura-${sessionId.substring(0, 8)}`;
        await supabase
          .from('sessions')
          .update({
            status: 'active',
            started_at: new Date().toISOString(),
            video_room_url: videoRoomUrl
          })
          .eq('id', sessionId);
      }

      showToast(isRw ? `Icyumba cya videwo gifunguwe na ${patientName}` : `Video room launched for ${patientName}`, 'success');
      fetchSessions();
      if (outletCtx.refreshCounters) outletCtx.refreshCounters();
    } catch (err: any) {
      showToast(err.message || 'Error launching video session', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Mark Completed or Missed
  const handleUpdateStatus = async (sessionId: string, status: 'completed' | 'missed' | 'active') => {
    setActionLoading(sessionId);
    try {
      const updateData: any = { status };
      if (status === 'active') updateData.started_at = new Date().toISOString();
      if (status === 'completed') updateData.ended_at = new Date().toISOString();

      await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId);

      showToast(
        status === 'completed'
          ? (isRw ? 'Ikiganiro cyarangiye neza' : 'Session marked as completed')
          : (isRw ? 'Gahunda yavuguruwe' : 'Session updated')
      );
      fetchSessions();
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Schedule New Session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !selectedPatientId || !scheduledDateTime) {
      showToast(isRw ? 'Uzuza ibisabwa byose' : 'Please provide all details', 'error');
      return;
    }

    setIsSubmittingSession(true);
    try {
      const { error } = await supabase
        .from('sessions')
        .insert({
          doctor_id: doctorId,
          patient_id: selectedPatientId,
          scheduled_at: new Date(scheduledDateTime).toISOString(),
          status: 'scheduled',
          type: sessionType,
          notes: sessionNotes
        });

      if (error) throw error;

      showToast(isRw ? 'Gahunda yashyizweho neza' : 'Consultation successfully scheduled', 'success');
      setShowScheduleModal(false);
      setSelectedPatientId('');
      setScheduledDateTime('');
      setSessionNotes('');
      fetchSessions();
    } catch (err: any) {
      showToast(err.message || 'Failed to schedule', 'error');
    } finally {
      setIsSubmittingSession(false);
    }
  };

  // Filtered Sessions
  const filteredSessions = sessions.filter(s => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'scheduled') return s.status === 'scheduled' || s.status === 'confirmed';
    if (statusFilter === 'active') return s.status === 'active' || s.status === 'in_progress';
    if (statusFilter === 'completed') return s.status === 'completed';
    return true;
  });

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="h-16 bg-white rounded-2xl border border-[#DFEBE5] animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 bg-white rounded-[2rem] border border-[#DFEBE5] p-6 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

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

      {/* ── HEADER & SCHEDULE BUTTON ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08352A] tracking-tight">
            {isRw ? 'Guhura n\'Abarwayi (Tele-Sessions)' : 'Clinical Consultations'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1">
            {isRw ? 'Genzura ibiganiro bya videwo n\'inama ziteganijwe' : 'Manage live tele-health consultations, schedules, and clinical video links'}
          </p>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="px-5 py-3 rounded-2xl bg-[#08352A] hover:bg-[#21B48D] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#08352A]/10 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Plus size={16} />
          <span>{isRw ? 'Tegura Gahunda Nshya' : 'Schedule Consultation'}</span>
        </button>
      </div>

      {/* ── FILTER TABS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', en: 'All Consults', rw: 'Byose' },
          { id: 'scheduled', en: 'Upcoming & Scheduled', rw: 'Biteganijwe' },
          { id: 'active', en: 'In-Progress / Live', rw: 'Birimo Kuba' },
          { id: 'completed', en: 'Completed', rw: 'Byarangiye' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-[#08352A] text-white shadow-md shadow-[#08352A]/10'
                : 'bg-white text-neutral-600 hover:bg-[#F4F8F6] border border-[#DFEBE5]'
            }`}
          >
            {isRw ? tab.rw : tab.en}
          </button>
        ))}
      </div>

      {/* ── SESSIONS LIST ── */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-[#DFEBE5] p-12 text-center">
          <Calendar size={48} className="mx-auto text-neutral-300 mb-3" />
          <h3 className="font-extrabold text-base text-[#08352A]">
            {isRw ? 'Nta gahunda zihari muri iki cyiciro' : 'No consultations found in this category'}
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            {isRw ? 'Kanda "Tegura Gahunda Nshya" kugira ngo ushyireho igihe cyo kuvugana n\'umurwayi.' : 'Click "Schedule Consultation" to book a tele-therapy or CBT session with a patient.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const patientName = session.patient?.full_name || 'Patient';
            const scheduledDate = session.scheduled_at ? new Date(session.scheduled_at) : null;
            const isToday = scheduledDate && new Date().toDateString() === scheduledDate.toDateString();
            const timeStr = scheduledDate ? scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Flexible';
            const dateStr = scheduledDate ? scheduledDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending';

            const isLive = session.status === 'active' || session.status === 'in_progress';
            const isCompleted = session.status === 'completed';

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-[2rem] border transition-all p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                  isLive ? 'border-[#21B48D] ring-2 ring-[#21B48D]/20 shadow-lg' : 'border-[#DFEBE5] hover:border-[#21B48D]/40'
                }`}
              >
                {/* Left: Patient and Details */}
                <div className="flex items-start sm:items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-lg shrink-0 ${
                    isLive ? 'bg-[#21B48D] text-white animate-pulse' : 'bg-[#08352A] text-white'
                  }`}>
                    {patientName.charAt(0)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-base text-[#08352A]">{patientName}</h3>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        isLive ? 'bg-red-100 text-red-700 animate-pulse' :
                        isCompleted ? 'bg-emerald-100 text-emerald-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {session.status}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {isRw ? 'Uyu Munsi' : 'Today'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-500 font-medium flex-wrap">
                      <span className="font-bold text-[#08352A] flex items-center gap-1">
                        <Clock size={13} className="text-[#21B48D]" />
                        {dateStr} • {timeStr}
                      </span>
                      <span>•</span>
                      <span>{session.type || 'Tele-Therapy'}</span>
                      {session.patient?.phone && (
                        <>
                          <span>•</span>
                          <a href={`tel:${session.patient.phone}`} className="hover:underline flex items-center gap-1 text-neutral-400">
                            <Phone size={12} /> {session.patient.phone}
                          </a>
                        </>
                      )}
                    </div>

                    {session.notes && (
                      <p className="text-xs text-neutral-400 italic line-clamp-1 mt-1">
                        "{session.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2.5 self-end md:self-center flex-wrap">
                  {!isCompleted && (
                    <button
                      onClick={() => handleStartVideo(session.id, patientName)}
                      disabled={actionLoading === 'video-' + session.id}
                      className="px-4 py-2.5 rounded-xl bg-[#21B48D] hover:bg-[#1CA07C] text-[#08352A] font-bold text-xs uppercase tracking-wider shadow-md shadow-[#21B48D]/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Video size={15} />
                      <span>{actionLoading === 'video-' + session.id ? 'Connecting...' : (isLive ? (isRw ? 'Subira mu Kiganiro' : 'Resume Video') : (isRw ? 'Fungura Videwo' : 'Launch Video'))}</span>
                    </button>
                  )}

                  {!isCompleted ? (
                    <button
                      onClick={() => handleUpdateStatus(session.id, 'completed')}
                      disabled={actionLoading === session.id}
                      className="px-3.5 py-2.5 rounded-xl bg-[#F4F8F6] hover:bg-emerald-50 text-emerald-700 font-bold text-xs border border-[#DFEBE5] transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={14} />
                      <span>{isRw ? 'Kurangiza' : 'Complete'}</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-2 rounded-xl">
                      <CheckCircle2 size={16} />
                      <span>{isRw ? 'Byarangiye' : 'Concluded'}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleUpdateStatus(session.id, 'missed')}
                    className="p-2.5 rounded-xl bg-[#F4F8F6] hover:bg-neutral-100 text-neutral-400 hover:text-red-600 transition-all"
                    title={isRw ? 'Marika nkabatarabonetse' : 'Mark as Missed'}
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── SCHEDULE NEW APPOINTMENT MODAL ── */}
      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowScheduleModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-6 sm:p-8 z-10 shadow-2xl border border-[#DFEBE5] space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-[#08352A]">
                    {isRw ? 'Tegura Gahunda yo Guhura' : 'Schedule Clinical Session'}
                  </h3>
                  <p className="text-xs text-neutral-400 font-medium mt-0.5">
                    {isRw ? 'Hitamo umurwayi n\'igihe cyo kumusuzuma' : 'Set up a tele-consultation or clinical check-in'}
                  </p>
                </div>
                <button onClick={() => setShowScheduleModal(false)} className="p-2 text-neutral-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateSession} className="space-y-4">
                {/* Select Patient */}
                <div>
                  <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1.5">
                    {isRw ? 'Hitamo Umurwayi' : 'Select Patient from Caseload'}
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#F4F8F6] border border-[#DFEBE5] text-xs text-[#08352A] font-bold focus:border-[#21B48D] focus:outline-hidden"
                  >
                    <option value="">{isRw ? '-- Hitamo umurwayi --' : '-- Choose a patient --'}</option>
                    {caseload.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Date & Time */}
                <div>
                  <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1.5">
                    {isRw ? 'Umunsi n\'Isaha' : 'Date & Time'}
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#F4F8F6] border border-[#DFEBE5] text-xs text-[#08352A] font-bold focus:border-[#21B48D] focus:outline-hidden"
                  />
                </div>

                {/* Session Type */}
                <div>
                  <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1.5">
                    {isRw ? 'Ubwoko bw\'Ikiganiro' : 'Consultation Type'}
                  </label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#F4F8F6] border border-[#DFEBE5] text-xs text-[#08352A] font-bold focus:border-[#21B48D] focus:outline-hidden"
                  >
                    <option value="Video Tele-Therapy">Video Tele-Therapy</option>
                    <option value="CBT Check-in">Cognitive Behavioral (CBT) Check-in</option>
                    <option value="Crisis Follow-up">Crisis Intervention Follow-up</option>
                    <option value="Prescription / Intake">Clinical Intake Assessment</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1.5">
                    {isRw ? 'Ibisobanuro by\'inyongera' : 'Session Objectives / Notes'}
                  </label>
                  <textarea
                    rows={3}
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder={isRw ? 'Intego y\'iki kiganiro...' : 'Session focus, therapeutic goals...'}
                    className="w-full px-4 py-3 rounded-xl bg-[#F4F8F6] border border-[#DFEBE5] text-xs text-[#08352A] placeholder-neutral-400 focus:border-[#21B48D] focus:outline-hidden"
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 py-3 rounded-xl bg-[#F4F8F6] text-neutral-600 font-bold text-xs uppercase"
                  >
                    {isRw ? 'Kureka' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSession}
                    className="flex-1 py-3 rounded-xl bg-[#08352A] hover:bg-[#21B48D] text-white font-bold text-xs uppercase transition-all disabled:opacity-50"
                  >
                    {isSubmittingSession ? 'Scheduling...' : isRw ? 'Emeza Gahunda' : 'Confirm Booking'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
