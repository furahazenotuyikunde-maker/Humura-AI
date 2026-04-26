import React, { ReactNode, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, MessageCircle, Users, BarChart2, BookOpen, MapPin,
  HandMetal, Settings, ShieldAlert, User, AlertTriangle, RotateCcw, X, Phone, Type, Bell
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
      ],
    },
    {
      title: isRw ? 'Amakuru & Ubufasha' : 'Resources',
      items: [
        { to: '/education', icon: BookOpen, label: t('nav.education') },
        { to: '/centers', icon: MapPin, label: t('nav.centers') },
        { to: '/professionals', icon: User, label: t('nav.professionals') },
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
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 animate-in fade-in duration-500 flex flex-col">
        <div className="flex-1">
          <Outlet />
        </div>

        {/* Premium Footer */}
        <footer className="mt-32 pt-16 pb-12 border-t border-primary-50 bg-white/50 backdrop-blur-sm rounded-t-[4rem]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
            {/* About */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Humura AI" className="h-8 object-contain" />
                <span className="font-bold text-primary-900 tracking-tight">Humura AI</span>
              </div>
              <p className="text-sm text-neutral-500 leading-relaxed">
                {isRw 
                  ? "Humura AI ni urubuga rw'ikoranabuhanga rurimo indimi ebyiri rugamije gutanga ubufasha mu buzima bwo mu mutwe kuri bose nta n’umwe uhejwe. Twibanda cyane ku gufasha abafite ubumuga: inzobere zishobora kwifashisha 'Braille Generator' mu gutanga inama ku bafite ubumuga bwo kutabona, hakaba n'uburyo bw'amarenga (Sign Language) n'ubutabazi bwihutirwa mu muryango nyarwanda."
                  : "Humura AI is a bilingual mental health platform dedicated to inclusive and accessible support for everyone. We empower mental health professionals to provide guidance to visually impaired individuals through our Braille Generator, offer integrated Sign Language support for the deaf community, and provide empathetic AI therapy and crisis intervention for the entire Rwandan community."}
              </p>
            </div>

            {/* Tech Stack */}
            <div className="space-y-4">
              <h4 className="font-bold text-primary-900 text-sm uppercase tracking-wider">
                {isRw ? "Ikoranabuhanga rya Humura" : "Humura Tech Stack"}
              </h4>
              <ul className="text-sm text-neutral-500 space-y-2">
                <li className="font-bold text-primary-600">
                  {isRw ? "• Porogaramu igendanwa (React & Vite)" : "• Mobile-First App (React & Vite)"}
                </li>
                <li className="font-bold text-primary-600">• {isRw ? 'Ikoranabuhanga rya Braille (Grade 1)' : 'Braille Document Tech (Grade 1)'}</li>
                <li>• Google Gemini 3 Flash Preview</li>
                <li>• Supabase Edge (super-task)</li>
                <li>• Sign Language Vision AI</li>
                <li>• Multi-turn AI Memory</li>
              </ul>
            </div>

            {/* Testimonials */}
            <div className="space-y-4">
              <h4 className="font-bold text-primary-900 text-sm uppercase tracking-wider">
                {isRw ? "Ubuhamya" : "Testimonies"}
              </h4>
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="italic text-xs text-neutral-500 border-l-2 border-primary-100 pl-3 leading-relaxed">
                    "{isRw ? "uru rubuga rwamfashije mu bihe bikomeye. AI ya humura irumva cyane" : "This platform helped me through a dark time. Humura's AI is incredibly empathetic."}"
                  </div>
                  <p className="text-xs font-bold text-primary-600 pl-3">— {isRw ? "Kamana john" : "Kamana John"}</p>
                </div>
                <div className="space-y-1">
                  <div className="italic text-xs text-neutral-500 border-l-2 border-primary-100 pl-3 leading-relaxed">
                    "{isRw ? "Uburyo bw’amarenga nibwo nshobora gukoresha kuko ntumva si ntavuge. Urakoze humura AI" : "The sign language feature is what I've been waiting for. Thank you Humura AI!"}"
                  </div>
                  <p className="text-xs font-bold text-primary-600 pl-3">— {isRw ? "Kanyange ancilla" : "Kanyange Ancilla"}</p>
                </div>
              </div>
            </div>


            {/* Contact */}
            <div className="space-y-4">
              <h4 className="font-bold text-primary-900 text-sm uppercase tracking-wider">
                {isRw ? "Twandikire" : "Contact"}
              </h4>
              <div className="text-sm text-neutral-500 space-y-2">
                <p className="flex items-center gap-2">
                  <Phone size={16} className="text-primary-400" />
                  +250 790 723 406
                </p>
                <p className="flex items-center gap-2">
                  <ShieldAlert size={16} className="text-primary-400" />
                  tuyikundefzeno@gmail.com
                </p>
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



