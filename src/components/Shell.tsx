import React, { ReactNode, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, MessageCircle, Users, BarChart2, BookOpen, MapPin,
  HandMetal, Settings, ShieldAlert, User, AlertTriangle, RotateCcw, X, Phone, Type, Bell, Languages, LogOut, Activity, ShieldCheck, Video
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { io } from 'socket.io-client';

import { useTranslation } from 'react-i18next';
import IncomingCall from './clinical/IncomingCall';

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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes
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
    setRole(null);
    navigate('/');
  };

  const [shouldShake, setShouldShake] = useState(false);

  // Dark mode
  const [isDark, setIsDark] = useState(() => {
    const s = localStorage.getItem('Humura_settings_v2');
    return s ? JSON.parse(s).darkMode === true : false;
  });

  // Global Accessibility + Dark Mode Settings Loader
  useEffect(() => {
    const applySettings = () => {
      const saved = localStorage.getItem('Humura_settings_v2');
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          document.documentElement.classList.toggle('high-contrast', !!settings.highContrast);
          document.documentElement.classList.toggle('humura-dark', !!settings.darkMode);
          setIsDark(!!settings.darkMode);
          const sizeClasses = ['text-sm', 'text-md', 'text-lg', 'text-xl'];
          document.documentElement.classList.remove(...sizeClasses);
          if (settings.textSize) {
            document.documentElement.classList.add(`text-${settings.textSize}`);
          }
        } catch (e) {}
      }
    };

    applySettings();
    window.addEventListener('storage', applySettings);
    return () => window.removeEventListener('storage', applySettings);
  }, []);

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
        console.log('[SHELL] 🎥 Incoming live session (socket):', data);
        setIncomingSocketSession(data);
        setShouldShake(true);
        setTimeout(() => setShouldShake(false), 3000);
      });

      socket.on('session:video_started', (data: any) => {
        console.log('[SHELL] 🎥 Incoming video session (socket):', data);
        // We prefer Supabase Realtime for the full modal, but we can update state here if needed
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

    // Subscribe to incoming video sessions via the main sessions table
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
          console.log('[SHELL] Sessions update detected:', payload.new);
          if (payload.new.video_room_url) {
            // Fetch doctor name for better UX
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
    // Store in session storage or state to be picked up by MeetProfessionalPage
    sessionStorage.setItem('active_video_session', JSON.stringify(incomingCall));
    setIncomingCall(null);
    navigate('/meet-professional');
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

  const handleSafetyExit = () => {
    window.location.replace('https://www.google.com');
  };

  // Bottom mobile nav (primary 4)
  const mobileNavItems = [
    { to: '/', icon: Home, label: t('nav.home') },
    { to: '/meet-professional', icon: ShieldCheck, label: isRw ? 'Inzobere' : 'Mental Health Professional' },
    { to: '/chat', icon: MessageCircle, label: t('nav.chat') },
    { to: '/progress', icon: BarChart2, label: t('nav.progress') },
  ];

  // Full sidebar nav
  const sidebarSections = [
    {
      title: isRw ? 'Ibihingwa' : 'Core',
      items: [
        { index: true, to: '/', icon: Home, label: t('nav.home') },
        { to: '/meet-professional', icon: ShieldCheck, label: isRw ? 'Inzobere mu buzima' : 'Meet Mental Health Professional' },
        { to: '/chat', icon: MessageCircle, label: t('nav.chat') },
        { to: '/progress', icon: BarChart2, label: t('nav.progress') },
        { to: '/notifications', icon: Bell, label: isRw ? 'Imenyesha' : 'Notifications' },
        ...(role === 'doctor' ? [{ to: '/doctor', icon: Activity, label: isRw ? 'Ibiro bya Muganga' : 'Doctor Dashboard' }] : []),
      ],
    },
    {
      title: isRw ? 'Amakuru & Ubufasha' : 'Resources',
      items: [
        { to: '/education', icon: BookOpen, label: t('nav.education') },
        { to: '/centers', icon: MapPin, label: t('nav.centers') },
        { to: '/sign-language', icon: HandMetal, label: t('nav.sign') },
        { to: '/braille', icon: Type, label: t('nav.braille') },
        { to: '/translator', icon: Languages, label: isRw ? 'Semura' : 'Translator' },
      ],
    },
    {
      title: isRw ? 'ubufasha bw’ihutirwa' : 'Emergency',
      items: [
        { to: '/emergency', icon: AlertTriangle, label: t('nav.emergency'), danger: true },
      ],
    },

    {
      title: '',
      items: [
        { to: '/settings', icon: Settings, label: t('nav.settings') },
      ],
    },
  ];

  const dk = isDark;

  return (
    <div className={`flex flex-col min-h-screen ${dk ? 'bg-[#0d1117]' : 'bg-background'} pb-16 md:pb-0 md:pl-64 transition-colors duration-300`}>
      
      {/* Global Incoming Call Modal */}
      <AnimatePresence>
        {incomingCall && (
          <IncomingCall 
            doctorName={incomingCall.doctor_name}
            onAccept={handleAcceptCall}
            onDecline={handleDeclineCall}
          />
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b px-4 py-3 flex justify-between items-center ${dk ? 'bg-[#131c2e]/95 border-[#1f2d47]' : 'bg-white/80 border-primary-50'}`}>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="flex items-center py-1">
            <img src="/logo.png" alt="Humura AI" className="h-[2.5rem] md:h-[2.75rem] object-contain" />
          </button>
        </div>



        <div className="flex items-center gap-3">
          <div className={`flex items-center rounded-full p-1 border shadow-sm mr-2 ${dk ? 'bg-[#1a2543] border-[#1f2d47]' : 'bg-primary-50 border-primary-100'}`}>
            <button 
              onClick={() => i18n.changeLanguage('en')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                !isRw ? 'bg-primary text-white shadow-sm' : dk ? 'text-[#6b7a99] hover:bg-[#1f2d47]' : 'text-primary-600 hover:bg-primary-100'
              }`}
            >
              English
            </button>
            <button 
              onClick={() => i18n.changeLanguage('rw')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                isRw ? 'bg-primary text-white shadow-sm' : dk ? 'text-[#6b7a99] hover:bg-[#1f2d47]' : 'text-primary-600 hover:bg-primary-100'
              }`}
            >
              Kinyarwanda
            </button>
          </div>

          <button 
            onClick={() => navigate('/notifications')}
            className={`p-2 rounded-full border shadow-sm transition-all active:scale-95 ${dk ? 'bg-[#1a2543] text-[#34d399] border-[#1f2d47]' : 'bg-primary-50 text-primary-600 border-primary-100'} ${shouldShake ? 'animate-shake-bell ring-2 ring-primary-200' : ''}`}
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>

          {user ? (
            <button 
              onClick={handleLogout}
              className="p-2 rounded-full bg-red-50 text-red-600 border border-red-100 shadow-sm transition-all active:scale-95"
              aria-label="Logout"
              title={isRw ? 'Sohoka' : 'Logout'}
            >
              <LogOut size={20} />
            </button>
          ) : (
            <button 
              onClick={() => navigate('/auth')}
              className="px-4 py-2 rounded-full bg-primary text-white font-bold text-xs shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              {isRw ? 'Injira' : 'Login'}
            </button>
          )}
        </div>
      </header>

      {/* Real-time Session Join Notification */}
      <AnimatePresence>
        {incomingSocketSession && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
          >
            <div className={`p-1 rounded-[2rem] shadow-2xl ${dk ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20 backdrop-blur-xl border border-emerald-500/30' : 'bg-white/90 backdrop-blur-xl border border-emerald-100'}`}>
              <div className={`flex items-center gap-4 p-4 rounded-[1.8rem] ${dk ? 'bg-[#131c2e]/80' : 'bg-white'}`}>
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white animate-pulse">
                    <Phone size={24} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-black uppercase tracking-widest ${dk ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {isRw ? 'Ikiganiro kiratangiye' : 'Live Session Started'}
                  </p>
                  <p className={`text-sm font-bold truncate ${dk ? 'text-white' : 'text-primary-900'}`}>
                    {isRw ? `Muganga ${incomingSocketSession.doctorName} aragutegereje` : `Dr. ${incomingSocketSession.doctorName} is waiting for you`}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setIncomingSocketSession(null)}
                    className={`p-2 rounded-xl transition-colors ${dk ? 'hover:bg-white/5 text-neutral-500' : 'hover:bg-neutral-50 text-neutral-400'}`}
                  >
                    <X size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      setIncomingSocketSession(null);
                      navigate('/meet-professional');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    {isRw ? 'INJIRA' : 'JOIN NOW'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 animate-in fade-in duration-500 flex flex-col">
        <div className="flex-1">
          <Outlet />
        </div>

      </main>


      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col fixed inset-y-0 left-0 w-64 border-r z-40 overflow-y-auto ${dk ? 'bg-[#131c2e] border-[#1f2d47]' : 'bg-white border-primary-50'}`}>
        <div className={`p-3 border-b ${dk ? 'border-[#1f2d47]' : 'border-primary-50'}`}>
          <div className="flex flex-col items-center justify-center space-y-1">
            <img src="/logo.png" alt="Humura AI" className="h-14 object-contain" />
            <p className={`text-[10px] font-bold tracking-tight text-center uppercase ${dk ? 'text-[#34d399]' : 'text-primary-600'}`}>mind supported, life empowered.</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-4">
          {sidebarSections.map((section) => (
            <div key={section.title}>
              {section.title && (
                <p className={`text-[10px] font-bold uppercase tracking-wider px-3 mb-1 ${dk ? 'text-[#3d4f6b]' : 'text-neutral-400'}`}>
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item: any) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${
                        isActive
                          ? item.danger
                            ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                            : dk ? 'bg-[#0f3528] text-[#34d399]' : 'bg-primary text-white shadow-md shadow-primary/20'
                          : item.danger
                          ? dk ? 'text-red-400 hover:bg-red-900/20' : 'text-red-500 hover:bg-red-50'
                          : dk ? 'text-[#6b7a99] hover:bg-[#1a2543] hover:text-[#e2e8f0]' : 'text-neutral-500 hover:bg-primary-50 hover:text-primary-900'
                      }`
                    }
                  >
                    <item.icon size={18} className={item.to === '/notifications' && shouldShake ? 'animate-shake-bell' : ''} />
                    {item.label}
                  </NavLink>
                ))}

              </div>
            </div>
          ))}
        </nav>

        {/* User profile card */}
        <div className={`p-3 border-t ${dk ? 'border-[#1f2d47]' : 'border-primary-50'}`}>
          <div className={`flex items-center gap-3 p-3 rounded-2xl ${dk ? 'bg-[#1a2543]' : 'bg-primary-50'}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${dk ? 'bg-gradient-to-br from-[#6366f1] to-[#34d399] text-white' : 'bg-primary text-white'}`}>
              {user ? (user.email?.slice(0, 2).toUpperCase() || 'U') : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className={`text-xs font-black truncate ${dk ? 'text-[#e2e8f0]' : 'text-primary-900'}`}>{user?.email?.split('@')[0] || 'User'}</p>
              <p className={`text-[10px] font-bold ${dk ? 'text-[#34d399]' : 'text-emerald-600'}`}>
                {isRw ? 'Ikiganiro kiri gukomeza' : 'CBT Session Active'}
              </p>
            </div>
          </div>
        </div>
      </aside>


      {/* Mobile Bottom Nav */}
      <nav className={`md:hidden fixed bottom-0 inset-x-0 border-t pb-safe z-50 ${dk ? 'bg-[#131c2e] border-[#1f2d47]' : 'bg-white border-primary-50'}`}>
        <div className="flex justify-around items-center h-16">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
                  item.to === '/emergency'
                    ? isActive ? 'text-red-500' : 'text-red-400'
                    : isActive ? dk ? 'text-[#34d399]' : 'text-primary' : dk ? 'text-[#3d4f6b]' : 'text-neutral-400'
                }`
              }
            >
              <item.icon size={22} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};
