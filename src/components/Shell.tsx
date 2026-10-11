import React, { ReactNode, useState, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Phone,
  Bell,
  LogOut,
  Calendar,
  MessageSquare,
  Users,
  Video,
  User,
  Shield
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import IncomingCall from './clinical/IncomingCall';
import { Sidebar } from './Sidebar';
import { PatientNavbar } from './PatientNavbar';

interface ShellProps {
  children?: ReactNode;
}

export const Shell: React.FC<ShellProps> = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRw = i18n.language?.startsWith('rw') || false;

  // Auth State
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Sidebar Collapsible State with LocalStorage Persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('humura_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('humura_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    setRole(data?.role || 'patient');
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('Humura_settings_v2');
    localStorage.removeItem('i18nextLng');
    setRole(null);
    navigate('/');
  };

  const [shouldShake, setShouldShake] = useState(false);

  // Notification Shake Listener
  useEffect(() => {
    const triggerShake = () => {
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 2000);
    };

    window.addEventListener('humura-notification-added', triggerShake);
    return () => window.removeEventListener('humura-notification-added', triggerShake);
  }, []);

  // Real-time Session Notification Listener (Socket.io)
  const [incomingSocketSession, setIncomingSocketSession] = useState<any>(null);

  useEffect(() => {
    if (user && role === 'patient') {
      const socket = io(import.meta.env.VITE_RENDER_BACKEND_URL, {
        query: { 
          userId: user.id, 
          role: 'patient' 
        },
        transports: ["websocket"]
      });

      socket.on('session:started', (data: any) => {
        setIncomingSocketSession(data);
        setShouldShake(true);
        setTimeout(() => setShouldShake(false), 3000);
      });

      socket.on('session:video_started', (data: any) => {
        setIncomingCall({
          id: data.session_id,
          room_url: data.video_room_url,
          doctor_name: data.doctor_name || 'Your Doctor'
        });
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user, role]);

  // Real-time Session Notification Listener (Supabase - Primary for Video)
  const [incomingCall, setIncomingCall] = useState<any>(null);

  useEffect(() => {
    if (!user?.id || role !== 'patient') return;

    const channel = supabase
      .channel('global-video-calls')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `patient_id=eq.${user.id}`
        },
        async (payload) => {
          if (payload.new.video_room_url) {
            const { data: doc } = await supabase.from('profiles').select('full_name').eq('id', payload.new.doctor_id).single();
            setIncomingCall({
              id: payload.new.id,
              room_url: payload.new.video_room_url,
              doctor_name: doc?.full_name || 'Your Doctor'
            });
          } else {
            setIncomingCall(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, role]);

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    sessionStorage.setItem('active_video_session', JSON.stringify(incomingCall));
    setIncomingCall(null);
    navigate('/patient/meet-professional');
  };

  const handleDeclineCall = async () => {
    if (!incomingCall) return;
    try {
      await fetch(`${import.meta.env.VITE_RENDER_BACKEND_URL}/api/video/end-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: incomingCall.id })
      });
      setIncomingCall(null);
    } catch (err) {
      console.error(err);
      setIncomingCall(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F6] text-[#08352A] font-poppins relative selection:bg-[#21B48D] selection:text-white">
      
      {/* ── DESKTOP DOCKED SIDEBAR (COLLAPSIBLE / EXPANDABLE) ── */}
      <div className={`hidden md:block fixed inset-y-0 left-0 z-40 shadow-sm overflow-y-auto transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebar} />
      </div>



      {/* ── MOBILE SLIDE-OVER DRAWER ── */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="relative w-72 max-w-[80vw] h-full bg-[#08352A] z-10 overflow-y-auto"
            >
              <Sidebar onClose={() => setMobileDrawerOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── GLOBAL INCOMING VIDEO CALL MODAL ── */}
      <AnimatePresence>
        {incomingCall && (
          <IncomingCall 
            doctorName={incomingCall.doctor_name}
            onAccept={handleAcceptCall}
            onDecline={handleDeclineCall}
          />
        )}
      </AnimatePresence>

      {/* ── REAL-TIME SOCKET SESSION JOIN NOTIFICATION ── */}
      <AnimatePresence>
        {incomingSocketSession && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
          >
            <div className="p-1 rounded-[2rem] shadow-2xl bg-white/95 backdrop-blur-xl border border-emerald-100">
              <div className="flex items-center gap-4 p-4 rounded-[1.8rem] bg-white">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-[#21B48D] flex items-center justify-center text-white animate-pulse">
                    <Phone size={24} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest text-[#21B48D]">
                    {isRw ? 'Ikiganiro kiratangiye' : 'Live Session Started'}
                  </p>
                  <p className="text-sm font-bold truncate text-[#08352A]">
                    {isRw ? `Muganga ${incomingSocketSession.doctorName} aragutegereje` : `Dr. ${incomingSocketSession.doctorName} is waiting for you`}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setIncomingSocketSession(null)}
                    className="p-2 rounded-xl hover:bg-neutral-50 text-neutral-400"
                  >
                    <X size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      setIncomingSocketSession(null);
                      navigate('/patient/meet-professional');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#08352A] text-white font-black text-xs shadow-md hover:bg-[#154E3F] transition-all"
                  >
                    {isRw ? 'INJIRA' : 'JOIN NOW'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT AREA (DYNAMIC OFFSET BASED ON SIDEBAR) ── */}
      <div className={`min-h-screen flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        {/* SHARED PATIENT TOP NAVBAR */}
        <PatientNavbar 
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
          user={user}
        />

        <main className="flex-1 flex flex-col min-w-0 pb-12 md:pb-6">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default Shell;
