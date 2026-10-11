import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  MessageSquare,
  Users,
  Video,
  User,
  GraduationCap,
  MapPin,
  HandMetal,
  Binary,
  Languages,
  Shield,
  X,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  className = '', 
  onClose,
  isCollapsed: controlledCollapsed,
  onToggleCollapse
}) => {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const location = useLocation();
  const navigate = useNavigate();

  // Internal collapsed state if not controlled by parent
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('humura_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      const next = !internalCollapsed;
      setInternalCollapsed(next);
      try {
        localStorage.setItem('humura_sidebar_collapsed', String(next));
      } catch {}
    }
  };

  const primaryNavItems = [
    {
      to: '/patient/dashboard',
      altTo: '/patient/progress',
      icon: Calendar,
      label_en: 'Progress',
      label_rw: 'Iterambere',
      isActive: (pathname: string) =>
        pathname === '/patient/dashboard' ||
        pathname === '/patient/dashboards' ||
        pathname === '/patient/progress' ||
        pathname === '/patient'
    },
    {
      to: '/patient/chat',
      icon: MessageSquare,
      label_en: 'AI Chat',
      label_rw: 'Ikiganiro na AI',
      isActive: (pathname: string) => pathname === '/patient/chat'
    },
    {
      to: '/patient/community',
      icon: Users,
      label_en: 'Community',
      label_rw: 'Umuryango',
      isActive: (pathname: string) => pathname === '/patient/community'
    },
    {
      to: '/patient/meet-professional',
      icon: Video,
      label_en: 'Professionals',
      label_rw: 'Inzobere',
      isActive: (pathname: string) =>
        pathname === '/patient/meet-professional' || pathname === '/patient/professionals'
    },
    {
      to: '/patient/settings',
      icon: User,
      label_en: 'Profile',
      label_rw: 'Imyirondoro',
      isActive: (pathname: string) => pathname === '/patient/settings'
    }
  ];

  const resourceNavItems = [
    {
      to: '/patient/education',
      icon: GraduationCap,
      label_en: 'Education Hub',
      label_rw: 'Inyigisho'
    },
    {
      to: '/patient/centers',
      icon: MapPin,
      label_en: 'Directory',
      label_rw: 'Amavuriro'
    },
    {
      to: '/patient/sign-language',
      icon: HandMetal,
      label_en: 'Sign Language',
      label_rw: 'Ururimi rw’Amarenga'
    },
    {
      to: '/patient/braille',
      icon: Binary,
      label_en: 'Braille Generator',
      label_rw: 'Braille Generator'
    },
    {
      to: '/patient/translator',
      icon: Languages,
      label_en: 'Translator',
      label_rw: 'Semura'
    }
  ];

  return (
    <aside
      className={`bg-[#08352A] text-white flex flex-col justify-between h-full min-h-screen py-5 font-poppins select-none transition-all duration-300 ${
        isCollapsed ? 'w-20 px-2.5' : 'w-64 px-4'
      } ${className}`}
    >
      <div>
        {/* Brand Header with Logo, Tagline & Collapse Toggle */}
        <div className={`flex items-center mb-6 ${isCollapsed ? 'flex-col gap-3 px-1' : 'justify-between px-2'}`}>
          <div 
            onClick={() => navigate('/patient/dashboard')} 
            className={`flex items-center gap-2.5 cursor-pointer group ${isCollapsed ? 'justify-center' : ''}`}
            title="Humura AI"
          >
            <img
              src="/fixedLogo.png"
              alt="Humura AI"
              className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
            />
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in duration-200">
                <span className="text-base font-extrabold text-white tracking-tight leading-tight">
                  Humura AI
                </span>
                <span className="text-[10px] font-medium text-[#73A697] leading-none mt-0.5">
                  Better Mental Healthcare
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop Collapse / Expand Toggle Button */}
            <button
              type="button"
              onClick={handleToggle}
              className="hidden md:flex w-7 h-7 rounded-lg bg-[#0D3F33] hover:bg-[#154E3F] text-[#73A697] hover:text-white items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
              title={isCollapsed ? (isRw ? 'Kwagura menu' : 'Expand sidebar') : (isRw ? 'Kuzinga menu' : 'Collapse sidebar')}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Mobile Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden text-[#73A697] hover:text-white p-1 rounded-lg"
                aria-label="Close Sidebar"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Primary Navigation List */}
        <nav className="space-y-1.5 mb-6">
          {primaryNavItems.map((item) => {
            const active = item.isActive(location.pathname);
            const Icon = item.icon;
            const label = isRw ? item.label_rw : item.label_en;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                title={isCollapsed ? label : undefined}
                className={`flex items-center rounded-xl text-sm font-semibold transition-all ${
                  isCollapsed ? 'justify-center py-2.5 px-2' : 'gap-3.5 px-3.5 py-2.5'
                } ${
                  active
                    ? 'bg-[#154E3F] text-white shadow-sm font-bold'
                    : 'text-[#8DB4A8] hover:text-white hover:bg-[#0D3F33]'
                }`}
              >
                <Icon size={19} className={`flex-shrink-0 ${active ? 'text-white' : 'text-[#8DB4A8]'}`} />
                {!isCollapsed && <span className="truncate">{label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Resources Header / Divider */}
        {isCollapsed ? (
          <div className="w-8 mx-auto my-3 border-t border-[#165545]/80" />
        ) : (
          <div className="px-3.5 mb-2 animate-in fade-in duration-200">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#4E8071]">
              RESOURCES
            </span>
          </div>
        )}

        {/* Resources Navigation List */}
        <nav className="space-y-1.5">
          {resourceNavItems.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            const label = isRw ? item.label_rw : item.label_en;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                title={isCollapsed ? label : undefined}
                className={`flex items-center rounded-xl text-sm font-semibold transition-all ${
                  isCollapsed ? 'justify-center py-2.5 px-2' : 'gap-3.5 px-3.5 py-2.5'
                } ${
                  active
                    ? 'bg-[#154E3F] text-white shadow-sm font-bold'
                    : 'text-[#8DB4A8] hover:text-white hover:bg-[#0D3F33]'
                }`}
              >
                <Icon size={19} className={`flex-shrink-0 ${active ? 'text-white' : 'text-[#8DB4A8]'}`} />
                {!isCollapsed && <span className="truncate">{label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Encouragement Card ("You are not alone.") */}
      {isCollapsed ? (
        <div 
          className="mt-6 flex items-center justify-center p-2 rounded-2xl bg-[#0D3F33]/90 border border-[#165545] text-[#21B48D] cursor-pointer"
          title={isRw ? 'Ntabwo uri wenyine.' : 'You are not alone.'}
        >
          <Shield size={18} className="fill-current text-[#21B48D]" />
        </div>
      ) : (
        <div className="mt-8 bg-[#0D3F33]/90 border border-[#165545] rounded-2xl p-4 text-left animate-in fade-in duration-200">
          <div className="w-7 h-7 rounded-full bg-[#185545] flex items-center justify-center text-[#21B48D] mb-2.5">
            <Shield size={14} className="fill-current text-[#21B48D]" />
          </div>
          <h4 className="text-xs sm:text-sm font-extrabold text-white leading-tight">
            {isRw ? 'Ntabwo uri wenyine.' : 'You are not alone.'}
          </h4>
          <p className="text-[11px] text-[#78A99B] leading-relaxed mt-1 font-normal">
            {isRw
              ? 'Turi hano kugira ngo tugufashe kugarura umutuzo mu muryango.'
              : "We're here to support your mental well-being."}
          </p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
