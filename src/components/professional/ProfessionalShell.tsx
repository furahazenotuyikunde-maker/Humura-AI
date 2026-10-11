import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import { ProfessionalNavbar } from './ProfessionalNavbar';
import { ProfessionalSidebar } from './ProfessionalSidebar';
import VideoConsultationRoom from '../clinical/VideoConsultationRoom';

export const ProfessionalShell: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRw = i18n.language?.startsWith('rw');

  const [doctorUser, setDoctorUser] = useState<any>(null);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  // Live Counts for Sidebar Badges
  const [patientsCount, setPatientsCount] = useState(0);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  // Active Session / Incoming Video Call
  const [activeSession, setActiveSession] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Collapsible state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('humura_pro_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('humura_pro_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Initial Load & Auth Check
  useEffect(() => {
    checkDoctorAuth();
  }, []);

  const checkDoctorAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setDoctorUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile || profile.role !== 'doctor') {
        // Not a clinician account
        navigate('/patient/dashboard');
        return;
      }
      setDoctorProfile(profile);

      // Fetch initial live counts
      fetchLiveCounters(user.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveCounters = async (doctorId: string) => {
    try {
      // 1. Live Caseload Count
      const { count: pCount } = await supabase
        .from('patient_caseload')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .eq('status', 'active');

      if (pCount !== null) setPatientsCount(pCount);

      // 2. Unresolved Crisis & AI Tasks Count
      const { count: aCount } = await supabase
        .from('crisis_events')
        .select('*', { count: 'exact', head: true })
        .is('resolved_at', null);

      if (aCount !== null) setUnreadAlertsCount(aCount);
    } catch (err) {
      console.error('Error fetching clinician counters:', err);
    }
  };

  // 2. Supabase Realtime Listener
  useEffect(() => {
    if (!doctorProfile?.id) return;

    const channel = supabase
      .channel('clinical-ops-shell')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crisis_events' }, () => {
        fetchLiveCounters(doctorProfile.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patient_caseload' }, (payload) => {
        fetchLiveCounters(doctorProfile.id);
        if (payload.eventType === 'INSERT') {
          showToast(isRw ? 'Umurwayi mushya yongerewe muri dosiye yawe!' : 'New patient assigned to your caseload!', 'success');
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, (payload) => {
        if (payload.new && (payload.new as any).video_room_url && (payload.new as any).status === 'in_progress') {
          setActiveSession(payload.new);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctorProfile?.id]);

  // 3. Socket.io Realtime Listener
  useEffect(() => {
    if (!doctorProfile?.id) return;

    const baseUrl = (import.meta.env.VITE_RENDER_BACKEND_URL || 'https://humura-ai-1.onrender.com').replace(/\/$/, '');
    const socket = io(baseUrl, {
      query: { 
        userId: doctorProfile.id,
        role: 'doctor'
      },
      transports: ['websocket', 'polling']
    });

    socket.emit('join_doctor_room', doctorProfile.id);

    socket.on('patient:assigned', (data: any) => {
      showToast(`${isRw ? 'Umurwayi mushya' : 'New Patient'}: ${data.patient_name || 'Assigned'}`, 'success');
      fetchLiveCounters(doctorProfile.id);
    });

    socket.on('patient:ai_struggle_flagged', (data: any) => {
      showToast(isRw ? 'Inshingano nshya ya AI yagaragaye!' : 'AI flagged patient struggle assigned!', 'success');
      fetchLiveCounters(doctorProfile.id);
    });

    socket.on('session:video_started', (data: any) => {
      setActiveSession(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [doctorProfile?.id]);

  const handleToggleAvailability = async () => {
    const next = !isAvailable;
    setIsAvailable(next);
    if (doctorProfile?.id) {
      try {
        await supabase
          .from('doctor_profiles')
          .update({ is_available: next, last_seen_at: new Date().toISOString() })
          .eq('user_id', doctorProfile.id);
      } catch (err) {
        // non-blocking
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F6] text-[#08352A] font-poppins relative selection:bg-[#21B48D] selection:text-white">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-xl font-bold text-xs ${
              toast.type === 'success'
                ? 'bg-[#08352A] text-white border border-[#21B48D]/40'
                : 'bg-red-600 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Consultation Room Overlay */}
      <AnimatePresence>
        {activeSession && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[120]"
          >
            <VideoConsultationRoom
              session={activeSession}
              role="doctor"
              onEnd={() => setActiveSession(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DESKTOP DOCKED PROFESSIONAL SIDEBAR ── */}
      <div 
        className={`hidden md:block fixed inset-y-0 left-0 z-40 shadow-sm overflow-y-auto transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <ProfessionalSidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggleCollapse={toggleSidebar}
          patientsCount={patientsCount}
          unreadAlertsCount={unreadAlertsCount}
        />
      </div>

      {/* ── MOBILE SLIDE-OVER DRAWER ── */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="relative w-72 max-w-[80vw] h-full bg-[#08352A] z-10 overflow-y-auto"
            >
              <ProfessionalSidebar 
                onClose={() => setMobileDrawerOpen(false)}
                patientsCount={patientsCount}
                unreadAlertsCount={unreadAlertsCount}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT CONTAINER WITH DYNAMIC SIDEBAR PADDING ── */}
      <div 
        className={`min-h-screen flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        {/* SHARED PROFESSIONAL NAVBAR */}
        <ProfessionalNavbar 
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
          doctorProfile={doctorProfile}
          unreadAlertsCount={unreadAlertsCount}
          isAvailable={isAvailable}
          onToggleAvailability={handleToggleAvailability}
        />

        {/* OUTLET FOR PROFESSIONAL PAGES */}
        <main className="flex-1 flex flex-col min-w-0 pb-12 md:pb-6">
          <Outlet context={{ doctorProfile, isAvailable, refreshCounters: fetchLiveCounters }} />
        </main>
      </div>

    </div>
  );
};

export default ProfessionalShell;
