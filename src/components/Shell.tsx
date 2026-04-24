import React, { ReactNode } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  Home, MessageCircle, Users, BarChart2, BookOpen, MapPin,
  HandMetal, Settings, ShieldAlert, User, AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ShellProps {
  children?: ReactNode;
}

export const Shell: React.FC<ShellProps> = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const isRw = i18n.language?.startsWith('rw') || false;
  const toggleLanguage = () => {
    i18n.changeLanguage(isRw ? 'en' : 'rw');
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
        { to: '/community', icon: Users, label: t('nav.community') },
        { to: '/progress', icon: BarChart2, label: t('nav.progress') },
      ],
    },
    {
      title: isRw ? 'Amakuru & Ubufasha' : 'Resources',
      items: [
        { to: '/education', icon: BookOpen, label: t('nav.education') },
        { to: '/centers', icon: MapPin, label: t('nav.centers') },
        { to: '/professionals', icon: User, label: t('nav.professionals') },
        { to: '/sign-language', icon: HandMetal, label: t('nav.sign') },
      ],
    },
    {
      title: isRw ? 'Ihutirwa' : 'Emergency',
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
        <button onClick={() => navigate('/')} className="flex items-center py-1">
          <img src="/logo.png" alt="Humura AI" className="h-[2.5rem] md:h-[2.75rem] object-contain" />
        </button>

        <div className="flex items-center bg-primary-50 rounded-full p-1 border border-primary-100 shadow-sm">
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
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 animate-in fade-in duration-500">
        <Outlet />
      </main>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-primary-50 z-40 overflow-y-auto">
        <div className="p-4 border-b border-primary-50">
          <div className="flex flex-col items-center justify-center mb-2 mt-2 space-y-1">
            <img src="/logo.png" alt="Humura AI" className="h-24 object-contain" />
            <p className="text-sm font-bold text-primary-600 tracking-wide text-center">mind supported, life empowered.</p>
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
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Quick Exit */}
        <div className="p-3 border-t border-primary-50">
          <a
            href="https://google.com"
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-neutral-100 text-neutral-600 text-sm font-semibold hover:bg-neutral-200 transition-colors"
          >
            <ShieldAlert size={16} />
            {isRw ? 'Sohoka Vuba' : 'Quick Exit'}
          </a>
        </div>
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
    </div>
  );
};


