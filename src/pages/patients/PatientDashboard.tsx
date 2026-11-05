import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  Flame,
  Heart,
  Leaf,
  MessageCircle,
  MoreHorizontal,
  Play,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wind
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

type Mood = {
  id: string;
  label: string;
  emoji: string;
  score: number;
  mood: string;
};

const moods: Mood[] = [
  { id: 'great', label: 'Great', emoji: '😁', score: 5, mood: 'happy' },
  { id: 'good', label: 'Good', emoji: '😊', score: 4, mood: 'calm' },
  { id: 'okay', label: 'Okay', emoji: '😐', score: 3, mood: 'neutral' },
  { id: 'low', label: 'Low', emoji: '😔', score: 2, mood: 'sad' },
  { id: 'stressed', label: 'Stressed', emoji: '😟', score: 1, mood: 'anxious' }
];

const quickLinks = [
  { label: 'AI Chat', icon: Bot, to: '/patient/chat', color: 'bg-[#E7F5EF] text-[#16775B]' },
  { label: 'Progress', icon: TrendingUp, to: '/patient/progress', color: 'bg-[#EAF1FF] text-[#4A70C7]' },
  { label: 'Community', icon: Users, to: '/patient/community', color: 'bg-[#FFF3E5] text-[#BF7935]' },
  { label: 'Professionals', icon: Heart, to: '/patient/professionals', color: 'bg-[#FCECF0] text-[#C45A78]' },
  { label: 'Education Hub', icon: BookOpen, to: '/patient/education', color: 'bg-[#F0ECFF] text-[#745FC1]' }
];

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedMood, setSelectedMood] = useState('good');
  const [savingMood, setSavingMood] = useState(false);
  const [moodMessage, setMoodMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileActionError, setProfileActionError] = useState('');

  useEffect(() => {
    let active = true;

    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active || !session) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Unable to load patient profile:', error);
      }
      if (active) {
        setUserProfile(data || { full_name: session.user.email?.split('@')[0] || 'there' });
      }
    };

    fetchUserData().catch((error: unknown) => {
      console.error('Unable to load patient dashboard:', error);
    });

    return () => {
      active = false;
    };
  }, []);

  const displayName = userProfile?.full_name?.trim().split(/\s+/)[0] || 'there';
  const initials = (userProfile?.full_name || 'U')
    .split(/\s+/)
    .filter(Boolean)
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const today = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date());
  const selectedMoodOption = moods.find((mood) => mood.id === selectedMood) || moods[1];

  const saveMood = async () => {
    setSavingMood(true);
    setMoodMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Your session has expired. Please sign in again to save your check-in.');
      }

      const { error } = await supabase.from('mood_logs').insert({
        patient_id: session.user.id,
        mood_score: selectedMoodOption.score,
        mood: selectedMoodOption.mood,
        emoji: selectedMoodOption.emoji,
        logged_at: new Date().toISOString()
      });

      if (error) throw error;
      setMoodMessage({ text: `Your ${selectedMoodOption.label.toLowerCase()} check-in is saved.`, error: false });
    } catch (error) {
      console.error('Unable to save mood check-in:', error);
      setMoodMessage({
        text: error instanceof Error ? error.message : 'We could not save your check-in. Please try again.',
        error: true
      });
    } finally {
      setSavingMood(false);
    }
  };

  const openBreathingActivity = () => {
    sessionStorage.setItem(
      'humura_prefilled_prompt',
      'Please guide me through a calming 3-minute breathing break.'
    );
    navigate('/patient/chat');
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Unable to sign out:', error);
      setProfileActionError('We could not sign you out. Please try again.');
      return;
    }
    navigate('/welcome');
  };

  return (
    <div className="min-h-full bg-[#F5F8F5] px-4 py-6 text-[#173D32] sm:px-7 sm:py-8 lg:px-10">
      <div className="mx-auto w-full max-w-[1480px] space-y-7">
        <header className="relative isolate overflow-hidden rounded-[2rem] border border-[#E6EEE8] bg-white px-5 py-5 shadow-[0_8px_30px_rgba(27,65,48,0.04)] sm:px-8 sm:py-6">
          <div className="pointer-events-none absolute -right-10 -top-20 -z-10 h-64 w-64 rounded-full bg-[#EDF7EE]" />
          <div className="pointer-events-none absolute right-40 top-0 -z-10 h-32 w-32 rounded-full bg-[#F7FAF3]" />
          <Leaf className="pointer-events-none absolute right-10 top-4 -z-10 hidden rotate-[-28deg] text-[#D4E8D9] sm:block" size={92} strokeWidth={1} />
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#5D8B75]">
                <span className="h-2 w-2 rounded-full bg-[#49A77A]" />
                Your wellbeing space
              </div>
              <h1 className="text-[1.7rem] font-bold leading-tight tracking-[-0.04em] text-[#153C30] sm:text-3xl">
                👋 Welcome back, {displayName}!
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#74877B] sm:text-base">
                Your wellbeing matters. Take one small step forward today.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 lg:justify-end">
              <div className="flex items-center gap-2 rounded-2xl border border-[#E9F0EA] bg-white/80 px-3 py-2.5 text-[11px] font-medium text-[#526F60] sm:px-4 sm:py-3 sm:text-sm">
                <CalendarDays size={17} className="text-[#39805F]" />
                <span className="sm:hidden">{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date())}</span>
                <span className="hidden sm:inline">{today}</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/patient/notifications')}
                aria-label="View notifications, 2 unread"
                className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E5EEE7] bg-white text-[#426451] transition hover:-translate-y-0.5 hover:border-[#B9D7C2] hover:shadow-sm"
              >
                <Bell size={19} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-[#E67C5B]" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  aria-expanded={profileOpen}
                  className="flex items-center gap-2 rounded-2xl border border-[#E5EEE7] bg-white py-1.5 pl-1.5 pr-2.5 transition hover:border-[#B9D7C2]"
                >
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} alt="" className="h-8 w-8 rounded-xl object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#DDEFE4] text-xs font-bold text-[#267451]">
                      {initials}
                    </span>
                  )}
                  <ChevronDown size={15} className="text-[#718477]" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full z-30 mt-2 w-48 rounded-2xl border border-[#E6EEE8] bg-white p-2 shadow-xl">
                    {profileActionError && <p role="alert" className="px-3 py-2 text-xs text-red-700">{profileActionError}</p>}
                    <button
                      type="button"
                      onClick={() => {
                        setProfileActionError('');
                        navigate('/patient/settings');
                      }}
                      className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[#315343] hover:bg-[#F3F8F4]"
                    >
                      View profile
                    </button>
                    <button
                      type="button"
                      onClick={signOut}
                      className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[#A64D4D] hover:bg-red-50"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <section className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#176B4B] via-[#14593F] to-[#0D4937] p-5 text-white shadow-[0_18px_40px_rgba(15,77,54,0.15)] sm:p-8 lg:p-9">
          <div className="pointer-events-none absolute -right-12 -top-16 -z-10 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-1 top-5 -z-10 h-40 w-40 rounded-full bg-[#BFE8C7]/10 blur-2xl" />
          <Leaf className="pointer-events-none absolute bottom-[-18px] right-7 -z-10 rotate-[-30deg] text-white/10" size={148} strokeWidth={0.8} />
          <div className="grid gap-8 xl:grid-cols-[1fr_260px] xl:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#D9F0E2]">
                <Sparkles size={14} />
                A moment for yourself
              </div>
              <h2 className="text-2xl font-bold tracking-[-0.035em] sm:text-3xl">
                😊 How are you feeling today?
              </h2>
              <p className="mt-2 text-sm text-[#D1E6D8]">There are no right or wrong answers. Check in with yourself.</p>

              <div className="mt-6 grid grid-cols-5 gap-2 sm:mt-7 sm:gap-3">
                {moods.map((mood) => {
                  const isSelected = selectedMood === mood.id;
                  return (
                    <button
                      key={mood.id}
                      type="button"
                      onClick={() => {
                        setSelectedMood(mood.id);
                        setMoodMessage(null);
                      }}
                      aria-pressed={isSelected}
                      className={`group flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-2xl border px-1 py-3 transition duration-200 hover:-translate-y-1 sm:min-h-[120px] ${
                        isSelected
                          ? 'border-white bg-white text-[#19563E] shadow-lg shadow-black/10'
                          : 'border-white/10 bg-white/[0.09] text-white hover:border-white/35 hover:bg-white/[0.15]'
                      }`}
                    >
                      <span className="text-3xl transition-transform group-hover:scale-110 sm:text-[2.4rem]" role="img" aria-label={mood.label}>
                        {mood.emoji}
                      </span>
                      <span className="text-[10px] font-semibold sm:text-sm">{mood.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={saveMood}
                  disabled={savingMood}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#D9F0DF] px-4 py-2.5 text-sm font-bold text-[#14583E] transition hover:bg-white disabled:cursor-wait disabled:opacity-70"
                >
                  {savingMood ? 'Saving…' : 'Save today’s check-in'}
                  {!savingMood && <ArrowRight size={16} />}
                </button>
                {moodMessage && (
                  <p role="status" className={`text-xs font-semibold ${moodMessage.error ? 'text-[#FFD4CA]' : 'text-[#D9F0DF]'}`}>
                    {moodMessage.error ? moodMessage.text : <><Check size={14} className="mr-1 inline" />{moodMessage.text}</>}
                  </p>
                )}
              </div>
            </div>

            <div className="relative hidden min-h-[220px] items-center justify-center xl:flex">
              <div className="absolute h-48 w-48 rounded-full border border-white/10" />
              <div className="absolute h-36 w-36 rounded-full bg-[#B5D99A]/15 blur-xl" />
              <div className="relative flex h-36 w-36 flex-col items-center justify-center rounded-[2.5rem] border border-white/20 bg-white/10 text-center shadow-2xl backdrop-blur-sm">
                <span className="text-5xl" role="img" aria-label={selectedMoodOption.label}>{selectedMoodOption.emoji}</span>
                <span className="mt-2 text-xs font-semibold text-[#E4F3E8]">Your feeling is valid</span>
              </div>
              <Leaf className="absolute bottom-8 left-4 rotate-[-35deg] text-[#B5D99A]/50" size={44} />
              <Sparkles className="absolute right-7 top-8 text-[#E6D895]" size={22} />
            </div>
          </div>
        </section>

        <section aria-labelledby="wellbeing-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-[#7D9986]">Your week at a glance</p>
              <h2 id="wellbeing-heading" className="text-xl font-bold tracking-[-0.03em] text-[#1C4434] sm:text-2xl">📊 Your Wellbeing Today</h2>
            </div>
            <button type="button" onClick={() => navigate('/patient/progress')} className="inline-flex items-center gap-1 text-sm font-bold text-[#24724F] transition hover:gap-2">
              View Full Progress <ArrowRight size={16} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={TrendingUp} iconStyle="bg-[#E4F3E9] text-[#39875B]" label="Your Journey" value="Improving" detail="Compared to last week" />
            <StatCard icon={CalendarDays} iconStyle="bg-[#EAF0FF] text-[#5574C8]" label="Check-ins" value="4 this week" detail={<span className="inline-flex items-center gap-1 text-[#31835A]"><ArrowUpRight size={13} /> +1</span>} />
            <StatCard icon={Star} iconStyle="bg-[#FFF4DE] text-[#C78B2A]" label="Activities" value="3 completed" detail="This week" />
            <StatCard icon={Flame} iconStyle="bg-[#FDEBE5] text-[#D87855]" label="Consistency" value="5-day streak" detail="Keep going!" />
          </div>
        </section>

        <section className="relative isolate overflow-hidden rounded-[1.8rem] bg-[#103F32] p-6 text-white shadow-[0_16px_34px_rgba(15,63,48,0.12)] sm:p-8">
          <div className="pointer-events-none absolute -right-8 -top-16 -z-10 h-56 w-56 rounded-full bg-[#2D8060]/25 blur-2xl" />
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#BCE2CC]">
                <Sparkles size={14} />
                A little perspective from Humura
              </div>
              <h2 className="text-xl font-bold tracking-[-0.025em] sm:text-2xl">✨ Your Humura AI Insight</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#D0E4D8] sm:text-base">
                Based on your recent check-ins, you have been consistently engaging with your wellbeing journey.
              </p>
              <button
                type="button"
                onClick={() => navigate('/patient/progress')}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#D8F0E1] px-4 py-2.5 text-sm font-bold text-[#174D39] transition hover:bg-white"
              >
                Explore My Insights <ArrowRight size={16} />
              </button>
            </div>
            <div className="relative mx-auto flex h-32 w-32 items-center justify-center md:mr-6 md:h-36 md:w-36">
              <div className="absolute inset-0 rounded-full border border-[#B2E6C5]/15" />
              <div className="absolute inset-3 rounded-full bg-[#4C9C74]/20 blur-sm" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/20 bg-gradient-to-br from-[#5AA17A] to-[#246448] shadow-xl">
                <Bot size={48} strokeWidth={1.35} className="text-[#F3FFF5]" />
              </div>
              <Sparkles className="absolute right-1 top-3 text-[#DCEB9C]" size={18} />
              <span className="absolute bottom-1 left-0 h-3 w-3 rounded-full bg-[#C9E88C] shadow-[0_0_14px_#C9E88C]" />
            </div>
          </div>
        </section>

        <section aria-labelledby="actions-heading">
          <div className="mb-4">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-[#7D9986]">Here whenever you need us</p>
            <h2 id="actions-heading" className="text-xl font-bold tracking-[-0.03em] text-[#1C4434] sm:text-2xl">What would you like to do today?</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ActionCard icon={MessageCircle} iconStyle="bg-[#E2F3EA] text-[#23815C]" title="Talk with Humura AI" link="AI Chat" onClick={() => navigate('/patient/chat')} />
            <ActionCard icon={Activity} iconStyle="bg-[#E8EEFF] text-[#5B6FC2]" title="Explore My Progress" link="Progress" onClick={() => navigate('/patient/progress')} />
            <ActionCard icon={Wind} iconStyle="bg-[#FFF2D8] text-[#C4892E]" title="Try a Wellness Activity" link="Activity" onClick={openBreathingActivity} />
            <ActionCard icon={Heart} iconStyle="bg-[#FBE9ED] text-[#C25A72]" title="Connect with a Professional" link="Professionals" onClick={() => navigate('/patient/professionals')} />
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-3">
          <section className="rounded-[1.6rem] border border-[#E6EEE8] bg-white p-5 shadow-[0_8px_24px_rgba(27,65,48,0.035)] sm:p-6 xl:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#85A08E]">A note for you</p>
                <h2 className="text-lg font-bold text-[#1C4434]">🔔 Important Updates</h2>
              </div>
              <button type="button" onClick={() => navigate('/patient/notifications')} className="text-xs font-bold text-[#287651] hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              <UpdateRow icon={Heart} iconStyle="bg-[#FCECEF] text-[#C35C71]" title="Follow-up Available" description="Your mental health professional would like to check in." onClick={() => navigate('/patient/notifications')} />
              <UpdateRow icon={CircleCheck} iconStyle="bg-[#EAF4EC] text-[#4A9563]" title="Weekly Report Ready" description="Your progress report is ready." onClick={() => navigate('/patient/progress')} />
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-[#E6EEE8] bg-white p-5 shadow-[0_8px_24px_rgba(27,65,48,0.035)] sm:p-6">
            <div className="mb-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#85A08E]">People in your corner</p>
              <h2 className="text-lg font-bold text-[#1C4434]">👨‍⚕️ Your Support</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img src="/doctor-hero.jpg" alt="Mental health professional" className="h-14 w-14 rounded-2xl object-cover object-top" />
                <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#48A66C]" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-[#264B39]">Dr. Aline Uwimana</h3>
                <p className="mt-0.5 text-xs text-[#7B8F80]">Mental Health Professional</p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#38835A]"><span className="h-1.5 w-1.5 rounded-full bg-[#4BA96C]" /> Available</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => navigate('/patient/professionals')} className="flex-1 rounded-xl border border-[#DDE9E0] px-3 py-2 text-xs font-bold text-[#32634A] transition hover:bg-[#F3F8F4]">View Profile</button>
              <button type="button" onClick={() => navigate('/patient/meet-professional')} className="flex-1 rounded-xl bg-[#176B4B] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#12583D]">Send Message</button>
            </div>
          </section>

          <section className="relative isolate overflow-hidden rounded-[1.6rem] border border-[#E9E8D9] bg-[#FBFAF1] p-5 shadow-[0_8px_24px_rgba(27,65,48,0.035)] sm:p-6">
            <div className="pointer-events-none absolute -bottom-8 -right-5 -z-10 h-36 w-36 rounded-full bg-[#EDF1D9]" />
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9A9A71]">A gentle reset</p>
            <h2 className="text-lg font-bold text-[#304632]">🎯 A Small Step for Today</h2>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold leading-snug text-[#344C37]">🧘 Take a 3-minute breathing break</h3>
                <p className="mt-1 text-xs text-[#7C8972]">A short moment to reset.</p>
                <button type="button" onClick={openBreathingActivity} className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#43824F] transition hover:gap-2.5">
                  <Play size={13} fill="currentColor" /> Start Now <ArrowRight size={14} />
                </button>
              </div>
              <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[#F0F1DD] text-5xl sm:flex" role="img" aria-label="Person practicing mindfulness">
                🧘🏽‍♀️
              </div>
            </div>
          </section>
        </div>

        <section aria-labelledby="quick-access-heading">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#85A08E]">Your essentials</p>
              <h2 id="quick-access-heading" className="text-lg font-bold text-[#1C4434]">✨ Quick Access</h2>
            </div>
            <MoreHorizontal size={19} className="text-[#91A596]" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {quickLinks.map(({ label, icon: Icon, to, color }) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate(to)}
                className="group flex items-center gap-3 rounded-2xl border border-[#E8EEE8] bg-white p-3 text-left shadow-[0_4px_14px_rgba(27,65,48,0.025)] transition duration-200 hover:-translate-y-1 hover:border-[#C8DCCB] hover:shadow-md sm:p-3.5"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color} transition-transform group-hover:scale-105`}>
                  <Icon size={18} />
                </span>
                <span className="text-xs font-bold text-[#44634F] sm:text-sm">{label}</span>
              </button>
            ))}
          </div>
        </section>

        <footer className="relative isolate overflow-hidden rounded-[1.8rem] bg-gradient-to-r from-[#0D4937] via-[#155A40] to-[#176B4B] px-5 py-7 text-white shadow-[0_16px_34px_rgba(15,63,48,0.12)] sm:px-8 sm:py-8">
          <Leaf className="pointer-events-none absolute -left-3 -top-6 -z-10 rotate-[35deg] text-white/[0.08]" size={110} strokeWidth={1} />
          <Leaf className="pointer-events-none absolute -bottom-10 right-16 -z-10 rotate-[-28deg] text-white/[0.08]" size={130} strokeWidth={1} />
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="mb-2 flex items-center gap-2 text-[#C6E6D1]"><Heart size={16} fill="currentColor" /><span className="text-[10px] font-bold uppercase tracking-[0.17em]">Here for you, every day</span></div>
              <h2 className="text-xl font-bold tracking-[-0.025em] sm:text-2xl">💚 Remember, You’re Not Alone</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#D1E6D8]">Humura AI is here to support you throughout your wellbeing journey.</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button type="button" onClick={() => navigate('/patient/chat')} className="inline-flex items-center gap-2 rounded-xl bg-[#E2F2E6] px-4 py-2.5 text-xs font-bold text-[#164D37] transition hover:bg-white">
                Talk to Humura AI <ArrowRight size={15} />
              </button>
              <button type="button" onClick={() => navigate('/patient/professionals')} className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20">
                Explore Support <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconStyle,
  label,
  value,
  detail
}: {
  icon: React.ComponentType<{ size?: number }>;
  iconStyle: string;
  label: string;
  value: string;
  detail: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.4rem] border border-[#E6EEE8] bg-white p-4 shadow-[0_6px_20px_rgba(27,65,48,0.03)] transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconStyle}`}><Icon size={19} /></span>
        <ArrowUpRight size={16} className="text-[#A5B6A8]" />
      </div>
      <p className="mt-4 text-xs font-semibold text-[#809286]">{label}</p>
      <p className="mt-1 text-lg font-bold tracking-[-0.02em] text-[#264B39]">{value}</p>
      <div className="mt-1 text-xs text-[#8A9B8F]">{detail}</div>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  iconStyle,
  title,
  link,
  onClick
}: {
  icon: React.ComponentType<{ size?: number }>;
  iconStyle: string;
  title: string;
  link: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[124px] flex-col items-start justify-between rounded-[1.4rem] border border-[#E6EEE8] bg-white p-4 text-left shadow-[0_6px_20px_rgba(27,65,48,0.03)] transition duration-200 hover:-translate-y-1 hover:shadow-md sm:p-5"
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconStyle}`}><Icon size={19} /></span>
      <span className="mt-4 flex w-full items-center justify-between gap-2">
        <span>
          <span className="block text-sm font-bold leading-snug text-[#345441]">{title}</span>
          <span className="mt-1 block text-xs font-semibold text-[#829287]">{link}</span>
        </span>
        <ArrowRight size={16} className="shrink-0 text-[#4B8A64] transition-transform group-hover:translate-x-1" />
      </span>
    </button>
  );
}

function UpdateRow({
  icon: Icon,
  iconStyle,
  title,
  description,
  onClick
}: {
  icon: React.ComponentType<{ size?: number }>;
  iconStyle: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-start gap-3 rounded-xl border border-[#EEF2EE] p-3 text-left transition hover:border-[#D9E7DC] hover:bg-[#FAFCFA]">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}><Icon size={16} /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#345441]">{title}</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#39815A]">View <ArrowRight size={11} /></span>
        </span>
        <span className="mt-1 block text-[11px] leading-relaxed text-[#809085]">{description}</span>
      </span>
    </button>
  );
}
