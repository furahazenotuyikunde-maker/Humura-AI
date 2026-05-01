import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, User, Languages, Bell, Eye, Type, Contrast, 
  Mic, FileText, Shield, ChevronRight, Check, Info, X, LogOut, Loader2
} from 'lucide-react';

type TextSize = 'sm' | 'md' | 'lg' | 'xl';

interface SettingsState {
  screenReader: boolean;
  textSize: TextSize;
  highContrast: boolean;
  voiceNav: boolean;
  notifications: boolean;
}

export default function SettingsPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRw = i18n.language?.startsWith('rw');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Professional specific state
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setSpecialty(data.specialty || '');
        setLocation(data.location || '');
      }
    }
  };

  const updateProfessionalProfile = async () => {
    setUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ specialty, location })
        .eq('id', user.id);

      if (error) throw error;
      alert(isRw ? 'Umwirondoro wavuguruwe!' : 'Professional profile updated!');
      fetchProfile();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const [settings, setSettings] = useState<SettingsState>(() => {
    const saved = localStorage.getItem('Humura_settings_v2');
    return saved ? JSON.parse(saved) : {
      screenReader: false,
      textSize: 'md',
      highContrast: false,
      voiceNav: false,
      notifications: true
    };
  });

  // Sync settings with UI classes and LocalStorage
  useEffect(() => {
    localStorage.setItem('Humura_settings_v2', JSON.stringify(settings));
    
    // High Contrast
    document.documentElement.classList.toggle('high-contrast', settings.highContrast);
    
    // Text Size
    const sizeClasses = ['text-sm', 'text-md', 'text-lg', 'text-xl'];
    document.documentElement.classList.remove(...sizeClasses);
    document.documentElement.classList.add(`text-${settings.textSize}`);
  }, [settings]);

  const toggle = (key: keyof SettingsState) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setTextSize = (size: TextSize) => {
    setSettings(prev => ({ ...prev, textSize: size }));
  };

  const handleSafetyExit = () => {
    // Immediate redirect to Google for safety
    window.location.replace('https://www.google.com');
  };

  return (
    <div className="min-h-screen bg-white text-black pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-10">
        {/* Header */}
        <header className="flex items-center gap-3">
          <div className="p-2 bg-black text-white rounded-xl">
            <Settings size={28} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            {isRw ? 'Igenamiterere' : 'Settings'}
          </h1>
        </header>

        {/* 1. Profile Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-black pb-2">
            <User size={20} />
            <h2 className="text-lg font-black uppercase">
              {isRw ? 'Umwirondoro' : 'Profile'}
            </h2>
          </div>
          <div className="flex items-center justify-between p-5 border-2 border-black rounded-2xl bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center text-xl font-black">
                {profile?.full_name?.charAt(0) || 'H'}
              </div>
              <div>
                <p className="font-black text-lg">{profile?.full_name || 'Humura User'}</p>
                <p className="text-sm font-medium">
                  {profile?.role === 'doctor' ? (isRw ? 'Inzobere mu Buzima' : 'Clinical Professional') : (isRw ? 'Umurwayi' : 'Patient User')}
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                if (!profile) navigate('/auth');
              }}
              className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors" 
              aria-label="View profile"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </section>

        {/* Professional Profile Settings (Conditional) */}
        {profile?.role === 'doctor' && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 border-b-2 border-black pb-2">
              <Settings size={20} className="text-primary" />
              <h2 className="text-lg font-black uppercase text-primary">
                {isRw ? 'Umwirondoro w\'Akazi' : 'Professional Profile'}
              </h2>
            </div>
            <div className="p-6 border-2 border-black rounded-2xl bg-primary-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">{isRw ? 'Inzobere muri' : 'Specialty / Title'}</label>
                <input 
                  type="text" 
                  value={specialty}
                  onChange={e => setSpecialty(e.target.value)}
                  placeholder="e.g. Clinical Psychologist"
                  className="w-full p-4 rounded-xl border-2 border-black font-bold outline-none focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">{isRw ? 'Aho ukorera' : 'Location'}</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Kigali, Kacyiru"
                  className="w-full p-4 rounded-xl border-2 border-black font-bold outline-none focus:bg-white transition-all"
                />
              </div>
              <button 
                onClick={updateProfessionalProfile}
                disabled={updating}
                className="w-full py-4 bg-black text-white font-black rounded-xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
              >
                {updating ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                {isRw ? 'Bika impinduka' : 'Save Professional Info'}
              </button>
            </div>
          </section>
        )}

        {/* 2. Language Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-black pb-2">
            <Languages size={20} />
            <h2 className="text-lg font-black uppercase">
              {isRw ? 'Ururimi' : 'Language'}
            </h2>
          </div>
          <div className="border-2 border-black rounded-2xl overflow-hidden bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {[
              { id: 'en', label: 'English', sub: 'Default' },
              { id: 'rw', label: 'Kinyarwanda', sub: 'Ikinyarwanda' }
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => i18n.changeLanguage(lang.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-neutral-100 transition-colors border-b-2 border-black last:border-0"
                aria-label={`Change language to ${lang.label}`}
              >
                <div className="text-left">
                  <p className="font-black text-lg">{lang.label}</p>
                  <p className="text-sm font-medium">{lang.sub}</p>
                </div>
                {i18n.language?.startsWith(lang.id) && (
                  <div className="bg-black text-white p-1 rounded-full">
                    <Check size={20} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* 3. Notifications Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-black pb-2">
            <Bell size={20} />
            <h2 className="text-lg font-black uppercase">
              {isRw ? 'Imenyesha' : 'Notifications'}
            </h2>
          </div>
          <div className="p-5 border-2 border-black rounded-2xl bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between min-h-[80px]">
            <div>
              <p className="font-black text-lg">{isRw ? "Imenyesha ry'izahabu" : 'Push Notifications'}</p>
              <p className="text-sm font-medium">{isRw ? "Amakuru n'ubutumwa bushya" : 'Stay updated with new support'}</p>
            </div>
            <button
              onClick={() => toggle('notifications')}
              className={`w-16 h-9 rounded-full transition-all relative border-2 border-black ${settings.notifications ? 'bg-black' : 'bg-white'}`}
              aria-checked={settings.notifications}
              role="switch"
              aria-label="Toggle notifications"
            >
              <div className={`absolute top-0.5 w-7 h-7 rounded-full shadow-sm transition-transform ${settings.notifications ? 'translate-x-7 bg-white' : 'translate-x-0.5 bg-black'}`} />
            </button>
          </div>
        </section>

        {/* 4. Accessibility Section - CORE */}
        <section className="space-y-4" id="accessibility-section">
          <div className="flex items-center gap-2 border-b-4 border-black pb-2">
            <Eye size={24} />
            <h2 className="text-xl font-black uppercase tracking-tight">
              {isRw ? 'Ubugari bwo Gukoresha' : 'Accessibility'}
            </h2>
          </div>
          
          <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {/* 1. Screen Reader */}
            <div className="p-6 flex items-center justify-between border-b-2 border-black min-h-[88px]">
              <div className="flex-1 pr-4">
                <p className="text-lg font-black">{isRw ? 'Soma Ibiherereye' : 'Screen Reader'}</p>
                <p className="text-sm font-medium text-neutral-600">{isRw ? 'Byahujwe na TalkBack na VoiceOver' : 'Optimized for TalkBack and VoiceOver'}</p>
              </div>
              <button
                onClick={() => toggle('screenReader')}
                className={`w-16 h-9 rounded-full transition-all relative border-2 border-black ${settings.screenReader ? 'bg-black' : 'bg-white'}`}
                aria-checked={settings.screenReader}
                role="switch"
                aria-label={isRw ? "Fungura soma-biherereye" : "Toggle screen reader optimization"}
              >
                <div className={`absolute top-0.5 w-7 h-7 rounded-full transition-transform ${settings.screenReader ? 'translate-x-7 bg-white' : 'translate-x-0.5 bg-black'}`} />
              </button>
            </div>

            {/* 2. Text Size */}
            <div className="p-6 border-b-2 border-black">
              <div className="mb-4">
                <p className="text-lg font-black">{isRw ? 'Ingano y\'Inyandiko' : 'Text Size'}</p>
                <p className="text-sm font-medium text-neutral-600">{isRw ? 'Hindura ingano y\'inyandiko mu porogaramu yose' : 'Change applies across the entire app'}</p>
              </div>
              <div className="flex bg-neutral-100 p-1 rounded-xl border-2 border-black">
                {(['sm', 'md', 'lg', 'xl'] as TextSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setTextSize(size)}
                    className={`flex-1 py-3 rounded-lg text-sm font-black transition-all min-h-[48px] ${
                      settings.textSize === size 
                        ? 'bg-black text-white shadow-md' 
                        : 'text-black hover:bg-neutral-200'
                    }`}
                    aria-label={`Set text size to ${size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : size === 'lg' ? 'Large' : 'Extra Large'}`}
                  >
                    {size.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. High Contrast Mode */}
            <div className="p-6 flex items-center justify-between border-b-2 border-black min-h-[88px]">
              <div className="flex-1 pr-4">
                <p className="text-lg font-black">{isRw ? 'Ibara Rikomeye' : 'High Contrast Mode'}</p>
                <p className="text-sm font-medium text-neutral-600">{isRw ? 'Koresha umukara n\'umweru gusa' : 'Switches the full app UI to black and white theme'}</p>
              </div>
              <button
                onClick={() => toggle('highContrast')}
                className={`w-16 h-9 rounded-full transition-all relative border-2 border-black ${settings.highContrast ? 'bg-black' : 'bg-white'}`}
                aria-checked={settings.highContrast}
                role="switch"
                aria-label={isRw ? "Ibara rikomeye" : "Toggle high contrast mode"}
              >
                <div className={`absolute top-0.5 w-7 h-7 rounded-full transition-transform ${settings.highContrast ? 'translate-x-7 bg-white' : 'translate-x-0.5 bg-black'}`} />
              </button>
            </div>

            {/* 4. Voice Navigation */}
            <div className="p-6 flex items-center justify-between border-b-2 border-black min-h-[88px]">
              <div className="flex-1 pr-4">
                <p className="text-lg font-black">{isRw ? 'Kuyobora n\'Ijwi' : 'Voice Navigation'}</p>
                <p className="text-sm font-medium text-neutral-600">{isRw ? 'Koresha ijwi mu gukoresha porogaramu' : 'Navigate the app using voice commands'}</p>
              </div>
              <button
                onClick={() => toggle('voiceNav')}
                className={`w-16 h-9 rounded-full transition-all relative border-2 border-black ${settings.voiceNav ? 'bg-black' : 'bg-white'}`}
                aria-checked={settings.voiceNav}
                role="switch"
                aria-label={isRw ? "Kuyobora n'ijwi" : "Toggle voice navigation"}
              >
                <div className={`absolute top-0.5 w-7 h-7 rounded-full transition-transform ${settings.voiceNav ? 'translate-x-7 bg-white' : 'translate-x-0.5 bg-black'}`} />
              </button>
            </div>

            {/* 5. Braille Shortcut */}
            <button
              onClick={() => navigate('/braille')}
              className="w-full p-6 flex items-center justify-between hover:bg-neutral-100 transition-colors group min-h-[88px]"
              aria-label={isRw ? "Jya kuri Inyandiko z'abafite ubumuga bwo kutabona" : "Go to Braille Document Generator"}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText size={24} />
                </div>
                <div className="text-left">
                  <p className="text-lg font-black">{isRw ? "Inyandiko z'abafite ubumuga bwo kutabona" : 'Braille Document Generator'}</p>
                  <p className="text-sm font-medium text-neutral-600">{isRw ? "Hindura inyandiko mu buryo bw'abafite ubumuga bwo kutabona" : 'Shortcut to the Braille Generator page'}</p>
                </div>
              </div>
              <ChevronRight size={28} />
            </button>
          </div>
        </section>

        {/* 5. Privacy & Security */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-black pb-2">
            <Shield size={20} />
            <h2 className="text-lg font-black uppercase">
              {isRw ? 'Umutekano' : 'Privacy & Security'}
            </h2>
          </div>
          <div className="border-2 border-black rounded-2xl overflow-hidden bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <button
              onClick={() => {
                if (window.confirm(isRw ? 'Ushaka gusiba amateka yose?' : 'Are you sure you want to clear all history?')) {
                  localStorage.removeItem('Humura_chat_sessions');
                  alert(isRw ? 'Mateka yasibwe!' : 'History cleared!');
                  window.location.reload();
                }
              }}
              className="w-full flex items-center justify-between p-6 hover:bg-red-50 transition-colors text-left"
            >
              <div>
                <p className="font-black text-red-600 text-lg">{isRw ? 'Siba ibyabitswe' : 'Clear Chat History'}</p>
                <p className="text-sm font-medium text-neutral-500">{isRw ? 'Siba amateka y\'ibiganiro byose' : 'Permanently delete all sessions'}</p>
              </div>
              <Shield size={24} className="text-red-600" />
            </button>
          </div>
        </section>

        {/* 6. Safety Exit Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-red-600 pb-2">
            <LogOut size={20} className="text-red-600" />
            <h2 className="text-lg font-black uppercase text-red-600">
              {isRw ? 'Sohoka Vuba' : 'Safety Exit'}
            </h2>
          </div>
          <button
            onClick={handleSafetyExit}
            className="w-full flex items-center justify-between p-6 border-2 border-red-600 rounded-2xl bg-red-600 text-white shadow-[4px_4px_0px_0px_rgba(153,27,27,1)] active:scale-[0.98] transition-all"
            aria-label={isRw ? "Sohoka kuri porogaramu vuba" : "Immediate exit to Google"}
          >
            <div className="text-left">
              <p className="font-black text-xl">{isRw ? 'Sohoka mu masegonda' : 'Exit Immediately'}</p>
              <p className="text-sm font-bold opacity-90">{isRw ? 'Guhagarika porogaramu vuba' : 'Instantly switches to Google'}</p>
            </div>
            <X size={28} className="text-white" />
          </button>
        </section>

        {/* Offline Info */}
        <div className="flex items-start gap-4 p-6 border-2 border-black rounded-2xl bg-neutral-50 shadow-inner">
          <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center flex-shrink-0">
            <Info size={20} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-1">Humura AI v2.1</p>
            <p className="text-sm font-medium leading-relaxed">
              {isRw
                ? 'Igenamiterere ryawe ribikwa kuri iyi foni gusa. Nta murandasi ukenewe kandi nta makuru y\'umwirondoro ajya hanze.'
                : 'All settings work offline and are stored locally. No personal data is ever collected or transmitted.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


