import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Flame, Smile, Calendar, BookOpen, Brain, PlusCircle, Loader2, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { addNotification } from '../lib/notifications';

// ──────────────────────────────────────────────────────────────
// TYPES & CONSTANTS
// ──────────────────────────────────────────────────────────────
type MoodLevel = 'great' | 'good' | 'neutral' | 'anxious' | 'sad';

interface MoodEntry {
  date: string;
  mood: MoodLevel;
  emoji: string;
  score: number;
}

interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood?: string;
}

const MOODS: { id: MoodLevel; emoji: string; en: string; rw: string; score: number; tip: { en: string; rw: string }; color: string }[] = [
  { id: 'great', emoji: '🤩', en: 'Great', rw: 'Neza cyane', score: 5, color: 'from-amber-400 to-yellow-500', tip: { en: 'Channel that energy into creativity or helping someone today!', rw: 'Shyira imbaraga zose mu gushyiraho ikintu gishya cyangwa gufasha umuntu uyu munsi!' } },
  { id: 'good', emoji: '😊', en: 'Good', rw: 'Neza', score: 4, color: 'from-emerald-400 to-green-500', tip: { en: 'Note 3 things you\'re grateful for — it compounds the good feeling.', rw: 'Andika ibintu 3 wishimira — bizongera ibyishimo.' } },
  { id: 'neutral', emoji: '😐', en: 'Neutral', rw: 'Bisanzwe', score: 3, color: 'from-sky-400 to-blue-500', tip: { en: 'Try a short walk or drink a glass of water — small acts shift energy.', rw: 'Gerageza kugenda gato cyangwa unywe amazi — ibikorwa bito bihindura imbaraga.' } },
  { id: 'anxious', emoji: '😰', en: 'Anxious', rw: 'Impungenge', score: 2, color: 'from-violet-400 to-purple-500', tip: { en: 'Try the 4-7-8 breathing technique: inhale 4, hold 7, exhale 8 counts.', rw: 'Gerageza ubuhumekero bwa 4-7-8: humeka 4, komeza 7, sohora 8.' } },
  { id: 'sad', emoji: '😔', en: 'Sad', rw: 'Agahinda', score: 1, color: 'from-rose-400 to-red-500', tip: { en: 'Be gentle with yourself — you\'re not alone. Reach out to someone you trust.', rw: 'Jya wiroroheje — ntawurerego. Vuga n\'umuntu uizeye.' } },
];

const WEEK_DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEK_DAYS_RW = ['Kw1', 'Kw2', 'Kw3', 'Kw4', 'Kw5', 'Kw6', 'Cyum'];

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function getWeek(): string[] {
  const days = [];
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() + 1);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

// ──────────────────────────────────────────────────────────────
// SIMPLE BAR CHART (no recharts needed)
// ──────────────────────────────────────────────────────────────
function MoodBarChart({ entries, lang }: { entries: MoodEntry[]; lang: string }) {
  const week = getWeek();
  const isRw = lang.startsWith('rw');
  const weekDays = isRw ? WEEK_DAYS_RW : WEEK_DAYS_EN;

  return (
    <div className="flex justify-between items-end gap-1 h-20 px-1">
      {week.map((date, i) => {
        const entry = entries.find(e => e.date === date);
        const height = entry ? (entry.score / 5) * 64 : 4;
        const isToday = date === todayStr();
        return (
          <div key={date} className="flex flex-col items-center gap-1 flex-1">
            {entry && (
              <span className="text-sm leading-none">{entry.emoji}</span>
            )}
            <div
              className="w-full rounded-lg transition-all"
              style={{
                height: `${height}px`,
                background: isToday
                  ? 'linear-gradient(to top, #004D4D, #00897B)'
                  : entry
                  ? 'linear-gradient(to top, #66B3B3, #004D4D)'
                  : undefined,
                backgroundColor: !entry ? '#E6F2F2' : undefined,
                minHeight: '4px',
              }}
            />
            <span className={`text-[9px] font-medium ${isToday ? 'text-primary font-bold' : 'text-neutral-400'}`}>
              {weekDays[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function getOfflineInsight(moodEntries: MoodEntry[], lang: string): string {
  const isRw = lang.startsWith('rw');
  if (moodEntries.length === 0) {
    return isRw
      ? "Nta makuru ahagije dufite yo kuguha inama. Gerageza kwandika uko umeze mu buryo buhoraho."
      : "We don't have enough data to give you an insight yet. Try logging your mood for a few days!";
  }

  const quotaMessage = lang.startsWith('rw')
    ? "Gerageza nyuma gato cyangwa niba ukeneye ubufasha bwihutirwa hamagara 114 (Rwanda Biomedical Centres)"
    : "Try again later or if you want immediate support call 114 (Rwanda Biomedical Centres)";
  
  return quotaMessage;
}

// ──────────────────────────────────────────────────────────────
// MAIN PROGRESS PAGE
// ──────────────────────────────────────────────────────────────
export default function ProgressPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isRw = lang.startsWith('rw');

  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [moodTip, setMoodTip] = useState('');
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalText, setJournalText] = useState('');
  const [journalSaved, setJournalSaved] = useState(false);
  const [tab, setTab] = useState<'mood' | 'journal' | 'insight'>('mood');
  const [insightText, setInsightText] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  const [expandedJournalId, setExpandedJournalId] = useState<string | null>(null);
  const [tierUsed, setTierUsed] = useState<number | null>(null);

  const today = todayStr();
  const todayEntry = moodEntries.find(e => e.date === today);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('Humura_moods');
    if (stored) setMoodEntries(JSON.parse(stored));
    const storedJournal = localStorage.getItem('Humura_journal');
    if (storedJournal) setJournalEntries(JSON.parse(storedJournal));
  }, []);

  const avgScore = useMemo(() => {
    const last7 = moodEntries.slice(-7);
    if (!last7.length) return 0;
    return Math.round((last7.reduce((s, e) => s + e.score, 0) / last7.length) * 10) / 10;
  }, [moodEntries]);

  const streak = useMemo(() => {
    let s = 0;
    const todayDate = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (moodEntries.find(e => e.date === ds)) s++;
      else break;
    }
    return s;
  }, [moodEntries]);

  const topMood = useMemo(() => {
    if (!moodEntries.length) return '—';
    const counts: Record<string, number> = {};
    moodEntries.forEach(e => { counts[e.mood] = (counts[e.mood] || 0) + 1; });
    const topArr = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!topArr.length) return '—';
    const found = MOODS.find(m => m.id === topArr[0][0]);
    return found ? found.emoji : '—';
  }, [moodEntries]);

  const handleMoodSelect = async (mood: typeof MOODS[0]) => {
    if (todayEntry) return; // Already logged today
    setSelectedMood(mood.id);
    setMoodTip(isRw ? mood.tip.rw : mood.tip.en);

    const entry: MoodEntry = {
      date: today,
      mood: mood.id,
      emoji: mood.emoji,
      score: mood.score,
    };

    // Save to localStorage first (offline-first)
    const updated = [...moodEntries.filter(e => e.date !== today), entry];
    setMoodEntries(updated);
    localStorage.setItem('Humura_moods', JSON.stringify(updated));

    // Non-blocking sync to Supabase
    try {
      await supabase.from('mood_metrics').upsert({ mood_level: mood.id, created_at: new Date().toISOString() });
    } catch (e) {
      console.warn("Supabase sync failed (likely offline):", e);
    }

    addNotification({
      type: 'wellness',
      titleEn: 'Mood Logged',
      titleRw: 'Uko umeze Kwabitswe',
      messageEn: `You logged your mood as "${mood.en}". Keep it up!`,
      messageRw: `Wanditse ko umeze "${mood.rw}". Komeza utyo!`,
      icon: 'Heart',
      color: 'text-blue-500 bg-blue-50',
      link: '/progress'
    });
  };

  const saveJournal = async () => {
    if (!journalText.trim()) return;
    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: today,
      content: journalText,
      mood: todayEntry?.emoji,
    };
    const updated = [entry, ...journalEntries];
    setJournalEntries(updated);
    localStorage.setItem('Humura_journal', JSON.stringify(updated));
    setJournalText('');
    setJournalSaved(true);
    setTimeout(() => setJournalSaved(false), 3000);

    // Non-blocking Supabase sync
    try {
      await supabase.from('journal_entries').insert({ content: entry.content });
    } catch (e) {
      console.warn("Supabase journal sync failed:", e);
    }

    addNotification({
      type: 'progress',
      titleEn: 'Journal Entry Saved',
      titleRw: 'Inkuru yawe Yabitswe',
      messageEn: 'Your thoughts have been safely stored in your journal.',
      messageRw: 'Ibitekerezo byawe byabitswe neza mu nkurunzira yawe.',
      icon: 'TrendingUp',
      color: 'text-green-500 bg-green-50',
      link: '/progress'
    });
  };

  const getInsight = async () => {
    setInsightLoading(true);
    setInsightText(''); // Clear previous

    try {
      // TIER 1: TRY EDGE FUNCTION
      console.log("Humura AI (Insight): Attempting Edge Function 'chat'...");
      const last7Str = moodEntries.slice(-7).map(e => `${e.date}: ${e.mood} (${e.emoji})`).join(', ');
      
      const { data, error, status } = await supabase.functions.invoke('super-task', {
        body: { 
          userMessage: `I am a mental health app user in Rwanda. Here are my last 7 mood entries: ${last7Str || 'no data yet'}. Please give me a personalized, warm 3-sentence wellness insight based on these patterns. Be specific, empathetic and actionable. Mention at least one specific mood I logged if available.`,
          history: [],
          lang: lang,
          apiKey: GEMINI_API_KEY.trim()
        }
      });

      if (status === 429) {
        setInsightText(isRw 
          ? "Sisitemu yakiriye ubusabe bwinshi (20/min). Gerageza nyuma y'umunota umwe." 
          : "Rate limit reached (20 requests/min). Please try again in 60 seconds.");
        return;
      }

      if (error) throw error;
      if (!data?.reply) throw new Error('No reply received from Edge Function');
      
      setInsightText(data.reply);
      setTierUsed(2);
      console.log("✅ Humura AI (Insight): Response received from Edge Function.");
    } catch (edgeError: any) {
      console.error("❌ Humura AI (Insight): Edge Function failed.", edgeError);
      setInsightText(getOfflineInsight(moodEntries, lang));
      setTierUsed(3);
    } finally {
      setInsightLoading(false);
    }
  };


  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 className="text-primary" size={28} />
          <h1 className="text-2xl font-extrabold text-primary-900 tracking-tight">
            {isRw ? 'Aho Ugeze' : 'My Progress'}
          </h1>
        </div>
        <p className="text-primary-600 text-sm">
          {isRw ? 'Kurikirana ubuzima bwawe bwo mu mutwe buri munsi' : 'Track your mental wellness day by day'}
        </p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: isRw ? 'Imihigo' : 'Streak', value: `${streak}d`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: isRw ? 'Amanota' : 'Avg Mood', value: `${avgScore}/5`, icon: Smile, color: 'text-primary', bg: 'bg-primary-50' },
          { label: isRw ? 'Ibintu Byiza' : 'Top Mood', value: topMood, icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-3 flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center`}>
              <s.icon size={16} className={s.color} />
            </div>
            <p className="font-extrabold text-primary-900 text-lg leading-none">{s.value}</p>
            <p className="text-xs text-neutral-400 font-medium text-center">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly mood chart */}
      <div className="glass-card rounded-2xl p-4">
        <h2 className="font-bold text-primary-900 mb-3 flex items-center gap-2 text-sm">
          <Calendar size={15} className="text-primary" />
          {isRw ? 'Umwaka w\'Iki Cyumweru' : 'This Week\'s Mood'}
        </h2>
        <MoodBarChart entries={moodEntries} lang={lang} />
      </div>

      {/* 7-day emoji history strip */}
      {moodEntries.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-neutral-400 font-medium mb-2">{isRw ? 'Amateka ya Buri Munsi' : '7-Day History'}</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {moodEntries.slice(-7).reverse().map(e => (
              <div key={e.date} className="flex flex-col items-center gap-1 flex-shrink-0">
                <span className="text-xl">{e.emoji}</span>
                <span className="text-[9px] text-neutral-400">{e.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex rounded-2xl bg-primary-50 p-1 gap-1">
        {(['mood', 'journal', 'insight'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tab === t ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-primary'
            }`}
          >
            {t === 'mood'
              ? (isRw ? '😊 Buri Munsi' : '😊 Daily Mood')
              : t === 'journal'
              ? (isRw ? '📓 Inkuru' : '📓 Journal')
              : (isRw ? '🧠 Inama ya AI' : '🧠 AI Insight')}
          </button>
        ))}
      </div>

      {/* Tab: Mood */}
      {tab === 'mood' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {todayEntry ? (
            <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
              <span className="text-5xl">{todayEntry.emoji}</span>
              <div>
                <p className="font-bold text-primary-900">
                  {isRw ? 'Uyu munsi wakorewe!' : 'Today logged!'}
                </p>
                <p className="text-sm text-neutral-500">
                  {MOODS.find(m => m.id === todayEntry.mood)?.[isRw ? 'rw' : 'en']}
                </p>
                <p className="text-xs text-primary-500 mt-1">
                  {isRw ? 'Subira ejo kugira ngo ukomeze imihigo yawe' : 'Come back tomorrow to keep your streak!'}
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-5 space-y-4">
              <h3 className="font-bold text-primary-900">
                {isRw ? 'Umeze ute uyu munsi?' : 'How are you feeling today?'}
              </h3>
              <div className="flex justify-between gap-2">
                {MOODS.map(mood => (
                  <button
                    key={mood.id}
                    onClick={() => handleMoodSelect(mood)}
                    className={`flex-1 flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all ${
                      selectedMood === mood.id
                        ? 'bg-primary scale-105 shadow-lg shadow-primary/20'
                        : 'bg-primary-50 hover:bg-primary-100 hover:scale-105'
                    }`}
                    aria-label={isRw ? mood.rw : mood.en}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className={`text-[10px] font-bold ${selectedMood === mood.id ? 'text-white' : 'text-primary-700'}`}>
                      {isRw ? mood.rw : mood.en}
                    </span>
                  </button>
                ))}
              </div>
              <AnimatePresence>
                {moodTip && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-accent-50 rounded-2xl border border-accent/20"
                  >
                    <p className="text-sm text-amber-800 leading-relaxed">💡 {moodTip}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* History */}
          {moodEntries.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-primary-900 flex items-center gap-2 text-sm">
                <BookOpen size={15} className="text-primary" />
                {isRw ? 'Amateka' : 'Mood History'}
              </h3>
              {[...moodEntries].reverse().map(e => (
                <div key={e.date} className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-2xl">{e.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-primary-900">
                      {new Date(e.date + 'T12:00:00').toLocaleDateString(isRw ? 'fr-FR' : 'en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {MOODS.find(m => m.id === e.mood)?.[isRw ? 'rw' : 'en']}
                    </p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < e.score ? 'bg-primary' : 'bg-primary-100'}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Tab: Journal */}
      {tab === 'journal' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="glass-card rounded-3xl p-5 space-y-3">
            <h3 className="font-bold text-primary-900 flex items-center gap-2">
              <BookOpen size={16} className="text-primary" />
              {isRw
                ? `Inkuru ya ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
                : `Today's Journal — ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`}
            </h3>

            {/* Prompt suggestions */}
            <div className="flex gap-2 flex-wrap">
              {[
                { en: 'Today I\'m grateful for...', rw: 'Uyu munsi nishimye kubera...' },
                { en: 'I managed to...', rw: 'Nashoboye...' },
                { en: 'I\'m learning that...', rw: 'Ndiga ko...' },
              ].map(p => (
                <button
                  key={p.en}
                  onClick={() => setJournalText(prev => prev ? `${prev}\n\n${isRw ? p.rw : p.en}` : (isRw ? p.rw : p.en))}
                  className="text-xs bg-accent-50 text-amber-700 border border-accent/30 px-3 py-1.5 rounded-full font-medium hover:bg-accent-100 transition-colors"
                >
                  {isRw ? p.rw : p.en}
                </button>
              ))}
            </div>

            <textarea
              value={journalText}
              onChange={e => setJournalText(e.target.value)}
              placeholder={isRw ? 'Andika ibibereye mu mutima wawe...' : 'Write freely — this is your safe space...'}
              className="w-full p-4 text-sm bg-primary-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none placeholder:text-neutral-400 leading-relaxed min-h-[180px]"
            />

            <button
              onClick={saveJournal}
              disabled={!journalText.trim()}
              className={`w-full py-3 font-bold rounded-2xl transition-all ${
                journalSaved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-primary text-white hover:bg-primary-900 shadow-lg shadow-primary/20 disabled:opacity-50'
              }`}
            >
              {journalSaved
                ? (isRw ? '✓ Byabitswe!' : '✓ Entry Saved!')
                : (isRw ? 'Bika Inkuru' : 'Save Entry')}
            </button>
          </div>

          {/* Past entries */}
          {journalEntries.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-primary-900 text-sm flex items-center gap-2">
                <BookOpen size={14} className="text-primary" />
                {isRw ? 'Inkuru Zashize' : 'Past Entries'}
              </h3>
              {journalEntries.map(entry => (
                <div key={entry.id} className="glass-card rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpandedJournalId(expandedJournalId === entry.id ? null : entry.id)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {entry.mood && <span className="text-lg">{entry.mood}</span>}
                      <span className="text-sm font-semibold text-primary-900">
                        {new Date(parseInt(entry.id)).toLocaleDateString(isRw ? 'fr-FR' : 'en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-400">{expandedJournalId === entry.id ? '▲' : '▼'}</span>
                  </button>
                  <AnimatePresence>
                    {expandedJournalId === entry.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4"
                      >
                        <p className="text-sm text-primary-800 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 px-4 py-3 bg-accent-50 rounded-2xl border border-accent/20">
            <PlusCircle size={16} className="text-accent flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              {isRw
                ? 'Kwandika iminota 5 buri munsi bigabanya ibimenyetso by\'agahinda n\'ubwoba ku rugero rw\'umuzinga.'
                : 'Just 5 minutes of daily journaling significantly reduces symptoms of anxiety and depression.'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Tab: AI Insight */}
      {tab === 'insight' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="glass-card rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
                <Brain size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-primary-900">
                  {isRw ? 'Inama ya AI y\'Ubuzima' : 'AI Wellness Insight'}
                </h3>
                <p className="text-xs flex items-center gap-2">
                  <span className="text-neutral-500">{isRw ? 'Ikoze ku makuru yawe ya 7 y\'imihindagurikire' : 'Personalized from your last 7 mood entries'}</span>
                  {tierUsed === 1 || tierUsed === 2 ? (
                    <span className="text-green-600 font-bold animate-pulse text-[10px]">● LIVE</span>
                  ) : tierUsed === 3 ? (
                    <span className="text-amber-600 font-bold text-[10px]">● OFFLINE</span>
                  ) : null}
                </p>
              </div>
            </div>

            <button
              onClick={getInsight}
              disabled={insightLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white font-bold rounded-2xl hover:bg-primary-900 disabled:opacity-60 transition-colors shadow-lg shadow-primary/20"
            >
              {insightLoading ? (
                <><Loader2 size={18} className="animate-spin" /> {isRw ? 'AI iratekereza...' : 'AI is thinking...'}</>
              ) : (
                <><Brain size={18} /> {isRw ? 'Bona Inama y\'Ubuzima' : 'Get Wellness Insight'}</>
              )}
            </button>

            <AnimatePresence>
              {insightText && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-primary-50 rounded-2xl border border-primary-100"
                >
                  <p className="text-sm text-primary-900 leading-relaxed">{insightText}</p>
                  
                  {tierUsed === 3 && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => navigate('/centers')}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-white text-primary border border-primary-200 rounded-xl font-bold text-xs shadow-sm hover:bg-primary-50 transition-all active:scale-95"
                    >
                      <MapPin size={14} />
                      {isRw ? 'Hamagara / Reba Amavuriro' : 'Call / View Support Directory'}
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="glass-card rounded-2xl p-4 space-y-2">
            <p className="font-semibold text-primary-900 text-sm">
              {isRw ? '📊 Iporogaramu y\'Imihindagurikire (Iminsi 30)' : '📊 30-Day Mood Distribution'}
            </p>
            {MOODS.map(mood => {
              const count = moodEntries.filter(e => e.mood === mood.id).length;
              const pct = moodEntries.length ? Math.round((count / moodEntries.length) * 100) : 0;
              return (
                <div key={mood.id} className="flex items-center gap-3">
                  <span className="text-base w-6">{mood.emoji}</span>
                  <div className="flex-1 bg-primary-50 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-primary-700 w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}


