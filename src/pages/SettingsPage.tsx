import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Sun, Eye, Contrast, Shield, TriangleAlert, Info } from 'lucide-react';

interface SettingsState {
  simpleView: boolean;
  highContrast: boolean;
  discreetMode: boolean;
}

export default function SettingsPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const [settings, setSettings] = useState<SettingsState>({
    simpleView: false,
    highContrast: false,
    discreetMode: false,
  });

  const [showDiscreet, setShowDiscreet] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('Humura_settings');
    if (stored) setSettings(JSON.parse(stored));
  }, []);

  const updateSetting = (key: keyof SettingsState, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem('Humura_settings', JSON.stringify(updated));

    if (key === 'simpleView') {
      document.documentElement.style.fontSize = value ? '18px' : '';
    }
    if (key === 'highContrast') {
      document.documentElement.classList.toggle('high-contrast', value);
    }
    if (key === 'discreetMode' && value) {
      setShowDiscreet(true);
    }
  };

  // Triple-click to exit discreet mode
  const handleTripleClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => { clickCountRef.current = 0; }, 500);
    if (clickCountRef.current >= 3) {
      setShowDiscreet(false);
      updateSetting('discreetMode', false);
      clickCountRef.current = 0;
    }
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Discreet Mode Weather Overlay */}
      <AnimatePresence>
        {showDiscreet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] discreet-overlay"
            onClick={handleTripleClick}
          >
            <div className="text-center">
              <div className="text-8xl mb-4">☀️</div>
              <h1 className="text-5xl font-extrabold">28°C</h1>
              <p className="text-2xl mt-2 opacity-80">Kigali, Rwanda</p>
              <p className="text-xl mt-1 opacity-70">Mostly Sunny</p>
              <div className="mt-8 grid grid-cols-4 gap-6 text-sm opacity-60">
                {['Mon', 'Tue', 'Wed', 'Thu'].map((d, i) => (
                  <div key={d} className="flex flex-col items-center gap-1">
                    <span>{d}</span>
                    <span className="text-2xl">{'☀️🌤️⛅🌦️'[i]}</span>
                    <span>{24 + i}°</span>
                  </div>
                ))}
              </div>
              <p className="mt-12 text-xs opacity-40">
                {lang === 'rw' ? 'Kanda inshuro 3 gusubira' : 'Triple-tap anywhere to exit'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="text-primary" size={28} />
        <h1 className="text-2xl font-extrabold text-primary-900 tracking-tight">
          {lang === 'rw' ? 'Igenamiterere' : 'Settings'}
        </h1>
      </div>

      {/* Accessibility Settings */}
      <div className="space-y-3">
        <h2 className="font-bold text-primary-900 text-sm uppercase tracking-wide text-neutral-400">
          {lang === 'rw' ? 'Ubugari bwo Gukoresha' : 'Accessibility'}
        </h2>

        {/* Simple View */}
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
              <Sun size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-primary-900 text-sm">
                {lang === 'rw' ? 'Igitekerezo Cyoroshye' : 'Simple View'}
              </p>
              <p className="text-xs text-neutral-400">
                {lang === 'rw' ? 'Ibinyandiko binini na buto' : 'Larger text and buttons'}
              </p>
            </div>
          </div>
          <button
            onClick={() => updateSetting('simpleView', !settings.simpleView)}
            className={`w-12 h-6 rounded-full transition-colors relative ${settings.simpleView ? 'bg-primary' : 'bg-neutral-200'}`}
            aria-label="Toggle simple view"
            role="switch"
            aria-checked={settings.simpleView}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.simpleView ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* High Contrast */}
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
              <Contrast size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-primary-900 text-sm">
                {lang === 'rw' ? 'Ibara Rikomeye' : 'High Contrast Mode'}
              </p>
              <p className="text-xs text-neutral-400">
                {lang === 'rw' ? 'WCAG 2.1 AA gukurikira' : 'WCAG 2.1 AA compliant colors'}
              </p>
            </div>
          </div>
          <button
            onClick={() => updateSetting('highContrast', !settings.highContrast)}
            className={`w-12 h-6 rounded-full transition-colors relative ${settings.highContrast ? 'bg-primary' : 'bg-neutral-200'}`}
            aria-label="Toggle high contrast"
            role="switch"
            aria-checked={settings.highContrast}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.highContrast ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Discreet Mode */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                <Eye size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-primary-900 text-sm">
                  {lang === 'rw' ? 'Uburyo bwo Kwihisha' : 'Discreet Mode'}
                </p>
                <p className="text-xs text-neutral-400">
                  {lang === 'rw' ? 'Hisha gahunda nk\'igihe cy\'ikirere' : 'Disguise app as a weather app'}
                </p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('discreetMode', !settings.discreetMode)}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.discreetMode ? 'bg-amber-500' : 'bg-neutral-200'}`}
              aria-label="Toggle discreet mode"
              role="switch"
              aria-checked={settings.discreetMode}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.discreetMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-xl ml-12">
            ☀️ {lang === 'rw' ? 'Porogaramu izagaragara nk\'"28°C Kigali, Mostly Sunny". Kanda inshuro 3 cyangwa kande buto ruhishe kugira ngo usubire.' : 'App appears as "28°C Kigali, Mostly Sunny". Triple-tap anywhere or use the hidden button to return.'}
          </p>
        </div>
      </div>

      {/* Language */}
      <div className="space-y-3">
        <h2 className="font-bold text-primary-900 text-sm uppercase tracking-wide text-neutral-400">
          {lang === 'rw' ? 'Ururimi' : 'Language'}
        </h2>
        <div className="glass-card rounded-2xl p-4 flex gap-3">
          {['en', 'rw'].map(l => (
            <button
              key={l}
              onClick={() => i18n.changeLanguage(l)}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${
                i18n.language?.startsWith(l)
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
              }`}
            >
              {l === 'en' ? '🇬🇧 English' : '🇷🇼 Kinyarwanda'}
            </button>
          ))}
        </div>
      </div>

      {/* Emergency contacts */}
      <div className="space-y-3">
        <h2 className="font-bold text-primary-900 text-sm uppercase tracking-wide text-neutral-400">
          {lang === 'rw' ? 'Nimero z\'Ihutirwa' : 'Emergency Numbers'}
        </h2>
        <div className="glass-card rounded-2xl p-4 space-y-3">
          {[
            { name: 'Rwanda Crisis Hotline', number: '114', color: 'text-red-600' },
            { name: 'Healthy Minds Rwanda', number: '+250 790 003 002', color: 'text-rose-600' },
            { name: 'Icyizere Center', number: '+250 783 375 550', color: 'text-purple-600' },
            { name: 'Police / Ambulance', number: '112', color: 'text-blue-600' },
          ].map(c => (
            <div key={c.number} className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary-800">{c.name}</span>
              <a href={`tel:${c.number}`} className={`font-black text-sm ${c.color}`}>{c.number}</a>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Exit */}
      <div>
        <h2 className="font-bold text-primary-900 text-sm uppercase tracking-wide text-neutral-400 mb-3">
          {lang === 'rw' ? 'Gusohoka ' : 'Safety'}
        </h2>
        <a
          href="https://google.com"
          className="flex items-center justify-center gap-3 w-full py-4 bg-neutral-800 text-white font-bold rounded-2xl hover:bg-black transition-colors"
          aria-label="Quick exit to Google"
        >
          <Shield size={18} />
          {lang === 'rw' ? 'Sohoka  — Jya kuri Google' : 'Quick Exit — Go to Google'}
        </a>
        <p className="text-xs text-neutral-400 text-center mt-2">
          {lang === 'rw' ? 'Kanda hano kugira ngo uhite usohoka muri porogaramu' : 'Instantly leaves the app and goes to Google for safety'}
        </p>
      </div>

      {/* App info */}
      <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-2xl">
        <Info size={16} className="text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-primary-900">Humura AI v1.0</p>
          <p className="text-xs text-primary-600 mt-0.5">
            {lang === 'rw'
              ? 'Gufasha ubuzima bwo mu mutwe mu Rwanda · Nta makuru y\'umwirondoro abikwa nta mvano yawe'
              : 'Mental wellness support for Rwanda · No personal data stored without your consent'}
          </p>
        </div>
      </div>
    </div>
  );
}


