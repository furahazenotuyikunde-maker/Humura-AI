import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Heart,
  TrendingUp,
  Shield,
  ShieldCheck,
  AlertTriangle,
  PhoneCall,
  Clock,
  Calendar,
  Lock,
  Unlock,
  Smile,
  Meh,
  Frown,
  Moon,
  Zap,
  Activity,
  CheckCircle2,
  ChevronRight,
  Info,
  Compass,
  ArrowRight,
  RefreshCw,
  Tag,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';
import { supabase } from '../../lib/supabaseClient';

interface CheckInRecord {
  id: string;
  user_id: string;
  overall_score: number;
  primary_feeling: string;
  energy_level: number;
  sleep_quality: string;
  stress_level: number;
  reflection_note: string;
  context_tags: string[];
  share_with_clinician: boolean;
  created_at: string;
}

const FEELINGS_LIST = [
  { id: 'grounded', emoji: '🌱', en: 'Grounded & Calm', rw: 'Ntuze kandi ntekanye', score: 4, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  { id: 'hopeful', emoji: '☀️', en: 'Hopeful & Light', rw: 'Mfite ibyiringiro', score: 5, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  { id: 'steady', emoji: '🌊', en: 'Steady & Balanced', rw: 'Biraringanije', score: 3, color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
  { id: 'tired', emoji: '🌙', en: 'Drained / Low Energy', rw: 'Naniwe cyane', score: 2, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  { id: 'anxious', emoji: '⚡', en: 'Tense / Anxious', rw: 'Mpangayitse', score: 2, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  { id: 'overwhelmed', emoji: '🌧️', en: 'Heavy / Overwhelmed', rw: 'Ndaremerewe cyane', score: 1, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' }
];

const SLEEP_OPTIONS = [
  { id: 'deep_restful', en: 'Deep & Restful', rw: 'Ntasinziriye neza', icon: '😴' },
  { id: 'average', en: 'Normal / Enough', rw: 'Ibisanzwe', icon: '🛌' },
  { id: 'interrupted', en: 'Broken / Interrupted', rw: 'Narakangutse kenshi', icon: '⏰' },
  { id: 'restless', en: 'Restless / Poor', rw: 'Sinabashije gutuza', icon: '🌪️' }
];

const TAG_OPTIONS = [
  { id: 'work', en: 'Work & Studies', rw: 'Akazi & Amashuri' },
  { id: 'relationships', en: 'Friends & Family', rw: 'Inshuti & Umuryango' },
  { id: 'sleep', en: 'Sleep & Rest', rw: 'Ibitotsi & Kuruhuka' },
  { id: 'physical', en: 'Physical Health', rw: 'Ubuzima bw’Umubiri' },
  { id: 'solitude', en: 'Solitude / Quiet', rw: 'Kwiherera' },
  { id: 'routine', en: 'Daily Rhythm', rw: 'Gahunda za buri munsi' }
];

export default function CheckInPage() {
  const { i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const navigate = useNavigate();

  // State
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<CheckInRecord[]>([]);

  // Form selections
  const [selectedFeeling, setSelectedFeeling] = useState<string>('steady');
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [sleepQuality, setSleepQuality] = useState<string>('average');
  const [stressLevel, setStressLevel] = useState<number>(3);
  const [reflectionNote, setReflectionNote] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['daily_rhythm']);
  const [shareWithClinician, setShareWithClinician] = useState<boolean>(true);

  // Status flags & crisis detection
  const [crisisDetected, setCrisisDetected] = useState<boolean>(false);
  const [successSubmitted, setSuccessSubmitted] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchCheckIns(user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const fetchCheckIns = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('wellbeing_checkins')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data) {
        setHistory(data as CheckInRecord[]);
      } else {
        // Fallback to local storage cache if table is not yet migrated
        const cached = localStorage.getItem('humura_checkin_history');
        if (cached) {
          setHistory(JSON.parse(cached));
        }
      }
    } catch (e) {
      console.warn('Check-in fetch fallback:', e);
      const cached = localStorage.getItem('humura_checkin_history');
      if (cached) setHistory(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  // Immediate Non-Intrusive Crisis Safety Check
  const inspectCrisisSigns = (feelingId: string, noteText: string) => {
    const isHeavy = feelingId === 'overwhelmed';
    const crisisRegex = /(suicid|kill myself|want to die|end it all|self.?harm|kwiyahura|gupfa|kwigirira nabi|sinshaka kubaho)/i;
    return isHeavy && crisisRegex.test(noteText);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const feelingObj = FEELINGS_LIST.find(f => f.id === selectedFeeling) || FEELINGS_LIST[2];
    const isCrisis = inspectCrisisSigns(selectedFeeling, reflectionNote);
    setCrisisDetected(isCrisis);

    const recordPayload = {
      user_id: user?.id,
      overall_score: feelingObj.score,
      primary_feeling: selectedFeeling,
      energy_level: energyLevel,
      sleep_quality: sleepQuality,
      stress_level: stressLevel,
      reflection_note: reflectionNote.trim(),
      context_tags: selectedTags,
      share_with_clinician: shareWithClinician,
      created_at: new Date().toISOString()
    };

    try {
      if (user?.id) {
        const { error } = await supabase.from('wellbeing_checkins').insert([recordPayload]);
        if (error) {
          console.warn('Database insert fallback to localStorage:', error);
          saveToLocalStorage(recordPayload);
        }

        // Also add mood to mood_logs for backwards compatibility with Progress page
        await supabase.from('mood_logs').insert([{
          user_id: user.id,
          mood: selectedFeeling,
          score: feelingObj.score,
          created_at: new Date().toISOString()
        }]).then(() => {}).catch(() => {});

        // If crisis detected, seamlessly notify crisis escalation pipeline
        if (isCrisis) {
          await supabase.from('crisis_events').insert([{
            patient_id: user.id,
            type: 'voluntary_checkin_flag',
            last_msg: `[Voluntary Check-in Alert] Patient reported overwhelming distress. Note excerpt: "${reflectionNote.slice(0, 150)}"`,
            risk_level: 'high',
            triggered_at: new Date().toISOString()
          }]).then(() => {}).catch(() => {});
        }

        fetchCheckIns(user.id);
      } else {
        saveToLocalStorage(recordPayload);
      }

      setSuccessSubmitted(true);
      setTimeout(() => setSuccessSubmitted(false), 5000);
      setReflectionNote('');
    } catch (err) {
      console.error('Error submitting check-in:', err);
      saveToLocalStorage(recordPayload);
    } finally {
      setSubmitting(false);
    }
  };

  const saveToLocalStorage = (payload: any) => {
    const existing = JSON.parse(localStorage.getItem('humura_checkin_history') || '[]');
    const updated = [ { ...payload, id: Date.now().toString() }, ...existing].slice(0, 30);
    localStorage.setItem('humura_checkin_history', JSON.stringify(updated));
    setHistory(updated);
  };

  // Prepare longitudinal trend data
  const chartData = useMemo(() => {
    if (history.length === 0) return [];
    return [...history]
      .reverse()
      .map((item, index) => {
        const d = new Date(item.created_at);
        const dayLabel = d.toLocaleDateString(isRw ? 'rw-RW' : 'en-US', {
          month: 'numeric',
          day: 'numeric'
        });
        return {
          idx: index + 1,
          date: dayLabel,
          score: item.overall_score,
          energy: item.energy_level || 3,
          stress: item.stress_level || 3
        };
      });
  }, [history, isRw]);

  // Non-diagnostic reflections on trends
  const trendInsight = useMemo(() => {
    if (history.length < 2) {
      return isRw
        ? 'Tangira kwisuzuma kugira ngo ubone uko umutuzo n’imbaraga byawe bihindagurika mu minsi iri imbere.'
        : 'Complete a few check-ins over the week to observe how your energy and balance shift naturally.';
    }

    const recent = history.slice(0, 5);
    const avgScore = recent.reduce((acc, curr) => acc + curr.overall_score, 0) / recent.length;
    const avgStress = recent.reduce((acc, curr) => acc + (curr.stress_level || 3), 0) / recent.length;

    if (avgStress >= 4) {
      return isRw
        ? 'Iminsi ya vuba igaragaza umunaniro n’ibitekerezo byinshi. Ntugire impungenge zo gusaba ubufasha ku murongo wacu w’abantu bazewe.'
        : 'Your recent check-ins reflect elevated demands and stress. Consider taking micro-breaks or reaching out to human support.';
    } else if (avgScore >= 3.8) {
      return isRw
        ? 'Umutuzo wawe urakomeje kumererwa neza mu minsi yashize. Komeza kugumana aka kamaro k’ibigufasha.'
        : 'Your recent check-ins show sustained balance and resilience. Acknowledge the routines that keep you grounded.';
    } else {
      return isRw
        ? 'Uko wiyumva kuringaniye. Kwisuzuma buri munsi bidufasha guhora twumva ibikenewe mu buzima bwawe.'
        : 'Your wellbeing levels show natural ebbs and flows. Steady self-observation helps you honor what you need each day.';
    }
  }, [history, isRw]);

  return (
    <div className="space-y-8 pb-16 font-poppins max-w-5xl mx-auto px-2 sm:px-4">
      {/* ── HEADER BANNER ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#08352A] via-[#0D3F33] to-[#154E3F] text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#21B48D]/20 text-[#21B48D] text-xs font-bold tracking-wide">
              <Sparkles size={13} />
              {isRw ? 'Kwisuzuma ku Bushake' : 'Voluntary Self-Check-In'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {isRw ? 'Kwisuzuma n’Umutuzo wawe' : 'Wellbeing Self-Check-In'}
            </h1>
            <p className="text-sm text-[#A3C7BD] leading-relaxed">
              {isRw
                ? 'Uburyo bworoshye bwo kumenya uko wiyumva n’uko ibitekerezo bihinduka, nta gucirwa urubanza kandi nta kwisuzumisha indwara.'
                : 'A safe, gentle space to observe your emotional patterns, energy, and inner weather over time — without diagnostic labels.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/patient/support-navigator')}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#21B48D] hover:bg-[#1CA07D] text-[#08352A] font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Compass size={16} />
              {isRw ? 'Shaka Ubufasha bw’Abantu' : 'Support Navigator'}
            </button>
          </div>
        </div>

        {/* ── NON-DIAGNOSTIC & CONFIDENTIALITY BADGE ── */}
        <div className="mt-6 pt-5 border-t border-[#1F5E4D]/60 flex flex-wrap items-center gap-4 text-[12px] text-[#A3C7BD]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#21B48D]" />
            <span className="font-semibold text-white">
              {isRw ? 'Icyitonderwa:' : 'Non-Diagnostic Guardrail:'}
            </span>
            <span>
              {isRw
                ? 'Ibi ntabwo ari ibizamini byo gusuzuma indwara. Ni uburyo bwo kwimenya wenyine.'
                : 'This is not a medical or psychiatric diagnosis. It is your personal self-reflection log.'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto text-[#79ABA0]">
            <Lock size={13} />
            <span>{isRw ? 'Umutekano n’ibanga byawe birarinzwe' : 'Confidential & Secure'}</span>
          </div>
        </div>
      </motion.div>

      {/* ── CRISIS ALERT BANNER (IF DETECTED) ── */}
      <AnimatePresence>
        {crisisDetected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 text-rose-900 shadow-sm"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-extrabold text-base text-rose-950">
                  {isRw ? 'Turi kumwe nawe kandi ntabwo uri wenyine' : 'We hear you, and you do not have to carry this alone'}
                </h3>
                <p className="text-xs text-rose-800 leading-relaxed">
                  {isRw
                    ? 'Ibisubizo byawe bigaragaza ko uremerewe cyane muri aka kanya. Hamagara ako kanya umurongo utishyurwa w’ubutabazi wo mu Rwanda (114) cyangwa uganire n’inzobere yacu.'
                    : 'Your check-in indicates significant emotional weight. Please consider reaching out directly to Rwanda’s free 24/7 crisis hotline (114) or human clinical responders right now.'}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="tel:114"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
                  >
                    <PhoneCall size={14} />
                    {isRw ? 'Hamagara 114 (Ku Buntu)' : 'Call 114 (Toll-Free)'}
                  </a>
                  <button
                    onClick={() => navigate('/patient/support-navigator')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-rose-300 text-rose-900 hover:bg-rose-100 text-xs font-bold"
                  >
                    <Compass size={14} />
                    {isRw ? 'Gana Ubufasha bw’Abantu' : 'Connect with Support Navigator'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── LEFT: INTERACTIVE CHECK-IN FORM (7 COLS) ── */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-7 shadow-xs space-y-6">
          <div className="border-b border-neutral-100 pb-4">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Calendar size={18} className="text-[#21B48D]" />
              {isRw ? 'Kwisuzuma kw’Uyu Munsi' : 'Today’s Self-Reflection'}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {isRw
                ? 'Hitamo uko wiyumva nta gushidikanya. Ibi ni amakuru yawe bwite.'
                : 'Take a breath and choose the closest reflection of your present state.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Core Feeling Matrix */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center justify-between">
                <span>{isRw ? '1. Umeze ute muri rusange?' : '1. What word best fits right now?'}</span>
                <span className="text-[11px] font-normal text-neutral-400">
                  {isRw ? 'Hitamo 1' : 'Select one'}
                </span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {FEELINGS_LIST.map(item => {
                  const active = selectedFeeling === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedFeeling(item.id)}
                      className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        active
                          ? `${item.bg} ring-2 ring-[#08352A] shadow-xs scale-[1.02]`
                          : 'bg-neutral-50/70 border-neutral-200 hover:bg-neutral-100/70'
                      }`}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <span className={`text-xs font-bold leading-tight ${active ? item.color : 'text-neutral-800'}`}>
                        {isRw ? item.rw : item.en}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Energy & Sleep Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {/* Energy Level */}
              <div className="space-y-2 bg-neutral-50 p-4 rounded-2xl border border-neutral-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                    <Zap size={15} className="text-amber-500" />
                    {isRw ? 'Imbaraga z’Umubiri' : 'Physical Energy'}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border text-neutral-700">
                    {energyLevel} / 5
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={energyLevel}
                  onChange={e => setEnergyLevel(Number(e.target.value))}
                  className="w-full accent-[#08352A] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 font-medium">
                  <span>{isRw ? 'Naniwe' : 'Exhausted'}</span>
                  <span>{isRw ? 'Biringaniye' : 'Balanced'}</span>
                  <span>{isRw ? 'Zikomeye' : 'Vibrant'}</span>
                </div>
              </div>

              {/* Stress / Tension Level */}
              <div className="space-y-2 bg-neutral-50 p-4 rounded-2xl border border-neutral-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                    <Activity size={15} className="text-rose-500" />
                    {isRw ? 'Umunaniro / Stress' : 'Stress / Tension'}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border text-neutral-700">
                    {stressLevel} / 5
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={stressLevel}
                  onChange={e => setStressLevel(Number(e.target.value))}
                  className="w-full accent-[#08352A] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 font-medium">
                  <span>{isRw ? 'Ntuze' : 'Peaceful'}</span>
                  <span>{isRw ? 'Biringaniye' : 'Moderate'}</span>
                  <span>{isRw ? 'Bikabije' : 'Intense'}</span>
                </div>
              </div>
            </div>

            {/* Step 3: Sleep Quality */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                <Moon size={14} className="text-indigo-600" />
                {isRw ? '2. Ibitotsi by’ijoro ryakeye' : '2. Last Night’s Sleep Quality'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SLEEP_OPTIONS.map(opt => {
                  const isSel = sleepQuality === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setSleepQuality(opt.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        isSel
                          ? 'bg-[#08352A] text-white border-[#08352A] shadow-xs'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <span className="text-lg">{opt.icon}</span>
                      <span className="text-[11px] font-semibold">
                        {isRw ? opt.rw : opt.en}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Contextual Tags */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                <Tag size={14} className="text-teal-600" />
                {isRw ? '3. Ni ibihe byagize uruhare?' : '3. What shaped your day?'}
              </label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map(tag => {
                  const active = selectedTags.includes(tag.id);
                  return (
                    <button
                      type="button"
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                        active
                          ? 'bg-[#154E3F] text-white border-[#154E3F]'
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {isRw ? tag.rw : tag.en}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 5: Personal Private Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText size={14} className="text-[#08352A]" />
                  {isRw ? '4. Inyandiko bwite / Ibyo wifuza kubika' : '4. Personal Reflection (Optional)'}
                </span>
                <span className="text-[10px] text-neutral-400 font-normal">
                  {isRw ? 'Ntabwo bisabwa' : 'Private to you'}
                </span>
              </label>
              <textarea
                value={reflectionNote}
                onChange={e => setReflectionNote(e.target.value)}
                rows={3}
                placeholder={
                  isRw
                    ? 'Niba hari icyo wifuza kwandika cyangwa kwibuka ku munsi wawe...'
                    : 'A thought, an event, or something you observed about your day...'
                }
                className="w-full text-xs p-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#08352A] transition-all"
              />
            </div>

            {/* Step 6: Confidentiality & Clinician Sharing Toggle */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl ${shareWithClinician ? 'bg-[#08352A] text-[#21B48D]' : 'bg-neutral-200 text-neutral-600'}`}>
                  {shareWithClinician ? <ShieldCheck size={18} /> : <Lock size={18} />}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-neutral-900">
                    {isRw ? 'Sangira ibi n’umuganga / inzobere yawe' : 'Share summary with assigned clinician'}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {isRw
                      ? 'Bifasha muganga wawe kumenya imigendekere y’umutuzo wawe mu buryo bw’ibanga.'
                      : 'Allows your trusted care provider to review your wellbeing trends with confidentiality.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShareWithClinician(!shareWithClinician)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  shareWithClinician ? 'bg-[#08352A]' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    shareWithClinician ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Submit Action */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 px-6 rounded-2xl bg-[#08352A] hover:bg-[#0D3F33] text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin text-[#21B48D]" />
                    <span>{isRw ? 'Biri kubikwa...' : 'Saving reflection...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} className="text-[#21B48D]" />
                    <span>{isRw ? 'Bika Ibi Suzuma ry’Uyu Munsi' : 'Complete Self-Check-In'}</span>
                  </>
                )}
              </button>
            </div>

            {successSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2"
              >
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>
                  {isRw
                    ? 'Murakoze! Uko wiyumva byabitswe neza muri gahunda yawe.'
                    : 'Check-in saved securely! Your longitudinal patterns have been updated.'}
                </span>
              </motion.div>
            )}
          </form>
        </div>

        {/* ── RIGHT: LONGITUDINAL WELLBEING INSIGHTS (5 COLS) ── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Trends Over Time Chart */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-[#08352A]" />
                <h3 className="font-bold text-sm text-neutral-900">
                  {isRw ? 'Ihindagurika ry’Umutuzo' : 'Wellbeing Over Time'}
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-neutral-400">
                {history.length} {isRw ? 'isuzuma' : 'entries'}
              </span>
            </div>

            {chartData.length > 1 ? (
              <div className="h-48 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#21B48D" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#21B48D" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        fontSize: '11px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#08352A"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#scoreGrad)"
                      name={isRw ? 'Umutuzo' : 'Wellbeing'}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-10 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                  <Activity size={18} />
                </div>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  {isRw
                    ? 'Kora isuzuma rimwe cyangwa abiri kugira ngo ubone uko umutuzo uhindagurika mu gitabo cyawe.'
                    : 'Log 2 or more check-ins to activate your longitudinal trend chart.'}
                </p>
              </div>
            )}

            {/* Non-diagnostic Reflection Note */}
            <div className="p-3.5 rounded-2xl bg-[#EBF7F2] border border-[#D4EDE1] text-xs text-[#08352A] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#145344]">
                <Sparkles size={14} className="text-[#21B48D]" />
                <span>{isRw ? 'Incamake y’Uko Umeranye' : 'Gentle Pattern Reflection'}</span>
              </div>
              <p className="text-[11px] text-[#246252] leading-relaxed">
                {trendInsight}
              </p>
            </div>
          </div>

          {/* Quick Connect to Human Support Navigator */}
          <div className="bg-gradient-to-br from-[#08352A] to-[#154E3F] text-white rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Compass size={20} className="text-[#21B48D]" />
              <h3 className="font-bold text-sm text-white">
                {isRw ? 'Ukeneye Kugisha Inama Umuntu?' : 'Need a human to listen?'}
              </h3>
            </div>
            <p className="text-xs text-[#A3C7BD] leading-relaxed">
              {isRw
                ? 'Igihe cyose wiyumvise uremerewe, urubuga rwacu ruguhuza n’abaganga b’inzobere, abajyanama b’umuryango, cyangwa imirongo y’ubutabazi ya leta.'
                : 'Whenever your self-reflection reveals heavier weight than you wish to carry alone, connect confidentially with human professionals or peer guides.'}
            </p>
            <button
              onClick={() => navigate('/patient/support-navigator')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#21B48D] hover:bg-[#1CA07D] text-[#08352A] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <span>{isRw ? 'Injira muri Support Navigator' : 'Open Support Navigator'}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Recent History Entries */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-500">
              {isRw ? 'Ibyo Uheruka Kwisuzuma' : 'Recent Reflections'}
            </h3>

            {history.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">
                {isRw ? 'Nta bisuzuma birakorwa.' : 'No previous check-ins yet.'}
              </p>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {history.slice(0, 5).map(item => {
                  const feeling = FEELINGS_LIST.find(f => f.id === item.primary_feeling);
                  const dateStr = new Date(item.created_at).toLocaleDateString(
                    isRw ? 'rw-RW' : 'en-US',
                    { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                  );
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-xl">{feeling?.emoji || '🌱'}</span>
                        <div className="space-y-0.5">
                          <p className="font-bold text-neutral-800">
                            {isRw ? feeling?.rw : feeling?.en}
                          </p>
                          {item.reflection_note && (
                            <p className="text-[11px] text-neutral-500 italic line-clamp-1">
                              "{item.reflection_note}"
                            </p>
                          )}
                          <p className="text-[10px] text-neutral-400">{dateStr}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border text-neutral-600 flex-shrink-0">
                        {item.overall_score}/5
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
