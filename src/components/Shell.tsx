import React, { ReactNode, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, MessageCircle, Users, BarChart2, BookOpen, MapPin,
  HandMetal, Settings, ShieldAlert, User, AlertTriangle, RotateCcw, X, Phone, Type, Bell, Languages, LogOut, Activity
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

import { useTranslation } from 'react-i18next';

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

  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  const [sessions, setSessions] = useState<any[]>(() => {
    const saved = localStorage.getItem('Humura_chat_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((s: any) => ({
          ...s,
          lastUpdated: new Date(s.lastUpdated)
        }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Global Accessibility Settings Loader
  useEffect(() => {
    const applySettings = () => {
      const saved = localStorage.getItem('Humura_settings_v2');
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          document.documentElement.classList.toggle('high-contrast', !!settings.highContrast);
          const sizeClasses = ['text-sm', 'text-md', 'text-lg', 'text-xl'];
          document.documentElement.classList.remove(...sizeClasses);
          if (settings.textSize) {
            document.documentElement.classList.add(`text-${settings.textSize}`);
          }
        } catch (e) {}
      }
    };

    applySettings();
    // Listen for storage changes (when settings are updated in another tab or the same page)
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

  const handleSafetyExit = () => {
    window.location.replace('https://www.google.com');
  };

  // Refresh history whenever it's opened
  useEffect(() => {
    if (showHistory) {
      const saved = localStorage.getItem('Humura_chat_sessions');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSessions(parsed.map((s: any) => ({
            ...s,
            lastUpdated: new Date(s.lastUpdated)
          })));
        } catch (e) {}
      }
    }
  }, [showHistory]);

  const startNewChat = () => {
    const id = Date.now().toString();
    navigate(`/chat?session=${id}`);
    setShowHistory(false);
  };


  // Bottom mobile nav (primary 4)
  const mobileNavItems = [
    { to: '/', icon: Home, label: t('nav.home') },
    { to: '/chat', icon: MessageCircle, label: t('nav.chat') },
    { to: '/community', icon: Users, label: t('nav.community') },
    { to: '/emergency', icon: AlertTriangle, label: t('nav.emergency') },
  ];

  // Full sidebar nav
  const sidebarSections = [
    {
      title: isRw ? 'Ibihingwa' : 'Core',
      items: [
        { to: '/', icon: Home, label: t('nav.home') },
        { to: '/chat', icon: MessageCircle, label: t('nav.chat') },
        { to: '#', icon: RotateCcw, label: isRw ? 'ibiganiro twagiranye' : 'Chat History', onClick: () => setShowHistory(true) },
        { to: '/community', icon: Users, label: t('nav.community') },
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

  return (
    <div className="flex flex-col min-h-screen bg-background pb-16 md:pb-0 md:pl-64">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-primary-50 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="flex items-center py-1">
            <img src="/logo.png" alt="Humura AI" className="h-[2.5rem] md:h-[2.75rem] object-contain" />
          </button>
        </div>



        <div className="flex items-center gap-3">
          <div className="flex items-center bg-primary-50 rounded-full p-1 border border-primary-100 shadow-sm mr-2">
            <button 
              onClick={() => i18n.changeLanguage('en')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                !isRw ? 'bg-primary text-white shadow-sm' : 'text-primary-600 hover:bg-primary-100'
              }`}
            >
              English
            </button>
            <button 
              onClick={() => i18n.changeLanguage('rw')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                isRw ? 'bg-primary text-white shadow-sm' : 'text-primary-600 hover:bg-primary-100'
              }`}
            >
              Kinyarwanda
            </button>
          </div>

          <button 
            onClick={() => navigate('/notifications')}
            className={`p-2 rounded-full bg-primary-50 text-primary-600 border border-primary-100 shadow-sm transition-all active:scale-95 ${shouldShake ? 'animate-shake-bell ring-2 ring-primary-200' : ''}`}
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 animate-in fade-in duration-500 flex flex-col">
        <div className="flex-1">
          <Outlet />
        </div>

        {/* Premium Footer */}
        <footer className="mt-32 pt-20 pb-16 border-t border-primary-50 bg-white/40 backdrop-blur-md rounded-t-[5rem] shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.05)]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {/* Column 1: Our Mission */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-2xl">
                    <img src="/logo.png" alt="Humura AI" className="h-8 w-8 object-contain" />
                  </div>
                  <span className="font-black text-primary-900 text-xl tracking-tighter">Humura AI</span>
                </div>
                <p className="text-sm text-neutral-500 leading-relaxed font-medium">
                  {isRw 
                    ? "Humura AI ni urubuga rw'ikoranabuhanga rugamije gutanga ubufasha mu buzima bwo mu mutwe. Twishimiye gufasha Abanyarwanda bose binyuze mu buryo bugezweho n'ikoranabuhanga ridakumira bwa mbere mu Rwanda."
                    : "Humura AI is a bilingual mental health ecosystem providing inclusive and empathetic support. We bridge the gap in mental wellness through innovative AI and accessibility tools for the entire Rwandan community."}
                </p>
              </div>

              {/* Column 2: Core Services */}
              <div className="space-y-6">
                <h4 className="font-black text-primary-900 text-xs uppercase tracking-[0.2em]">
                  {isRw ? "Serivisi Zacu" : "Core Services"}
                </h4>
                <ul className="text-sm text-neutral-500 space-y-3 font-semibold">
                  <li className="flex items-center gap-2 hover:text-primary transition-colors cursor-default">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                    {isRw ? "Ubuvuzi bwa CBT bumva umuntu" : "Empathetic CBT Therapy"}
                  </li>
                  <li className="flex items-center gap-2 hover:text-primary transition-colors cursor-default">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                    {isRw ? "Gufasha mu marenga" : "Sign Language Support"}
                  </li>
                  <li className="flex items-center gap-2 hover:text-primary transition-colors cursor-default">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                    {isRw ? "Inyandiko z'impumyi (Braille)" : "Braille Document Tool"}
                  </li>
                  <li className="flex items-center gap-2 hover:text-primary transition-colors cursor-default">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                    {isRw ? "Gusobanura Indimi (Translator)" : "Language Translator"}
                  </li>
                  <li className="flex items-center gap-2 hover:text-primary transition-colors cursor-default">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                    {isRw ? "Isesengura ry'Iterambere (AI Insights)" : "AI Progress Insights"}
                  </li>
                  <li className="flex items-center gap-2 hover:text-primary transition-colors cursor-default">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                    {isRw ? "Ubutabazi bw'ihutirwa" : "Emergency Help (114)"}
                  </li>
                </ul>
              </div>

              {/* Column 3: Innovation */}
              <div className="space-y-6">
                <h4 className="font-black text-primary-900 text-xs uppercase tracking-[0.2em]">
                  {isRw ? "Ikoranabuhanga" : "Innovations"}
                </h4>
                <ul className="text-sm text-neutral-500 space-y-3 font-semibold">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                    Next.js & Supabase Stack
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                    Render Cloud Backend
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                    Gemini 3 Flash Preview
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                    Supabase Edge (super-task)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                    Sign Language Vision AI
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                    Multi-turn AI Memory
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                    MyMemory Translation API
                  </li>
                </ul>
              </div>

              {/* Column 4: Testimonies */}
              <div className="space-y-6">
                <h4 className="font-black text-primary-900 text-xs uppercase tracking-[0.2em]">
                  {isRw ? "Ubuhamya" : "Testimonies"}
                </h4>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-xs italic text-neutral-500 leading-relaxed font-medium">
                      "{isRw ? "uru rubuga rwamfashije mu bihe bikomeye. AI ya humura irumva cyane" : "This platform helped me through a dark time. Humura's AI is incredibly empathetic."}"
                    </p>
                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-wider">— Kamana John</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs italic text-neutral-500 leading-relaxed font-medium">
                      "{isRw ? "Uburyo bw’amarenga nibwo nshobora gukoresha kuko ntumva si ntavuge. Urakoze humura AI" : "The sign language feature is what I've been waiting for. Thank you Humura AI!"}"
                    </p>
                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-wider">— Kanyange Ancilla</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs italic text-neutral-500 leading-relaxed font-medium">
                      "{isRw ? "Uburyo bwa braille bwaramfashije cyane kuko mfite ubumuga bwo kutabona, ubu nshobora kubona ubufasha bw'inzobere mu buryo bworoshye." : "The Braille generator is a lifesaver. As someone with a visual impairment, I can finally access professional help independently."}"
                    </p>
                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-wider">— Mugabo Eric</p>
                  </div>
                </div>
              </div>
            </div>
          </div>


          <div className="mt-10 pt-6 border-t border-primary-50 flex flex-col items-center gap-6 text-center">
            <p className="text-[10px] text-neutral-400 font-medium tracking-widest uppercase">
              &copy; {new Date().getFullYear()} Humura AI · Mind Supported, Life Empowered.
            </p>
          </div>

        </footer>
      </main>


      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-primary-50 z-40 overflow-y-auto">
        <div className="p-3 border-b border-primary-50">
          <div className="flex flex-col items-center justify-center space-y-1">
            <img src="/logo.png" alt="Humura AI" className="h-14 object-contain" />
            <p className="text-[10px] font-bold text-primary-600 tracking-tight text-center uppercase">mind supported, life empowered.</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-4">
          {sidebarSections.map((section) => (
            <div key={section.title}>
              {section.title && (
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-3 mb-1">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item: any) => (
                  item.onClick ? (
                    <button
                      key={item.label}
                      onClick={item.onClick}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm text-neutral-500 hover:bg-primary-50 hover:text-primary-900"
                    >
                      <item.icon size={18} />
                      {item.label}
                    </button>
                  ) : (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${
                          isActive
                            ? item.danger
                              ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                              : 'bg-primary text-white shadow-md shadow-primary/20'
                            : item.danger
                            ? 'text-red-500 hover:bg-red-50'
                            : 'text-neutral-500 hover:bg-primary-50 hover:text-primary-900'
                        }`
                      }
                    >
                      <item.icon size={18} className={item.to === '/notifications' && shouldShake ? 'animate-shake-bell' : ''} />
                      {item.label}
                    </NavLink>
                  )
                ))}

              </div>
            </div>
          ))}
        </nav>

        {/* Quick Exit removed from here as per user request to move it to the absolute bottom */}
      </aside>


      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-primary-50 pb-safe z-50">
        <div className="flex justify-around items-center h-16">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
                  item.to === '/emergency'
                    ? isActive ? 'text-red-600' : 'text-red-400 hover:text-red-500'
                    : isActive ? 'text-primary' : 'text-neutral-400 hover:text-primary-500'
                }`
              }
            >
              <item.icon size={22} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Global History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-[110] shadow-2xl border-r border-primary-50 flex flex-col"
            >
              <div className="p-4 border-b border-primary-50 flex items-center justify-between bg-primary-50/50">
                <div className="flex items-center gap-2">
                  <RotateCcw size={18} className="text-primary" />
                  <h3 className="font-bold text-primary-900">{isRw ? 'ibiganiro twagiranye' : 'Chat History'}</h3>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-1.5 hover:bg-primary-100 rounded-lg text-neutral-400 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-3">
                <button
                  onClick={startNewChat}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-600 transition-all shadow-md shadow-primary/20"
                >
                  <MessageCircle size={18} />
                  {isRw ? 'Ikiganiro Gishya' : 'New Chat'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                    <MessageCircle size={32} className="text-neutral-200 mb-2" />
                    <p className="text-xs text-neutral-400">
                      {isRw ? 'Nta mateka y\'ibiganiro arahari.' : 'No chat history yet.'}
                    </p>
                  </div>
                ) : (
                  sessions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        navigate(`/chat?session=${s.id}`);
                        setShowHistory(false);
                      }}
                      className="w-full text-left px-4 py-3.5 rounded-2xl text-sm transition-all flex items-start gap-3 hover:bg-primary-50 group border border-transparent hover:border-primary-100"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        <MessageCircle size={16} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-bold text-primary-900 truncate mb-0.5">{s.title}</p>
                        <p className="text-[10px] text-neutral-400">
                          {s.lastUpdated.toLocaleDateString()} · {s.messages.length} {isRw ? 'Ubutumwa' : 'messages'}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-primary-50 bg-neutral-50/50">
                <Link 
                  to="/progress" 
                  onClick={() => setShowHistory(false)}
                  className="flex items-center gap-2 text-xs font-bold text-primary-600 hover:text-primary-800 transition-colors"
                >
                  <BarChart2 size={14} />
                  {isRw ? 'Reba aho ugeze' : 'View full progress'}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};



