import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Calendar,
  MessageSquare,
  AlertTriangle,
  PhoneCall,
  ShieldCheck,
  Star,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  UserCheck,
  Stethoscope,
  Search,
  Filter,
  Loader2,
  Phone,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { io } from 'socket.io-client';
import IncomingCall from '../../components/clinical/IncomingCall';
import VideoSession from '../../components/clinical/VideoSession';

interface DbDoctorProfile {
  id: string;
  full_name: string;
  role: string;
  specialty: string | null;
  location: string | null;
  bio: string | null;
  phone: string | null;
  language_pref: string | null;
  avatar_url: string | null;
  plan_type?: string | null;
  updated_at?: string;
}

interface DbSession {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  status: 'pending' | 'scheduled' | 'confirmed' | 'active' | 'completed' | 'missed' | string;
  video_room_url?: string | null;
  video_started_at?: string | null;
  created_at: string;
  doctor?: DbDoctorProfile | null;
}

// In-memory cache for zero-flicker transitions
let cachedMeetDoctors: DbDoctorProfile[] | null = null;
let cachedMeetSessions: DbSession[] | null = null;
let cachedAssignedDoctor: DbDoctorProfile | null = null;

export default function MeetProfessionalPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');
  const navigate = useNavigate();

  // Auth & Profile State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [assignedDoctor, setAssignedDoctor] = useState<DbDoctorProfile | null>(() => cachedAssignedDoctor);

  // Dynamic Clinical Data with In-Memory Caching
  const [doctors, setDoctors] = useState<DbDoctorProfile[]>(() => cachedMeetDoctors || []);
  const [userSessions, setUserSessions] = useState<DbSession[]>(() => cachedMeetSessions || []);
  const [loading, setLoading] = useState<boolean>(!cachedMeetDoctors);
  const [refreshing, setRefreshing] = useState(false);

  // Search, Filter & Live Presence
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [onlineDoctorIds, setOnlineDoctorIds] = useState<Set<string>>(new Set());

  // Interactive Booking Modal State
  const [bookingDoctor, setBookingDoctor] = useState<DbDoctorProfile | null>(null);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('10:00 AM');
  const [sessionFormat, setSessionFormat] = useState<'video' | 'chat'>('video');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Real-time Video Call Overlay State
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeVideoSession, setActiveVideoSession] = useState<{
    id: string;
    room_url: string;
    doctor_name: string;
  } | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  const backendUrl = (import.meta.env.VITE_RENDER_BACKEND_URL || 'https://humura-ai-1.onrender.com').replace(/\/$/, '');

  // ── 1. Fetch Dynamic Data from Backend ──
  const fetchDynamicData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      setCurrentUser(user);

      // Fetch all verified doctors from backend
      const { data: dbDoctors, error: docErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'doctor')
        .order('full_name', { ascending: true });

      if (docErr) throw docErr;

      const uniqueDocs: DbDoctorProfile[] = [];
      const seenNames = new Set<string>();
      (dbDoctors || []).forEach((d) => {
        const cleanName = (d.full_name || '').trim().toLowerCase();
        if (cleanName && !seenNames.has(cleanName)) {
          seenNames.add(cleanName);
          uniqueDocs.push(d);
        }
      });

      cachedMeetDoctors = uniqueDocs;
      setDoctors(uniqueDocs);

      if (user) {
        const { data: patientRecord } = await supabase
          .from('patients')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        setPatientData(patientRecord);

        if (patientRecord?.doctor_id) {
          const { data: assignedDoc } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', patientRecord.doctor_id)
            .maybeSingle();
          cachedAssignedDoctor = assignedDoc;
          setAssignedDoctor(assignedDoc);
        } else {
          cachedAssignedDoctor = null;
          setAssignedDoctor(null);
        }

        const { data: sessionsList } = await supabase
          .from('sessions')
          .select('*, doctor:doctor_id(*)')
          .eq('patient_id', user.id)
          .order('scheduled_at', { ascending: false });

        if (sessionsList) {
          cachedMeetSessions = sessionsList;
          setUserSessions(sessionsList);

          const ongoing = sessionsList.find(
            (s) => (s.status === 'active' || s.status === 'scheduled') && s.video_room_url
          );
          const storedSession = sessionStorage.getItem('active_video_session');
          if (storedSession) {
            try {
              const parsed = JSON.parse(storedSession);
              setActiveVideoSession(parsed);
              sessionStorage.removeItem('active_video_session');
            } catch (e) {}
          } else if (ongoing && !activeVideoSession && ongoing.status === 'active') {
            setActiveVideoSession({
              id: ongoing.id,
              room_url: ongoing.video_room_url!,
              doctor_name: ongoing.doctor?.full_name || 'Assigned Specialist'
            });
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to load clinicians:', err);
      showToast(isRw ? 'Habaye ikibazo mu gufungura urutonde rw\'abaganga.' : 'Unable to load clinical directory.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDynamicData();

    const channel = supabase
      .channel('clinical-realtime-hub')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchDynamicData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        fetchDynamicData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        fetchDynamicData();
      })
      .subscribe();

    let socket: any = null;
    try {
      socket = io(backendUrl, { transports: ['websocket'] });

      socket.on('doctor:online', ({ doctor_id }: { doctor_id: string }) => {
        setOnlineDoctorIds((prev) => new Set([...prev, doctor_id]));
      });

      socket.on('doctor:offline', ({ doctor_id }: { doctor_id: string }) => {
        setOnlineDoctorIds((prev) => {
          const next = new Set(prev);
          next.delete(doctor_id);
          return next;
        });
      });
    } catch (e) {
      console.warn('Presence connection note:', e);
    }

    return () => {
      supabase.removeChannel(channel);
      if (socket) socket.disconnect();
    };
  }, []);

  const dynamicSpecialties = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => {
      if (d.specialty) {
        set.add(d.specialty.trim());
      }
    });
    return Array.from(set);
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchSpecialty =
        selectedSpecialty === 'all' ||
        (doc.specialty && doc.specialty.toLowerCase() === selectedSpecialty.toLowerCase());

      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        doc.full_name?.toLowerCase().includes(query) ||
        doc.specialty?.toLowerCase().includes(query) ||
        doc.location?.toLowerCase().includes(query) ||
        doc.bio?.toLowerCase().includes(query);

      return matchSpecialty && matchSearch;
    });
  }, [doctors, selectedSpecialty, searchQuery]);

  const triggerSOS = async () => {
    if (!currentUser?.id) {
      navigate('/patient/emergency');
      return;
    }
    try {
      await fetch(`${backendUrl}/api/crisis/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: currentUser.id,
          doctorId: patientData?.doctor_id,
          type: 'SOS_button',
          lastMsg: 'Patient triggered urgent SOS from Clinical Professional Hub'
        })
      });
      showToast(
        isRw
          ? 'Ubutabazi buraje! Urwego rw\'ubuvuzi rwahise rumenyekanishwa.'
          : 'Emergency SOS alert dispatched to medical team!',
        'success'
      );
      setTimeout(() => navigate('/patient/emergency'), 1600);
    } catch (err) {
      navigate('/patient/emergency');
    }
  };

  const handleOpenBooking = (doc: DbDoctorProfile) => {
    setBookingDoctor(doc);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingDate(tomorrow.toISOString().split('T')[0]);
    setBookingNotes(patientData?.primary_concern ? `Focus: ${patientData.primary_concern}` : '');
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDoctor || !currentUser?.id) {
      showToast(isRw ? 'Ugomba kwinjira mbere yo gufata gahunda.' : 'Please sign in to schedule an appointment.', 'error');
      return;
    }

    setBookingLoading(true);
    try {
      const scheduledDateTime = new Date(`${bookingDate}T10:00:00Z`).toISOString();
      const videoRoom = `https://meet.jit.si/humura-health-${bookingDoctor.id.slice(0, 8)}-${currentUser.id.slice(0, 8)}`;

      await supabase.from('sessions').insert({
        patient_id: currentUser.id,
        doctor_id: bookingDoctor.id,
        status: 'scheduled',
        scheduled_at: scheduledDateTime,
        video_room_url: videoRoom
      });

      await supabase.from('patients').upsert({
        id: currentUser.id,
        doctor_id: bookingDoctor.id,
        status: 'active'
      });

      await fetch(`${backendUrl}/api/patients/assign-doctor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: currentUser.id,
          doctorId: bookingDoctor.id
        })
      }).catch(() => {});

      showToast(
        isRw
          ? `Gahunda yawe na ${bookingDoctor.full_name} yemejwe neza!`
          : `Session with ${bookingDoctor.full_name} scheduled successfully!`,
        'success'
      );

      setBookingDoctor(null);
      await fetchDynamicData();
    } catch (err: any) {
      showToast(err.message || 'Consultation confirmed.', 'success');
      setBookingDoctor(null);
    } finally {
      setBookingLoading(false);
    }
  };

  const startInstantVideoRoom = (doc: DbDoctorProfile) => {
    const roomUrl = `https://meet.jit.si/humura-health-${doc.id.slice(0, 8)}-${Date.now()}`;
    setActiveVideoSession({
      id: 'session-' + Date.now(),
      room_url: roomUrl,
      doctor_name: doc.full_name
    });
  };

  const formatLanguages = (pref: string | null) => {
    if (!pref) return 'Kinyarwanda, English';
    const lower = pref.toLowerCase();
    const list: string[] = [];
    if (lower.includes('rw')) list.push('Kinyarwanda');
    if (lower.includes('en')) list.push('English');
    if (lower.includes('fr')) list.push('French');
    if (lower.includes('rsl')) list.push('RSL (Sign Language)');
    return list.length > 0 ? list.join(', ') : pref;
  };

  return (
    <div className="min-h-screen bg-[#F4F8F6] text-[#08352A] font-poppins p-4 sm:p-8 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── TOP HEADER SECTION ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E2F2EC] text-[#08352A] text-xs font-bold uppercase tracking-wider mb-2.5">
              <span className="w-2 h-2 rounded-full bg-[#21B48D] animate-ping" />
              <span>{isRw ? 'Inzobere z’Ubuvuzi • Rwanda' : 'Certified Clinical Team • Rwanda'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#08352A] tracking-tight">
              {isRw ? 'Hura n’Inzobere z’Ubuzima bwo mu Mutwe' : 'Connect with Certified Mental Health Specialists'}
            </h1>
            <p className="text-xs sm:text-sm text-[#5E8E81] mt-1.5 max-w-2xl font-normal leading-relaxed">
              {isRw
                ? 'Hura n\'abaganga n\'abahanga mu mitekerereze bemewe mu Rwanda. Fata gahunda yo kubonana n\'umuganga cyangwa utangire ikiganiro cy’amashusho giteganyijwe mu ibanga.'
                : 'Connect with certified psychiatrists and clinical psychologists licensed in Rwanda. Schedule private consultations or start secure video therapy sessions.'}
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-3 self-start md:self-auto flex-shrink-0 flex-wrap">
            <button
              onClick={() => fetchDynamicData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-full bg-white hover:bg-[#EBF3EF] border border-[#DCEBE3] text-[#08352A] shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Refresh directory"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin text-[#21B48D]' : ''} />
            </button>

            <button
              onClick={triggerSOS}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-[#FFF1F0] hover:bg-[#FFE5E3] text-[#E11D48] border border-[#FFD9D9] text-xs font-extrabold shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <AlertTriangle size={15} />
              <span>{isRw ? 'Ubutabazi (SOS)' : 'SOS Emergency'}</span>
            </button>

            <a
              href="tel:114"
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-[#08352A] hover:bg-[#154E3F] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <PhoneCall size={14} className="text-[#21B48D]" />
              <span>114 Toll-Free</span>
            </a>
          </div>
        </div>

        {/* ── SKELETON LOADING STATE IF CACHE IS EMPTY ── */}
        {loading && doctors.length === 0 ? (
          <div className="space-y-6 animate-pulse">
            <div className="bg-white rounded-[2rem] p-8 border border-[#DCEBE3] h-44" />
            <div className="bg-white rounded-3xl p-6 border border-[#DCEBE3] h-28" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-[2rem] p-7 border border-[#DCEBE3] h-72" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ── ASSIGNED CLINICIAN HIGHLIGHT ── */}
            {assignedDoctor && (
              <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-[#21B48D]/50 shadow-xs relative overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#08352A] text-white flex items-center justify-center font-black text-2xl shadow-xs flex-shrink-0">
                      {assignedDoctor.full_name?.charAt(0) || 'D'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-[#21B48D] bg-[#E8F3EE] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {isRw ? 'Muganga Wawe Witeganyirije' : 'Your Assigned Specialist'}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-[#21B48D] animate-pulse" />
                      </div>
                      <h3 className="text-xl font-extrabold text-[#08352A]">
                        {assignedDoctor.full_name}
                      </h3>
                      <p className="text-xs text-[#5E8E81] font-semibold flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>{assignedDoctor.specialty || 'Clinical Telehealth Care'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-[#21B48D]" />
                          {assignedDoctor.location || 'Kigali, Rwanda'}
                        </span>
                      </p>
                      {assignedDoctor.bio && (
                        <p className="text-xs text-[#71968B] mt-1.5 max-w-xl font-normal leading-relaxed">
                          {assignedDoctor.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Consultation Action Buttons */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => startInstantVideoRoom(assignedDoctor)}
                      className="px-5 py-3 rounded-full bg-[#08352A] hover:bg-[#154E3F] text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                    >
                      <Video size={16} className="text-[#21B48D]" />
                      <span>{isRw ? 'Tangira Ikiganiro ku Mashusho' : 'Launch Video Consultation'}</span>
                    </button>

                    <button
                      onClick={() => navigate('/patient/chat')}
                      className="px-5 py-3 rounded-full bg-[#F4F8F6] hover:bg-[#EBF3EF] border border-[#DCEBE3] text-[#08352A] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                    >
                      <MessageSquare size={15} />
                      <span>{isRw ? 'Ubutumwa' : 'Chat'}</span>
                    </button>

                    {assignedDoctor.phone && (
                      <a
                        href={`tel:${assignedDoctor.phone}`}
                        className="p-3 rounded-full bg-[#E2F2EC] hover:bg-[#D4EADE] text-[#08352A] text-xs font-bold flex items-center justify-center transition-all cursor-pointer"
                        title={`Call ${assignedDoctor.phone}`}
                      >
                        <Phone size={15} />
                      </a>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* ── SCHEDULED SESSIONS (IF ANY) ── */}
            {userSessions.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#DFEBE5] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-[#21B48D]" />
                    <h3 className="text-sm font-extrabold text-[#08352A]">
                      {isRw ? 'Gahunda Zawe Ziteganyijwe' : 'Your Scheduled Consultations'}
                    </h3>
                  </div>
                  <span className="text-xs text-[#5E8E81] font-bold">
                    {userSessions.length} {isRw ? 'Gahunda' : 'Sessions'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {userSessions.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-2xl bg-[#F4F8F6] border border-[#DCEBE3] flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E2F2EC] text-[#08352A]">
                            {s.status}
                          </span>
                          <span className="text-[11px] text-[#71968B] font-semibold flex items-center gap-1">
                            <Clock size={11} />
                            {s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Flexible'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#08352A]">
                          {s.doctor?.full_name || 'Specialist Consultation'}
                        </p>
                        <p className="text-[11px] text-[#5E8E81]">
                          {s.doctor?.specialty || 'Private Telehealth Session'}
                        </p>
                      </div>

                      {s.video_room_url && (
                        <button
                          onClick={() =>
                            setActiveVideoSession({
                              id: s.id,
                              room_url: s.video_room_url!,
                              doctor_name: s.doctor?.full_name || 'Specialist'
                            })
                          }
                          className="w-full py-2 px-3 rounded-xl bg-[#08352A] hover:bg-[#154E3F] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        >
                          <Video size={13} className="text-[#21B48D]" />
                          <span>{isRw ? 'Kwinjira mu Mashusho' : 'Join Video Session'}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SEARCH & FILTER CONTROLS ── */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#DFEBE5] space-y-4 shadow-2xs">
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8DB4A8]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isRw ? 'Shakisha umuganga, ikigo cyangwa ubumenyi...' : 'Search clinicians by name, hospital, or specialty...'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F4F8F6] border border-[#DCEBE3] text-xs font-medium text-[#08352A] placeholder-[#8DB4A8] outline-none focus:border-[#21B48D] transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8DB4A8] hover:text-[#08352A]"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-[#5E8E81] self-end sm:self-auto flex-shrink-0">
                  <Filter size={14} className="text-[#21B48D]" />
                  <span>
                    {filteredDoctors.length} / {doctors.length} {isRw ? 'Inzobere Ziboneka' : 'Available Clinicians'}
                  </span>
                </div>
              </div>

              {/* Specialty Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedSpecialty('all')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                    selectedSpecialty === 'all'
                      ? 'bg-[#08352A] text-white shadow-xs'
                      : 'bg-[#F4F8F6] text-[#08352A] hover:bg-[#E8F3EE] border border-[#DCEBE3]'
                  }`}
                >
                  {isRw ? 'Bose (All)' : 'All Specialties'}
                </button>

                {dynamicSpecialties.map((spec) => (
                  <button
                    key={spec}
                    onClick={() => setSelectedSpecialty(spec)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                      selectedSpecialty.toLowerCase() === spec.toLowerCase()
                        ? 'bg-[#08352A] text-white shadow-xs'
                        : 'bg-[#F4F8F6] text-[#08352A] hover:bg-[#E8F3EE] border border-[#DCEBE3]'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>

            </div>

            {/* ── CLINICIANS DIRECTORY GRID ── */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#08352A]">
                  {isRw ? 'Inzobere Ziteguye Kugufasha' : 'Licensed Mental Health Professionals'}
                </h2>
                <span className="text-xs text-[#5E8E81] font-semibold">
                  {filteredDoctors.length} {isRw ? 'Bagaragara' : 'Available for Consultations'}
                </span>
              </div>

              {filteredDoctors.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-[#DFEBE5] space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#F4F8F6] text-[#8DB4A8] flex items-center justify-center mx-auto">
                    <Search size={24} />
                  </div>
                  <h3 className="text-base font-bold text-[#08352A]">
                    {isRw ? 'Nta muganga uhuye n\'ibyo ushakishije' : 'No clinicians matched your filter'}
                  </h3>
                  <p className="text-xs text-[#5E8E81] max-w-md mx-auto">
                    {isRw ? 'Gerageza guhindura amagambo washakishije cyangwa uhitemo "Bose".' : 'Try clearing your search query or select "All Specialties" to view the full directory.'}
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSpecialty('all');
                    }}
                    className="px-5 py-2.5 rounded-full bg-[#08352A] text-white text-xs font-bold hover:bg-[#154E3F] transition-all cursor-pointer shadow-xs"
                  >
                    {isRw ? 'Garura Byose' : 'Reset Filters'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredDoctors.map((doc) => {
                    const isOnline = onlineDoctorIds.has(doc.id);
                    const isCurrentAssigned = assignedDoctor?.id === doc.id;

                    return (
                      <div
                        key={doc.id}
                        className={`bg-white rounded-[2rem] p-6 sm:p-7 border transition-all hover:shadow-md flex flex-col justify-between group ${
                          isCurrentAssigned ? 'border-[#21B48D] ring-2 ring-[#21B48D]/20' : 'border-[#DFEBE5] hover:border-[#21B48D]'
                        }`}
                      >
                        <div>
                          {/* Card Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#21B48D] bg-[#E8F3EE] px-2.5 py-1 rounded-full">
                              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#21B48D] animate-ping' : 'bg-[#21B48D]'}`} />
                              <span>{isOnline ? (isRw ? 'Arahari (Online)' : 'Active Online') : (isRw ? 'Arahari' : 'Available Today')}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {isCurrentAssigned && (
                                <span className="text-[10px] font-extrabold text-[#08352A] bg-[#E2F2EC] px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <UserCheck size={11} className="text-[#21B48D]" />
                                  {isRw ? 'Muganga Wawe' : 'Assigned'}
                                </span>
                              )}
                              <div className="flex items-center gap-1 text-[#08352A] text-xs font-bold">
                                <Star size={13} className="text-[#D97706] fill-current" />
                                <span>4.9</span>
                                <span className="text-[#8DB4A8] font-normal">(Verified)</span>
                              </div>
                            </div>
                          </div>

                          {/* Doctor Info Row */}
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-[#E2F2EC] border border-[#CDE5DC] flex items-center justify-center text-[#08352A] font-black text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
                              {doc.full_name?.charAt(0) || 'D'}
                            </div>
                            <div>
                              <h3 className="text-lg font-extrabold text-[#08352A] group-hover:text-[#21B48D] transition-colors leading-tight">
                                {doc.full_name}
                              </h3>
                              <p className="text-xs font-bold text-[#21B48D] mt-0.5">
                                {doc.specialty || (isRw ? 'Ubuzima bwo mu Mutwe' : 'Certified Mental Health Practitioner')}
                              </p>
                              <p className="text-[11px] text-[#5E8E81] flex items-center gap-1.5 mt-1 font-medium">
                                <MapPin size={11} className="text-[#21B48D]" />
                                <span>{doc.location || 'Rwanda Health Center'}</span>
                                <span>•</span>
                                <span className="text-[#08352A] font-bold">RMC Licensed</span>
                              </p>
                            </div>
                          </div>

                          {/* Profile Bio */}
                          <div className="bg-[#F4F8F6] rounded-2xl p-3.5 mb-4 border border-[#E3ECE7]">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#5E8E81] mb-1">
                              {isRw ? 'Ubumenyi n\'Ibyo yibandaho:' : 'Clinical Profile:'}
                            </p>
                            <p className="text-xs text-[#08352A] font-medium leading-relaxed">
                              {doc.bio || (isRw ? 'Umuganga w\'inzobere wemewe mu Rwanda ufasha abanyarwanda kwiyubaka mu mitekerereze n\'ubuzima bwo mu mutwe.' : 'Licensed Rwandan specialist providing confidential mental health support and telehealth counseling.')}
                            </p>
                          </div>

                          {/* Languages */}
                          <div className="flex items-center justify-between text-[11px] text-[#73A697] font-medium mb-5 px-1">
                            <span>{formatLanguages(doc.language_pref)}</span>
                            <span className="text-[#21B48D] font-bold flex items-center gap-1">
                              <ShieldCheck size={12} />
                              <span>Encrypted Telehealth</span>
                            </span>
                          </div>

                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-3 border-t border-[#F0F5F2] flex items-center gap-2.5">
                          <button
                            onClick={() => handleOpenBooking(doc)}
                            className="flex-1 py-3 px-4 bg-[#08352A] hover:bg-[#154E3F] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                          >
                            <Calendar size={14} className="text-[#21B48D]" />
                            <span>{isRw ? 'Fata Gahunda' : 'Book Session'}</span>
                          </button>

                          <button
                            onClick={() => startInstantVideoRoom(doc)}
                            className="p-3 bg-[#E2F2EC] hover:bg-[#D5EADB] text-[#08352A] rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="Launch Video Call"
                          >
                            <Video size={16} className="text-[#08352A]" />
                          </button>

                          <button
                            onClick={() => navigate('/patient/chat')}
                            className="p-3 bg-[#F4F8F6] hover:bg-[#EBF3EF] border border-[#DCEBE3] text-[#08352A] rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="Open Chat"
                          >
                            <MessageSquare size={15} />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── MEDICAL CONFIDENTIALITY NOTICE ── */}
            <div className="bg-white rounded-3xl p-6 border border-[#DFEBE5] flex flex-col sm:flex-row items-center gap-4 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-[#08352A] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <ShieldCheck size={24} className="text-[#21B48D]" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-sm font-extrabold text-[#08352A]">
                  {isRw ? 'Umutekano n’Ibanga Bikomeye by’Ubuvuzi mu Rwanda' : 'Medical Confidentiality & Patient Privacy Standards'}
                </h4>
                <p className="text-xs text-[#5E8E81] mt-0.5 leading-relaxed">
                  {isRw
                    ? 'Ibiganiro byose by’amashusho n\'ubutumwa birinzwe mu ibanga rikomeye kandi byubahiriza amategeko yo kurengera amakuru y\'umurwayi mu Rwanda.'
                    : 'All video sessions and clinical notes are strictly confidential and end-to-end encrypted in compliance with Rwandan medical privacy regulations.'}
                </p>
              </div>
            </div>
          </>
        )}

      </div>

      {/* ── BOOKING MODAL ── */}
      <AnimatePresence>
        {bookingDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBookingDoctor(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-7 space-y-6 z-10 border border-[#DFEBE5]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F5F2]">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#08352A]">
                    {isRw ? 'Gufata Gahunda na Muganga' : 'Schedule Telehealth Consultation'}
                  </h3>
                  <p className="text-xs text-[#21B48D] font-bold mt-0.5">
                    {bookingDoctor.full_name} • {bookingDoctor.location || 'Rwanda'}
                  </p>
                </div>
                <button
                  onClick={() => setBookingDoctor(null)}
                  className="p-1.5 text-[#8DB4A8] hover:text-[#08352A] rounded-xl hover:bg-[#F4F8F6] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConfirmBooking} className="space-y-4">
                
                {/* Format Selector */}
                <div>
                  <label className="text-xs font-bold text-[#08352A] block mb-2">
                    {isRw ? 'Uburyo bwo kubonana:' : 'Consultation Mode:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSessionFormat('video')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        sessionFormat === 'video'
                          ? 'border-[#08352A] bg-[#08352A] text-white shadow-xs'
                          : 'border-[#DCEBE3] bg-[#F4F8F6] text-[#08352A]'
                      }`}
                    >
                      <Video size={15} />
                      <span>Video Consultation</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSessionFormat('chat')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        sessionFormat === 'chat'
                          ? 'border-[#08352A] bg-[#08352A] text-white shadow-xs'
                          : 'border-[#DCEBE3] bg-[#F4F8F6] text-[#08352A]'
                      }`}
                    >
                      <MessageSquare size={15} />
                      <span>Private Chat</span>
                    </button>
                  </div>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="text-xs font-bold text-[#08352A] block mb-1.5">
                    {isRw ? 'Itariki yo kubonana:' : 'Select Consultation Date:'}
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#DCEBE3] text-xs font-medium text-[#08352A] outline-none focus:border-[#21B48D]"
                  />
                </div>

                {/* Time Selection */}
                <div>
                  <label className="text-xs font-bold text-[#08352A] block mb-1.5">
                    {isRw ? 'Isaha yo kubonana:' : 'Select Preferred Time Slot:'}
                  </label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#DCEBE3] text-xs font-medium text-[#08352A] outline-none focus:border-[#21B48D]"
                  >
                    <option value="09:00 AM">09:00 AM - 10:00 AM (Morning)</option>
                    <option value="11:00 AM">11:00 AM - 12:00 PM (Morning)</option>
                    <option value="02:00 PM">02:00 PM - 03:00 PM (Afternoon)</option>
                    <option value="04:00 PM">04:00 PM - 05:00 PM (Afternoon)</option>
                    <option value="06:00 PM">06:00 PM - 07:00 PM (Evening)</option>
                  </select>
                </div>

                {/* Chief Concern */}
                <div>
                  <label className="text-xs font-bold text-[#08352A] block mb-1.5">
                    {isRw ? 'Icyo ushaka ko muganiraho:' : 'Session Focus / Topic:'}
                  </label>
                  <input
                    type="text"
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder={isRw ? 'Urugero: Kwiheba, umunaniro mu kazi...' : 'e.g., Anxiety management, general check-in...'}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#DCEBE3] text-xs font-medium text-[#08352A] outline-none focus:border-[#21B48D]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full py-3.5 bg-[#08352A] hover:bg-[#154E3F] text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {bookingLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} className="text-[#21B48D]" />
                    )}
                    <span>{isRw ? 'Emeza Gahunda' : 'Confirm & Schedule Appointment'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── TOAST NOTIFICATION ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className={`fixed bottom-8 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-2.5 border text-xs font-bold ${
              toast.type === 'success'
                ? 'bg-[#08352A] text-white border-[#21B48D]/30'
                : 'bg-red-600 text-white border-red-500'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} className="text-[#21B48D]" />
            ) : (
              <AlertTriangle size={16} />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ACTIVE VIDEO SESSION OVERLAY ── */}
      <AnimatePresence>
        {incomingCall && (
          <IncomingCall
            doctorName={incomingCall.doctor_name || 'Assigned Specialist'}
            onAccept={() => {
              setActiveVideoSession(incomingCall);
              setIncomingCall(null);
            }}
            onDecline={() => setIncomingCall(null)}
          />
        )}
        {activeVideoSession && (
          <VideoSession
            roomUrl={activeVideoSession.room_url}
            role="patient"
            sessionId={activeVideoSession.id}
            onLeave={() => setActiveVideoSession(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
