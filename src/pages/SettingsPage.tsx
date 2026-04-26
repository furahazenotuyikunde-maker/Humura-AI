import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, User, Languages, Bell, Eye, Type, Contrast, 
  Mic, FileText, Shield, ChevronRight, Check, Info
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

  // Sync settings with UI classes
  useEffect(() => {
    localStorage.setItem('Humura_settings_v2', JSON.stringify(settings));
    
    // High Contrast
    document.documentElement.classList.toggle('high-contrast', settings.highContrast);
    
    // Text Size
    document.documentElement.classList.remove('text-sm', 'text-md', 'text-lg', 'text-xl');
    document.documentElement.classList.add(`text-${settings.textSize}`);
  }, [settings]);

  const toggle = (key: keyof SettingsState) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setTextSize = (size: TextSize) => {
    setSettings(prev => ({ ...prev, textSize: size }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20 px-4">
      {/* Header */}
      <header className="flex items-center gap-3 pt-4">
        <Settings className="text-primary" size={32} />
        <h1 className="text-3xl font-black text-primary-900 tracking-tight">
          {isRw ? 'Igenamiterere' : 'Settings'}
        </h1>
      </header>

      {/* 1. Profile Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <User size={18} className="text-neutral-400" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
            {isRw ? 'Umwirondoro' : 'Profile'}
          </h2>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-primary-50 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary text-xl font-bold">
              H
            </div>
            <div>
              <p className="font-bold text-primary-900">Humura User</p>
              <p className="text-xs text-neutral-400">{isRw ? 'Nta konti ikenewe' : 'No account needed'}</p>
            </div>
          </div>
          <button className="p-2 text-primary hover:bg-primary-50 rounded-xl transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* 2. Language Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Languages size={18} className="text-neutral-400" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
            {isRw ? 'Ururimi' : 'Language'}
          </h2>
        </div>
        <div className="bg-white rounded-3xl overflow-hidden border border-primary-50 shadow-sm">
          {[
            { id: 'en', label: 'English', sub: 'Default' },
            { id: 'rw', label: 'Kinyarwanda', sub: 'Ikinyarwanda' }
          ].map((lang) => (
            <button
              key={lang.id}
              onClick={() => i18n.changeLanguage(lang.id)}
              className="w-full flex items-center justify-between p-5 hover:bg-primary-50 transition-colors border-b border-primary-50 last:border-0"
              aria-label={`Change language to ${lang.label}`}
            >
              <div className="text-left">
                <p className="font-bold text-primary-900">{lang.label}</p>
                <p className="text-xs text-neutral-400">{lang.sub}</p>
              </div>
              {i18n.language?.startsWith(lang.id) && (
                <Check size={20} className="text-primary" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Notifications Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Bell size={18} className="text-neutral-400" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
            {isRw ? 'Imenyesha' : 'Notifications'}
          </h2>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-primary-50 shadow-sm flex items-center justify-between min-h-[72px]">
          <div>
            <p className="font-bold text-primary-900">{isRw ? 'Imenyesha ry\'izahabu' : 'Push Notifications'}</p>
            <p className="text-xs text-neutral-400">{isRw ? 'Amakuru n\'ubutumwa bushya' : 'Stay updated with new support'}</p>
          </div>
          <button
            onClick={() => toggle('notifications')}
            className={`w-14 h-8 rounded-full transition-all relative ${settings.notifications ? 'bg-primary shadow-inner' : 'bg-neutral-200'}`}
            aria-checked={settings.notifications}
            role="switch"
            aria-label="Toggle notifications"
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${settings.notifications ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>
      </section>

      {/* 4. Accessibility Section - CORE */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Eye size={18} className="text-primary" />
          <h2 className="text-sm font-black uppercase tracking-widest text-primary-900">
            {isRw ? 'Ubugari bwo Gukoresha' : 'Accessibility'}
          </h2>
        </div>
        
        <div className="bg-white rounded-[2rem] border-2 border-primary-100 overflow-hidden shadow-xl">
          {/* Screen Reader */}
          <div className="p-5 flex items-center justify-between border-b border-primary-50 min-h-[80px]">
            <div className="flex-1 pr-4">
              <p className="font-black text-primary-900">{isRw ? 'Soma Ibiherereye' : 'Screen Reader'}</p>
              <p className="text-xs text-neutral-500 font-medium">{isRw ? 'Byahujwe na TalkBack na VoiceOver' : 'Optimized for TalkBack and VoiceOver'}</p>
            </div>
            <button
              onClick={() => toggle('screenReader')}
              className={`w-14 h-8 rounded-full transition-all relative ${settings.screenReader ? 'bg-primary shadow-inner' : 'bg-neutral-200'}`}
              aria-checked={settings.screenReader}
              role="switch"
              aria-label="Toggle screen reader optimization"
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${settings.screenReader ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Text Size */}
          <div className="p-5 border-b border-primary-50">
            <div className="mb-4">
              <p className="font-black text-primary-900">{isRw ? 'Ingano y\'Inyandiko' : 'Text Size'}</p>
              <p className="text-xs text-neutral-500 font-medium">{isRw ? 'Hindura ingano y\'inyandiko mu porogaramu yose' : 'Change applies across the entire app'}</p>
            </div>
            <div className="flex bg-primary-50 p-1 rounded-2xl">
              {(['sm', 'md', 'lg', 'xl'] as TextSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setTextSize(size)}
                  className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${
                    settings.textSize === size 
                      ? 'bg-white text-primary shadow-md' 
                      : 'text-primary-400 hover:text-primary-600'
                  }`}
                  aria-label={`Set text size to ${size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : size === 'lg' ? 'Large' : 'Extra Large'}`}
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* High Contrast Mode */}
          <div className="p-5 flex items-center justify-between border-b border-primary-50 min-h-[80px]">
            <div className="flex-1 pr-4">
              <p className="font-black text-primary-900">{isRw ? 'Ibara Rikomeye' : 'High Contrast Mode'}</p>
              <p className="text-xs text-neutral-500 font-medium">{isRw ? 'Koresha umukara n\'umweru gusa' : 'Switches the full app UI to black & white'}</p>
            </div>
            <button
              onClick={() => toggle('highContrast')}
              className={`w-14 h-8 rounded-full transition-all relative ${settings.highContrast ? 'bg-primary shadow-inner' : 'bg-neutral-200'}`}
              aria-checked={settings.highContrast}
              role="switch"
              aria-label="Toggle high contrast mode"
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${settings.highContrast ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Voice Navigation */}
          <div className="p-5 flex items-center justify-between border-b border-primary-50 min-h-[80px]">
            <div className="flex-1 pr-4">
              <p className="font-black text-primary-900">{isRw ? 'Kuyobora n\'Ijwi' : 'Voice Navigation'}</p>
              <p className="text-xs text-neutral-500 font-medium">{isRw ? 'Koresha ijwi mu gukoresha porogaramu' : 'Navigate the app using voice commands'}</p>
            </div>
            <button
              onClick={() => toggle('voiceNav')}
              className={`w-14 h-8 rounded-full transition-all relative ${settings.voiceNav ? 'bg-primary shadow-inner' : 'bg-neutral-200'}`}
              aria-checked={settings.voiceNav}
              role="switch"
              aria-label="Toggle voice navigation"
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${settings.voiceNav ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Braille Shortcut */}
          <button
            onClick={() => navigate('/braille')}
            className="w-full p-5 flex items-center justify-between hover:bg-primary-50 transition-colors group"
            aria-label="Go to Braille Document Generator"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shadow-inner">
                <FileText size={24} />
              </div>
              <div className="text-left">
                <p className="font-black text-primary-900">{isRw ? 'Inyandiko z’Impumyi' : 'Braille Document Generator'}</p>
                <p className="text-xs text-neutral-500 font-medium">{isRw ? 'Hindura inyandiko mu buhumyi' : 'Convert and print Grade 1 Braille'}</p>
              </div>
            </div>
            <ChevronRight size={24} className="text-neutral-300 group-hover:text-primary transition-colors" />
          </button>
        </div>
      </section>

      {/* 5. Privacy & Security */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Shield size={18} className="text-neutral-400" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
            {isRw ? 'Umutekano' : 'Privacy & Security'}
          </h2>
        </div>
        <div className="bg-white rounded-3xl overflow-hidden border border-primary-50 shadow-sm">
          <button
            onClick={() => {
              if (window.confirm(isRw ? 'Ushaka gusiba amateka yose?' : 'Are you sure you want to clear all history?')) {
                localStorage.removeItem('Humura_chat_sessions');
                alert(isRw ? 'Mateka yasibwe!' : 'History cleared!');
                window.location.reload();
              }
            }}
            className="w-full flex items-center justify-between p-5 hover:bg-red-50 transition-colors text-left"
          >
            <div>
              <p className="font-bold text-red-600">{isRw ? 'Siba ibyabitswe' : 'Clear Chat History'}</p>
              <p className="text-xs text-neutral-400">{isRw ? 'Siba amateka y\'ibiganiro byose' : 'Permanently delete all sessions'}</p>
            </div>
            <Shield size={20} className="text-red-200" />
          </button>
        </div>
      </section>

      {/* Offline info */}
      <div className="flex items-start gap-4 p-5 bg-primary-50 rounded-[2rem] border border-primary-100 shadow-inner">
        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm flex-shrink-0">
          <Info size={20} />
        </div>
        <div>
          <p className="text-xs font-black text-primary-900 uppercase tracking-widest mb-1">Humura AI v2.0</p>
          <p className="text-[11px] text-primary-700 leading-relaxed font-medium">
            {isRw
              ? 'Igenamiterere ryawe ribikwa kuri iyi foni gusa. Nta murandasi ukenewe kandi nta makuru y\'umwirondoro ajya hanze.'
              : 'All settings work offline and are stored locally. No personal data is ever collected or transmitted.'}
          </p>
        </div>
      </div>
    </div>
  );
}


