import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Smile,
  Sparkles,
  HeartHandshake,
  Wind,
  Sun,
  Heart,
  Meh,
  Moon,
  Frown,
  Flame,
  Activity,
  MoreHorizontal,
  SendHorizontal,
  ClipboardList,
  ChevronRight,
  ChevronDown,
  User,
  LogOut,
  Sparkles as BotIcon,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface MoodOption {
  id: string;
  label_en: string;
  label_rw: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  bgClass: string;
  borderClass: string;
  iconColor: string;
  textColor: string;
  defaultThought_en: string;
  defaultThought_rw: string;
}

export default function PatientDashboard() {
  const { t, i18n } = useTranslation();
  const isRw = i18n.language?.startsWith('rw');
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<string>('anxious');
  const [thoughtInput, setThoughtInput] = useState<string>(
    "I've been feeling very anxious lately..."
  );
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [recentJournal, setRecentJournal] = useState<{
    text: string;
    date: string;
  }>({
    text: "I feel overwhelmed with school and family...",
    date: "Today • Private"
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        setUserProfile(profile || { full_name: session.user.email?.split('@')[0] });

        // Fetch recent journal / mood entry if available
        const { data: latestLog } = await supabase
          .from('mood_logs')
          .select('notes, score, created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestLog && latestLog.notes) {
          setRecentJournal({
            text: latestLog.notes,
            date: "Today • Private"
          });
        }
      } else {
        // Fallback demo user Tuyikunde matching screenshot
        setUserProfile({ full_name: 'Tuyikunde' });
      }
    } catch (err) {
      console.error(err);
      setUserProfile({ full_name: 'Tuyikunde' });
    } finally {
      setLoading(false);
    }
  };

  const moods: MoodOption[] = [
    {
      id: 'happy',
      label_en: 'Happy',
      label_rw: 'Uwishimye',
      icon: Smile,
      bgClass: 'bg-[#FEF8E7]',
      borderClass: 'border-[#FCE9B6] hover:border-[#F6C343]',
      iconColor: 'text-[#D97706]',
      textColor: 'text-[#B45309]',
      defaultThought_en: "I'm feeling positive and accomplished today!",
      defaultThought_rw: "Ndishimye kandi meze neza cyane uyu munsi!"
    },
    {
      id: 'excited',
      label_en: 'Excited',
      label_rw: 'Uwishimye cyane',
      icon: Sparkles,
      bgClass: 'bg-[#FFF0F0]',
      borderClass: 'border-[#FFD9D9] hover:border-[#F87171]',
      iconColor: 'text-[#EF4444]',
      textColor: 'text-[#DC2626]',
      defaultThought_en: "Looking forward to great things ahead today!",
      defaultThought_rw: "Mfite amashyushyu y'ibintu byiza biri imbere!"
    },
    {
      id: 'grateful',
      label_en: 'Grateful',
      label_rw: 'Ushimiye',
      icon: HeartHandshake,
      bgClass: 'bg-[#EDF9F3]',
      borderClass: 'border-[#D1F2E2] hover:border-[#34D399]',
      iconColor: 'text-[#10B981]',
      textColor: 'text-[#059669]',
      defaultThought_en: "Grateful for the support and peace around me.",
      defaultThought_rw: "Ndashima kubera umutuzo n'ubufasha mfite."
    },
    {
      id: 'calm',
      label_en: 'Calm',
      label_rw: 'Utuje',
      icon: Wind,
      bgClass: 'bg-[#EFF6FF]',
      borderClass: 'border-[#D6E7FF] hover:border-[#60A5FA]',
      iconColor: 'text-[#3B82F6]',
      textColor: 'text-[#2563EB]',
      defaultThought_en: "My mind feels relaxed and grounded.",
      defaultThought_rw: "Umutima wanjye uratuje kandi uratekanye."
    },
    {
      id: 'hopeful',
      label_en: 'Hopeful',
      label_rw: 'Ufite Ibyiringiro',
      icon: Sun,
      bgClass: 'bg-[#F5F2FF]',
      borderClass: 'border-[#E4DCFB] hover:border-[#A78BFA]',
      iconColor: 'text-[#7C3AED]',
      textColor: 'text-[#6D28D9]',
      defaultThought_en: "Believing things will continue to improve step by step.",
      defaultThought_rw: "Mfite ibyiringiro ko byose biri bugende neza."
    },
    {
      id: 'loved',
      label_en: 'Loved',
      label_rw: 'Ukundwa',
      icon: Heart,
      bgClass: 'bg-[#FFF0F6]',
      borderClass: 'border-[#FFD6E8] hover:border-[#F472B6]',
      iconColor: 'text-[#EC4899]',
      textColor: 'text-[#DB2777]',
      defaultThought_en: "Feeling appreciated and cared for today.",
      defaultThought_rw: "Numva nkunzwe kandi nitabwaho n'abandi."
    },
    {
      id: 'neutral',
      label_en: 'Neutral',
      label_rw: 'Birasanzwe',
      icon: Meh,
      bgClass: 'bg-[#F8F9FA]',
      borderClass: 'border-[#E9ECEF] hover:border-[#CED4DA]',
      iconColor: 'text-[#6C757D]',
      textColor: 'text-[#495057]',
      defaultThought_en: "Just getting through the day at a steady pace.",
      defaultThought_rw: "Umunsi uri kugenda gake gake bisanzwe."
    },
    {
      id: 'tired',
      label_en: 'Tired',
      label_rw: 'Unaniwe',
      icon: Moon,
      bgClass: 'bg-[#EFF6FF]',
      borderClass: 'border-[#DAE8FC] hover:border-[#93C5FD]',
      iconColor: 'text-[#3B82F6]',
      textColor: 'text-[#2563EB]',
      defaultThought_en: "Feeling drained and needing rest and restorative sleep.",
      defaultThought_rw: "Naniwe cyane kandi nkeneye kuruhuka neza."
    },
    {
      id: 'sad',
      label_en: 'Sad',
      label_rw: 'Ubabaye',
      icon: Frown,
      bgClass: 'bg-[#F1F3FE]',
      borderClass: 'border-[#DDE1FC] hover:border-[#818CF8]',
      iconColor: 'text-[#4F46E5]',
      textColor: 'text-[#4338CA]',
      defaultThought_en: "Carrying some emotional weight and sadness today.",
      defaultThought_rw: "Mfite agahinda n'intege nke mu mutima uyu munsi."
    },
    {
      id: 'angry',
      label_en: 'Angry',
      label_rw: 'Urakaye',
      icon: Flame,
      bgClass: 'bg-[#FFF1F0]',
      borderClass: 'border-[#FED0CE] hover:border-[#F87171]',
      iconColor: 'text-[#E11D48]',
      textColor: 'text-[#BE123C]',
      defaultThought_en: "Feeling frustrated or overwhelmed by circumstances.",
      defaultThought_rw: "Ndababaye cyane kandi ndarakaye ubu."
    },
    {
      id: 'anxious',
      label_en: 'Anxious',
      label_rw: 'Ufite Ubwoba',
      icon: Activity,
      bgClass: 'bg-[#FEFCE8]',
      borderClass: 'border-[#FEF08A] hover:border-[#FACC15]',
      iconColor: 'text-[#CA8A04]',
      textColor: 'text-[#A16207]',
      defaultThought_en: "I've been feeling very anxious lately...",
      defaultThought_rw: "Mfite impungenge n'ubwoba bukomeye muri iyi minsi..."
    },
    {
      id: 'other',
      label_en: 'Other',
      label_rw: 'Ikindi',
      icon: MoreHorizontal,
      bgClass: 'bg-[#ECFDF5]',
      borderClass: 'border-[#C6F6D5] hover:border-[#34D399]',
      iconColor: 'text-[#0D9488]',
      textColor: 'text-[#0F766E]',
      defaultThought_en: "Reflecting on mixed feelings right now...",
      defaultThought_rw: "Ntekerereza ku bintu bitandukanye muri uyu mwanya..."
    }
  ];

  const handleSelectMood = (mood: MoodOption) => {
    setSelectedMood(mood.id);
    setThoughtInput(isRw ? mood.defaultThought_rw : mood.defaultThought_en);
  };

  const handleSendThought = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!thoughtInput.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('mood_logs').insert({
          user_id: session.user.id,
          score: selectedMood === 'happy' || selectedMood === 'excited' ? 5 : selectedMood === 'anxious' || selectedMood === 'sad' ? 2 : 3,
          notes: thoughtInput.trim()
        });
      }

      setRecentJournal({
        text: thoughtInput.trim(),
        date: "Today • Private"
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);

      // Navigate to chat with preloaded thought to support user
      sessionStorage.setItem('humura_prefilled_prompt', thoughtInput.trim());
      navigate('/patient/chat');
    } catch (err) {
      console.error(err);
      navigate('/patient/chat');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const displayName = userProfile?.full_name?.split(' ')[0] || 'Tuyikunde';

  return (
    <div className="min-h-screen bg-[#F4F8F6] p-4 sm:p-8 lg:p-10 font-poppins text-[#08352A]">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── TOP HEADER MATCHING PHOTO ── */}
        <div className="flex items-center justify-between gap-4 pt-1 pb-2">
          
          {/* Left Greeting with Teal Icon Badge */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#E2F2EC] border border-[#CCE5DC] flex items-center justify-center text-[#08352A] shadow-xs">
              <BotIcon size={24} className="text-[#08352A]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08352A] tracking-tight leading-tight">
                {isRw ? `Muraho, ${displayName}` : `Hello, ${displayName}`}
              </h1>
              <p className="text-xs sm:text-sm text-[#5E8E81] font-medium mt-0.5">
                {isRw ? 'Umeze ute uyu munsi?' : 'How are you feeling today?'}
              </p>
            </div>
          </div>

          {/* Right Action / Direct Specialist Consultation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/patient/meet-professional')}
              className="px-4 py-2 bg-[#08352A] hover:bg-[#153C32] text-white font-extrabold text-xs rounded-2xl transition-all shadow-xs flex items-center gap-2"
            >
              <BotIcon size={14} className="text-[#21B48D]" />
              <span>{isRw ? 'Gana Inzobere' : 'Consult Specialist'}</span>
            </button>
          </div>

        </div>

        {/* ── MAIN CARD: HOW ARE YOU FEELING TODAY? (100% MATCH) ── */}
        <div className="bg-white rounded-3xl sm:rounded-[2rem] p-6 sm:p-8 border border-[#DFEBE5] shadow-xs">
          
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#08352A] tracking-tight mb-6">
            {isRw ? 'Umeze ute uyu munsi?' : 'How are you feeling today?'}
          </h2>

          {/* 3 ROWS OF 4 MOOD CARDS USING LUCIDE ICONS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 mb-7">
            {moods.map((mood) => {
              const Icon = mood.icon;
              const isSelected = selectedMood === mood.id;

              return (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => handleSelectMood(mood)}
                  className={`${mood.bgClass} border ${
                    isSelected 
                      ? 'border-[#08352A] ring-2 ring-[#08352A]/20 shadow-md scale-102' 
                      : mood.borderClass
                  } rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-150 active:scale-95 group text-center min-h-[96px]`}
                >
                  <Icon
                    size={28}
                    className={`${mood.iconColor} transition-transform group-hover:scale-110`}
                  />
                  <span className={`text-xs sm:text-sm font-bold ${mood.textColor}`}>
                    {isRw ? mood.label_rw : mood.label_en}
                  </span>
                </button>
              );
            })}
          </div>

          {/* INPUT BAR WITH TEAL SEND BUTTON MATCHING PHOTO */}
          <form onSubmit={handleSendThought} className="relative mt-4">
            <div className="flex items-center bg-white border border-[#DCEBE3] rounded-full pl-5 pr-2 py-2 shadow-xs focus-within:border-[#21B48D] focus-within:ring-2 focus-within:ring-[#21B48D]/20 transition-all">
              <input
                type="text"
                value={thoughtInput}
                onChange={(e) => setThoughtInput(e.target.value)}
                placeholder={
                  isRw
                    ? 'Ubu ndumva mfite impungenge n’ubwoba...'
                    : "I've been feeling very anxious lately..."
                }
                className="w-full bg-transparent text-xs sm:text-sm text-[#08352A] placeholder-[#8DB4A8] outline-none font-medium pr-3"
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-full bg-[#08352A] hover:bg-[#154E3F] text-white flex items-center justify-center shadow-sm cursor-pointer transition-transform active:scale-90 flex-shrink-0"
                title="Send and talk with Humura AI"
              >
                <SendHorizontal size={17} className="text-white ml-0.5" />
              </button>
            </div>
          </form>

        </div>

        {/* ── CARD 2: RECENT JOURNAL ENTRY (100% MATCH) ── */}
        <div
          onClick={() => navigate('/patient/progress')}
          className="bg-white rounded-3xl sm:rounded-[2rem] p-6 border border-[#DFEBE5] shadow-xs cursor-pointer hover:shadow-md transition-all group"
        >
          {/* Top row */}
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#08352A] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <ClipboardList size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#08352A] group-hover:text-[#21B48D] transition-colors">
                  {isRw ? 'Ibyo Wanditse vuba mu Gitabo' : 'Recent Journal Entry'}
                </h3>
                <p className="text-[11px] font-semibold text-[#5E8E81] flex items-center gap-1.5 mt-0.5">
                  <span>{recentJournal.date}</span>
                </p>
              </div>
            </div>

            <ChevronRight
              size={18}
              className="text-[#5E8E81] group-hover:text-[#08352A] group-hover:translate-x-1 transition-all"
            />
          </div>

          {/* Snippet Row */}
          <div className="flex items-center gap-2.5 pt-1">
            <div className="w-5 h-5 rounded-full bg-[#E2F2EC] flex items-center justify-center text-[#21B48D] flex-shrink-0">
              <Lock size={10} className="text-[#21B48D]" />
            </div>
            <p className="text-xs sm:text-sm text-[#08352A] font-medium truncate">
              {recentJournal.text}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
