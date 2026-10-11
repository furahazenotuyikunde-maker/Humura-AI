import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Users,
  Calendar,
  AlertCircle,
  BarChart2,
  Video,
  FileText,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Stethoscope,
  LogOut,
  Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface ProfessionalSidebarProps {
  className?: string;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  patientsCount?: number;
  unreadAlertsCount?: number;
}

export const ProfessionalSidebar: React.FC<ProfessionalSidebarProps> = ({ 
  className = '', 
  onClose,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  patientsCount = 0,
  unreadAlertsCount = 0
}) => {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const location = useLocation();
  const navigate = useNavigate();

  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('humura_pro_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(prev => {
        const next = !prev;
        try {
          localStorage.setItem('humura_pro_sidebar_collapsed', String(next));
        } catch {}
        return next;
      });
    }
  };

  const navItems = [
    {
      to: '/professional/dashboard',
      icon: Activity,
      label_en: 'Overview',
      label_rw: 'Inshamake',
      isActive: (pathname: string) => pathname === '/professional/dashboard' || pathname === '/professional'
    },
    {
      to: '/professional/patients',
      icon: Users,
      label_en: 'Caseload',
      label_rw: 'Abarwayi',
      count: patientsCount,
      isActive: (pathname: string) => pathname.startsWith('/professional/patients')
    },
    {
      to: '/professional/sessions',
      icon: Calendar,
      label_en: 'Sessions',
      label_rw: 'Guhura',
      isActive: (pathname: string) => pathname.startsWith('/professional/sessions')
    },
    {
      to: '/professional/alerts',
      icon: AlertCircle,
      label_en: 'Alerts & AI Tasks',
      label_rw: 'Ibitabaza na AI',
      count: unreadAlertsCount,
      danger: unreadAlertsCount > 0,
      isActive: (pathname: string) => pathname.startsWith('/professional/alerts')
    },
    {
      to: '/professional/analytics',
      icon: BarChart2,
      label_en: 'Analytics',
      label_rw: 'Isesengura',
      isActive: (pathname: string) => pathname.startsWith('/professional/analytics')
    },
    {
      to: '/professional/videos',
      icon: Video,
      label_en: 'Video Library',
      label_rw: 'Amashusho',
      isActive: (pathname: string) => pathname.startsWith('/professional/videos')
    },
    {
      to: '/professional/braille',
      icon: FileText,
      label_en: 'Braille Tool',
      label_rw: 'Inyuguti za Braille',
      isActive: (pathname: string) => pathname.startsWith('/professional/braille')
    },
    {
      to: '/professional/settings',
      icon: Settings,
      label_en: 'Settings',
      label_rw: 'Igenamiterere',
      isActive: (pathname: string) => pathname.startsWith('/professional/settings')
    }
  ];

  return (
    <aside 
      className={`h-full bg-[#08352A] text-white flex flex-col justify-between py-6 px-3.5 transition-all duration-300 select-none ${className} ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-8 px-2.5">
          <div 
            onClick={() => {
              navigate('/professional/dashboard');
              if (onClose) onClose();
            }}
            className="flex items-center gap-3 cursor-pointer group min-w-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#154E3F] text-white flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-105 transition-transform border border-[#21B48D]/30 shadow-xs">
              <Stethoscope size={20} className="text-[#21B48D]" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-white truncate leading-tight">
                  Humura Pro
                </span>
                <span className="text-[10px] font-bold text-[#21B48D] uppercase tracking-wider">
                  {isRw ? 'Ubuvuzi bwo mu mutwe' : 'Clinical Suite'}
                </span>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-[#154E3F] transition-colors"
              aria-label="Close Sidebar"
            >
              <X size={18} />
            </button>
          )}

          {/* Desktop Collapse Toggle */}
          {!onClose && (
            <button
              onClick={handleToggle}
              className="hidden md:flex p-1.5 rounded-xl text-[#78A498] hover:text-white hover:bg-[#154E3F] transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const active = item.isActive(location.pathname);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all group relative ${
                  active
                    ? 'bg-[#21B48D] text-white shadow-sm'
                    : 'text-[#C5DCD3] hover:text-white hover:bg-[#154E3F]/60'
                }`}
                title={isCollapsed ? (isRw ? item.label_rw : item.label_en) : undefined}
              >
                <item.icon 
                  size={18} 
                  className={`shrink-0 transition-transform group-hover:scale-110 ${
                    active ? 'text-white' : 'text-[#8DB8AA]'
                  }`} 
                />
                
                {!isCollapsed && (
                  <span className="flex-1 truncate">
                    {isRw ? item.label_rw : item.label_en}
                  </span>
                )}

                {/* Badge Counters */}
                {item.count !== undefined && item.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                    item.danger 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : (active ? 'bg-white text-[#08352A]' : 'bg-[#154E3F] text-[#21B48D]')
                  }`}>
                    {item.count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Info */}
      <div className="pt-4 border-t border-[#154E3F]/50 px-1">
        {!isCollapsed ? (
          <div className="p-3 rounded-2xl bg-[#0D3F33] border border-[#195949] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#21B48D] animate-ping" />
              <span className="text-[11px] font-bold text-[#C5DCD3]">
                {isRw ? 'Ibiro Byemejwe' : 'Verified Clinical Portal'}
              </span>
            </div>
            <Shield size={14} className="text-[#21B48D]" />
          </div>
        ) : (
          <div className="flex justify-center" title="HIPAA-Aligned & Secure">
            <Shield size={16} className="text-[#21B48D]" />
          </div>
        )}
      </div>
    </aside>
  );
};

export default ProfessionalSidebar;
