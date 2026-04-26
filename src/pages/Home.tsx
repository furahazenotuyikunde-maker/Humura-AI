import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Users, BarChart2, BookOpen, MapPin, HandMetal, AlertTriangle, Phone, Stethoscope, Type } from 'lucide-react';

const MOODS = [
  { id: 'great', emoji: '🤩', en: 'Great', rw: 'Neza cyane', color: 'from-amber-400 to-yellow-500', tip: { en: 'Channel that energy into creativity or helping someone today!', rw: 'Shyira imbaraga zose mu gushyiraho ikintu gishya cyangwa gufasha umuntu uyu munsi!' } },
  { id: 'good', emoji: '😊', en: 'Good', rw: 'Neza', color: 'from-emerald-400 to-green-500', tip: { en: 'Note 3 things you\'re grateful for — it compounds the good feeling.', rw: 'Andika ibintu 3 wishimira — bizongera ibyishimo.' } },
  { id: 'neutral', emoji: '😐', en: 'Neutral', rw: 'Bisanzwe', color: 'from-sky-400 to-blue-500', tip: { en: 'Try a short walk or drink a glass of water — small acts shift energy.', rw: 'Gerageza kugenda gato cyangwa unywe amazi — ibikorwa bito bihindura imbaraga.' } },
  { id: 'anxious', emoji: '😰', en: 'Anxious', rw: 'Impungenge', color: 'from-violet-400 to-purple-500', tip: { en: 'Try the 4-7-8 breathing technique: inhale 4, hold 7, exhale 8 counts.', rw: 'Gerageza ubuhumekero bwa 4-7-8: humeka 4, komeza 7, sohora 8.' } },
  { id: 'sad', emoji: '😔', en: 'Sad', rw: 'Agahinda', color: 'from-rose-400 to-red-500', tip: { en: 'Be gentle with yourself — you\'re not alone. Reach out to someone you trust.', rw: 'Jya wiroroheje — ntawurerego. Vuga n\'umuntu uizeye.' } },
];

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Home() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState<string | null>(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('Humura_moods');
    if (stored) {
      const entries = JSON.parse(stored);
      const todayEntry = entries.find((e: any) => e.date === today);
      return todayEntry?.mood || null;
    }
    return null;
  });
  const [moodTip, setMoodTip] = useState('');
  const [showTip, setShowTip] = useState(false);

  // 7-day mood strip
  const weekMoods: (any | null)[] = (() => {
    const today = new Date();
    const stored = localStorage.getItem('Humura_moods');
    const entries = stored ? JSON.parse(stored) : [];
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - 6 + i);
      const ds = d.toISOString().split('T')[0];
      return entries.find((e: any) => e.date === ds) || null;
    });
  })();

  const handleMoodSelect = (mood: typeof MOODS[0]) => {
    if (selectedMood) return; // Already logged today
    setSelectedMood(mood.id);
    setMoodTip(isRw ? mood.tip.rw : mood.tip.en);
    setShowTip(true);

    const today = new Date().toISOString().split('T')[0];
    const entry = { date: today, mood: mood.id, emoji: mood.emoji, score: MOODS.indexOf(mood) === 0 ? 5 : MOODS.length - MOODS.indexOf(mood) };
    const stored = localStorage.getItem('Humura_moods');
    const entries = stored ? JSON.parse(stored) : [];
    const updated = [...entries.filter((e: any) => e.date !== today), entry];
    localStorage.setItem('Humura_moods', JSON.stringify(updated));
  };

  const navCards = [
    { path: '/chat', icon: MessageCircle, en: 'AI Therapy Chat', rw: 'Ikiganiro cya Humura AI', color: 'bg-primary', desc: { en: 'Talk with your AI companion', rw: 'Ganira na AI yawe' } },
    { path: '/education', icon: BookOpen, en: 'Education Hub', rw: 'Ikigo cy\'Indangamuntu', color: 'bg-blue-500', desc: { en: 'Learn about mental health', rw: 'Iga ku buzima bwo mu mutwe' } },
    { path: '/centers', icon: MapPin, en: 'Support Centres', rw: 'Amavuriro', color: 'bg-rose-500', desc: { en: '15 verified centres in Rwanda', rw: 'Ibigo 15 mu Rwanda' } },
    { path: '/professionals', icon: Stethoscope, en: 'Find Professionals', rw: 'hura ni inzobere', color: 'bg-teal-500', desc: { en: 'Connect with therapists', rw: "hura nabaganga b’inzobere ku buzima bwo mu mutwe" } },
    { path: '/community', icon: Users, en: 'Community Circles', rw: 'urubuga rwo kugirana inama', color: 'bg-purple-600', desc: { en: 'Anonymous peer support', rw: 'Ubufasha bw\'inshuti' } },
    { path: '/progress', icon: BarChart2, en: 'My Progress', rw: 'impinduka', color: 'bg-orange-500', desc: { en: 'Track mood & journal', rw: 'Kurikirana impinduka ku buzimo bwawe bwo mu mutwe buri cyumweru.' } },
    { path: '/braille', icon: Type, en: 'Braille Generator', rw: 'Inyandiko z’Impumyi', color: 'bg-indigo-600', desc: { en: 'Convert text to Braille PDF', rw: 'Hindura inyandiko mu buhumyi' } },
  ];


  return (
    <div className="space-y-6 pb-10">
      {/* Greeting */}
      <section className="mt-2">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold text-primary-900 tracking-tight"
        >
          {isRw ? 'Muraho! 👋' : 'Hello! 👋'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-primary-600 mt-1 text-sm"
        >
          {isRw
            ? 'Humura AI iri hano kugufasha. Umeze ute uyu munsi?'
            : 'Humura AI is here to support you. How are you feeling today?'}
        </motion.p>
      </section>

      {/* Mood Check-in */}
      <section className="glass-card rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-primary-900">
            {isRw ? 'Umeze ute uyu munsi?' : 'How are you right now?'}
          </h2>
          {selectedMood && (
            <span className="text-xs text-primary-500">{isRw ? '✓ uko wiyumva byabitswe' : '✓ Logged'}</span>
          )}

        </div>

        <div className="flex justify-between gap-2">
          {MOODS.map((mood) => (
            <motion.button
              key={mood.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleMoodSelect(mood)}
              disabled={!!selectedMood}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl flex-1 transition-all ${selectedMood === mood.id
                  ? `bg-gradient-to-b ${mood.color} text-white shadow-lg scale-105`
                  : selectedMood
                    ? 'bg-primary-50 opacity-50 cursor-not-allowed'
                    : 'bg-primary-50 hover:bg-primary-100 hover:scale-105'
                }`}
              aria-label={isRw ? mood.rw : mood.en}
            >
              <span className="text-2xl">{mood.emoji}</span>
              <span className={`text-[10px] font-bold ${selectedMood === mood.id ? 'text-white' : 'text-primary-700'}`}>
                {isRw ? mood.rw : mood.en}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Tip */}
        <AnimatePresence>
          {showTip && moodTip && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-accent-50 rounded-2xl border border-accent/20"
            >
              <p className="text-sm text-amber-800 leading-relaxed">💡 {moodTip}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 7-day strip */}
        <div className="mt-4 pt-4 border-t border-primary-50">
          <p className="text-xs text-neutral-400 mb-2 font-medium">{isRw ? 'Iminsi 7' : '7-day history'}</p>
          <div className="flex justify-between gap-1">
            {weekMoods.map((entry, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                <span className="text-base">{entry?.emoji || '—'}</span>
                <span className="text-[9px] text-neutral-400">{WEEK_DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick crisis banner */}
      <motion.button
        onClick={() => navigate('/emergency')}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full text-left flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-2xl hover:bg-red-100 transition-colors"
      >
        <Phone size={18} className="text-red-500 flex-shrink-0" />
        <div className="flex-1 text-left">
          <p className="font-bold text-red-900 text-xs">{isRw ? 'ubufasha bw’ihutirwa?' : 'Need immediate support?'}</p>
          <p className="text-red-600 text-xs">116 (Free) · 114 · +250 790 003 002</p>
        </div>

        <AlertTriangle size={16} className="text-red-400" />
      </motion.button>

      {/* Sign Language highlight */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onClick={() => navigate('/sign-language')}
        className="w-full glass-card rounded-3xl p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all text-left border-2 border-primary/20"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl shadow-lg">
          🤟
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-primary-900">
            {isRw ? 'Amarenga' : 'Sign Language Support'}
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            {isRw ? 'Koresha amarenga utangira ikiganiro na AI' : 'Use sign symbols to start an AI conversation'}
          </p>
        </div>

        <HandMetal size={20} className="text-primary-400" />
      </motion.button>

      {/* Nav grid */}
      <section>
        <h2 className="font-bold text-primary-900 mb-3">
          {isRw ? 'Shakisha Humura AI' : 'Explore Humura AI'}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {navCards.map((card, idx) => (
            <motion.button
              key={card.path}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx }}
              onClick={() => navigate(card.path)}
              className="glass-card rounded-3xl p-4 flex flex-col items-start gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all text-left border border-white/60"
            >
              <div className={`w-11 h-11 rounded-2xl ${card.color} flex items-center justify-center shadow-inner`}>
                <card.icon size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-primary-900 text-sm leading-tight">
                  {isRw ? card.rw : card.en}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {isRw ? card.desc.rw : card.desc.en}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* USSD info */}
      <div className="flex gap-3 p-4 bg-primary-50 rounded-2xl">
        <span className="text-xl">📱</span>
        <div>
          <p className="text-sm font-bold text-primary-900">
            {isRw ? 'Koresha USSD — Nta murandasi ukenewe' : 'USSD Access — No internet needed'}
          </p>
          <p className="text-xs text-primary-600 mt-0.5">
            {isRw ? 'Kanda *114# cyangwa u-hamagare 116 (ku buntu) u-bone ubufasha' : 'Dial *114# or call 116 (free) on any phone for support'}
          </p>
        </div>
      </div>
    </div>
  );
}


