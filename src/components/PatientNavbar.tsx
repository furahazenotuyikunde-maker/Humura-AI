import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Settings, 
  Home, 
  LogOut, 
  Menu, 
  ChevronDown, 
  ShieldAlert, 
  Languages, 
  PhoneCall
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface PatientNavbarProps {
  onOpenMobileDrawer?: () => void;
  user?: any;
}

export const PatientNavbar: React.FC<PatientNavbarProps> = ({ 
  onOpenMobileDrawer, 
  user: propUser 
}) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isRw = i18n.language?.startsWith('rw');

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // User & Profile State
  const [currentUser, setCurrentUser] = useState<any>(propUser || null);
  const [profile, setProfile] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('humura_profile_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (propUser) {
      setCurrentUser(propUser);
    } else {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) setCurrentUser(user);
      });
    }

    // Refresh profile details
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from('profiles')
          .select('id, full_name, role, avatar_url')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              setProfile(data);
            }
          });
      }
    });
  }, [propUser]);

  // Click outside and escape key listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  // Logout action
  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('Humura_settings_v2');
      localStorage.removeItem('humura_profile_cache');
      window.location.href = '/welcome';
    } catch (err) {
      window.location.href = '/welcome';
    }
  };

  const handleNavigate = (path: string) => {
    setDropdownOpen(false);
    navigate(path);
  };

  const toggleLanguage = () => {
    const nextLang = isRw ? 'en' : 'rw';
    i18n.changeLanguage(nextLang);
  };

  // Determine user display name and initials
  const rawName = profile?.full_name || profile?.fullName || currentUser?.email?.split('@')[0] || '';
  const displayName = rawName || (isRw ? 'Umukoresha' : 'Member');
  const userInitials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  // Get current page label for top breadcrumb
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return isRw ? 'Urubuga rw’Ubufasha' : 'Care Dashboard';
    if (path.includes('/chat')) return isRw ? 'Ikiganiro na AI' : 'AI Companion';
    if (path.includes('/education')) return isRw ? 'Inyigisho z’Ubuzima' : 'Education Hub';
    if (path.includes('/meet-professional')) return isRw ? 'Gana Inzobere' : 'Consultations';
    if (path.includes('/sign-language')) return isRw ? 'Ururimi rw’Amarenga' : 'Sign Language';
    if (path.includes('/braille')) return isRw ? 'Inyandiko za Braille' : 'Braille Hub';
    if (path.includes('/community')) return isRw ? 'Umuryango' : 'Community';
    if (path.includes('/progress')) return isRw ? 'Iterambere ryawe' : 'My Progress';
    if (path.includes('/settings')) return isRw ? 'Igenamiterere' : 'Settings & Profile';
    if (path.includes('/emergency')) return isRw ? 'Ubutabazi Bwihuse' : 'Emergency Hotlines';
    return isRw ? 'Humura AI' : 'Humura AI';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DFEBE5] transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left Section: Mobile Hamburger + Breadcrumb / Logo */}
        <div className="flex items-center gap-3">
          {/* Mobile Drawer Toggle */}
          <button
            type="button"
            onClick={onOpenMobileDrawer}
            className="md:hidden p-2 rounded-xl text-[#08352A] hover:bg-[#F4F8F6] border border-[#DFEBE5] transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>

          {/* Mobile Brand Link */}
          <div 
            onClick={() => navigate('/patient/dashboard')} 
            className="md:hidden flex items-center gap-2 cursor-pointer"
          >
            <img src="/fixedLogo.png" alt="Humura AI" className="h-7 w-auto object-contain" />
            <span className="font-extrabold text-sm text-[#08352A]">Humura AI</span>
          </div>

          {/* Desktop Breadcrumb / Page Title */}
          <div className="hidden md:flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#21B48D] animate-pulse" />
            <span className="text-xs font-black text-[#5E8E81] uppercase tracking-wider">
              {isRw ? 'Urubuga rw’Umurwayi' : 'Patient Portal'}
            </span>
            <span className="text-[#C5DCD3] text-sm">/</span>
            <h2 className="text-sm font-extrabold text-[#08352A]">
              {getPageTitle()}
            </h2>
          </div>
        </div>

        {/* Right Section: Language Toggle, Emergency SOS & Profile Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Emergency SOS Shortcut (Subtle pill) */}
          <button
            onClick={() => navigate('/patient/emergency')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all shadow-2xs"
            title={isRw ? 'Umurongo w’ubutabazi bwihuse: 114' : 'Emergency Hotline: 114'}
          >
            <ShieldAlert size={14} className="text-red-600" />
            <span>SOS 114</span>
          </button>

          {/* Language Toggle Pill */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 rounded-xl border border-[#DFEBE5] hover:border-[#21B48D] text-xs font-extrabold text-[#08352A] hover:bg-[#F4F8F6] transition-all flex items-center gap-1.5 shadow-2xs"
            title={isRw ? 'Hindura ururimi mu Cyongereza' : 'Switch language to Kinyarwanda'}
          >
            <Languages size={14} className="text-[#21B48D]" />
            <span className="text-[11px] uppercase tracking-wider">{isRw ? 'RW' : 'EN'}</span>
          </button>

          {/* ── PROFILE ICON ON TOP RIGHT CORNER (WITH DROPDOWN) ── */}
          <div ref={dropdownRef} className="relative">
            <button
              id="patient-profile-dropdown-btn"
              type="button"
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 p-1 sm:pl-1.5 sm:pr-3 sm:py-1 rounded-full bg-white border border-[#DFEBE5] hover:border-[#21B48D] transition-all shadow-2xs hover:shadow-xs group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#21B48D]/30"
              aria-label="User profile menu"
              aria-expanded={dropdownOpen}
            >
              {/* Profile Avatar Icon with Status Indicator */}
              <div className="w-8 h-8 rounded-full bg-[#08352A] text-white flex items-center justify-center font-black text-xs relative shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                {userInitials}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#21B48D] border-2 border-white rounded-full" />
              </div>

              {/* Display Name (Desktop) */}
              <span className="hidden sm:inline-block text-xs font-bold text-[#08352A] max-w-[120px] truncate">
                {displayName}
              </span>

              {/* Dropdown Chevron */}
              <ChevronDown 
                size={14} 
                className={`text-[#5E8E81] transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-[#21B48D]' : ''}`} 
              />
            </button>

            {/* ── DROPDOWN OPTIONS MENU ── */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-[#DFEBE5] py-2 z-50 text-[#08352A] font-poppins"
                >
                  {/* User Profile Header Card */}
                  <div className="px-4 py-3 border-b border-[#F0F5F2] flex items-center gap-3 bg-[#FAFDFB] rounded-t-2xl">
                    <div className="w-10 h-10 rounded-xl bg-[#08352A] text-white font-black flex items-center justify-center text-sm shrink-0 shadow-xs">
                      {userInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-[#08352A] truncate leading-tight">
                        {displayName}
                      </p>
                      <p className="text-[10px] text-[#5E8E81] truncate mt-0.5 font-medium">
                        {currentUser?.email || 'Confidential Member'}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#EAF5F0] text-[#1B7E64] uppercase tracking-wide border border-[#CDE5DA]">
                        {isRw ? 'Umurwayi • Humura' : 'Patient Account'}
                      </span>
                    </div>
                  </div>

                  {/* Primary Nav Options */}
                  <div className="py-1 px-1.5 space-y-0.5">
                    
                    {/* 1. Profile */}
                    <button
                      type="button"
                      onClick={() => handleNavigate('/patient/settings')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#08352A] hover:bg-[#F4F8F6] hover:text-[#21B48D] transition-colors text-left cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#EAF5F0] text-[#21B48D] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <User size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span>{isRw ? 'Umwirondoro' : 'Profile'}</span>
                      </div>
                    </button>

                    {/* 2. Settings */}
                    <button
                      type="button"
                      onClick={() => handleNavigate('/patient/settings')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#08352A] hover:bg-[#F4F8F6] hover:text-[#21B48D] transition-colors text-left cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#EAF5F0] text-[#21B48D] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Settings size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span>{isRw ? 'Igenamiterere' : 'Settings'}</span>
                      </div>
                    </button>

                    {/* 3. Home page (takes him on landing page) */}
                    <button
                      type="button"
                      onClick={() => handleNavigate('/welcome')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#08352A] hover:bg-[#F4F8F6] hover:text-[#21B48D] transition-colors text-left cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#EAF5F0] text-[#21B48D] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Home size={15} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span>{isRw ? 'Ahabanza' : 'Home Page'}</span>
                        <span className="text-[10px] text-[#5E8E81] font-normal">
                          {isRw ? 'Urupapuro rw’ibanze' : 'Landing page'}
                        </span>
                      </div>
                    </button>

                  </div>

                  {/* ── SMALL HORIZONTAL RED LINE ── */}
                  <div className="mx-3 my-1.5 border-t border-red-500/40" />

                  {/* 4. Logout (under small horizontal red line) */}
                  <div className="px-1.5 pt-0.5 pb-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <LogOut size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span>{isRw ? 'Gusohoka muri Konti' : 'Logout'}</span>
                      </div>
                    </button>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </header>
  );
};

export default PatientNavbar;
