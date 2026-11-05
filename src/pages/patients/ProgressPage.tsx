import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, ArrowDownToLine, ArrowRight, ArrowUpRight, BookOpen, Check,
  CheckCircle2, ChevronDown, ChevronUp, CircleHelp, Clock3, Flame, Flower2,
  Heart, HeartHandshake, Lightbulb, LockKeyhole, MessageCircle, Plus, Send,
  ShieldCheck, Sparkles, Sprout, Target, TrendingDown, TrendingUp, Wind, X
} from 'lucide-react';
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

type MoodLog = {
  id: string;
  mood: string;
  score: number | null;
  created_at: string;
};

type JournalEntry = {
  id: string;
  created_at: string;
};

type LessonEntry = {
  lesson_id: string;
  completed_at: string;
};

type Goal = {
  id: string;
  title: string;
  target: number;
  progress: number;
};

type Period = 'week' | 'month' | 'threeMonths' | 'custom';
type ChartView = 'daily' | 'weekly' | 'monthly';
type ActivityItem = {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  icon: typeof Heart;
};

type AiReflection = {
  summary: string;
  recommendations: string[];
};

const PERIOD_DAYS: Record<Exclude<Period, 'custom'>, number> = {
  week: 7,
  month: 30,
  threeMonths: 90
};

const MOOD_DETAILS: Record<string, { label: string; emoji: string; score: number }> = {
  happy: { label: 'Happy', emoji: '😊', score: 5 },
  excited: { label: 'Excited', emoji: '🤩', score: 5 },
  grateful: { label: 'Grateful', emoji: '💚', score: 5 },
  loved: { label: 'Loved', emoji: '🫶', score: 5 },
  calm: { label: 'Calm', emoji: '😌', score: 4 },
  hopeful: { label: 'Hopeful', emoji: '🙂', score: 4 },
  neutral: { label: 'Neutral', emoji: '😐', score: 3 },
  tired: { label: 'Tired', emoji: '😴', score: 2 },
  sad: { label: 'Sad', emoji: '😔', score: 2 },
  anxious: { label: 'Anxious', emoji: '😟', score: 2 },
  angry: { label: 'Angry', emoji: '😣', score: 2 }
};

const cardClass = 'rounded-3xl border border-[#E1ECE6] bg-white shadow-[0_8px_24px_-20px_rgba(8,53,42,0.28)]';
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21B48D] focus-visible:ring-offset-2';

function toDateInputValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function dateLabel(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString(undefined, options ?? {
    month: 'short',
    day: 'numeric'
  });
}

function moodScore(log: MoodLog) {
  if (typeof log.score === 'number' && Number.isFinite(log.score)) {
    return log.score > 5 ? log.score / 2 : log.score;
  }
  return MOOD_DETAILS[log.mood.toLowerCase()]?.score ?? 3;
}

function averageScore(logs: MoodLog[]) {
  if (!logs.length) return null;
  return logs.reduce((total, log) => total + moodScore(log), 0) / logs.length;
}

function periodBounds(period: Period, customStart: string, customEnd: string) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  if (period === 'custom') {
    const start = customStart ? new Date(`${customStart}T00:00:00`) : new Date(end);
    const customFinish = customEnd ? new Date(`${customEnd}T23:59:59.999`) : end;
    return { start, end: customFinish };
  }
  const start = new Date(end);
  start.setDate(start.getDate() - PERIOD_DAYS[period] + 1);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function readGoals(storageKey: string): Goal[] {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((goal): goal is Goal =>
      typeof goal?.id === 'string' &&
      typeof goal?.title === 'string' &&
      Number.isFinite(goal?.target) &&
      Number.isFinite(goal?.progress)
    );
  } catch {
    return [];
  }
}

export default function ProgressPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [moods, setMoods] = useState<MoodLog[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [lessons, setLessons] = useState<LessonEntry[]>([]);
  const [supportContact, setSupportContact] = useState<{ name: string; specialty: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReflection, setAiReflection] = useState<AiReflection | null>(null);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [chartView, setChartView] = useState<ChartView>('daily');
  const [customStart, setCustomStart] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return toDateInputValue(date);
  });
  const [customEnd, setCustomEnd] = useState(() => toDateInputValue(new Date()));
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [insightsExpanded, setInsightsExpanded] = useState(false);
  const [shareMode, setShareMode] = useState<'professional' | 'whatsapp' | null>(null);
  const [shareConsent, setShareConsent] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState(3);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [weeklyExpanded, setWeeklyExpanded] = useState(false);
  const shareDialogRef = useRef<HTMLElement>(null);
  const shareCloseButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!shareMode) return;
    shareCloseButtonRef.current?.focus();
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShareMode(null);
        setShareConsent(false);
      }
      if (event.key !== 'Tab') return;
      const focusable = shareDialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleDialogKeys);
    return () => window.removeEventListener('keydown', handleDialogKeys);
  }, [shareMode]);

  useEffect(() => {
    let active = true;
    const loadProgress = async () => {
      setIsLoading(true);
      setLoadError(null);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        if (active) {
          setLoadError('We could not load your progress right now. Please try again.');
          setIsLoading(false);
        }
        return;
      }
      if (!session) {
        if (active) {
          setLoadError('Please sign in to view your wellbeing journey.');
          setIsLoading(false);
        }
        return;
      }

      const id = session.user.id;
      if (active) {
        setUserId(id);
        setGoals(readGoals(`humura-wellbeing-goals-${id}`));
      }

      const [moodResult, journalResult, lessonResult, connectionResult] = await Promise.all([
        supabase
          .from('mood_logs')
          .select('id, mood, score, created_at')
          .eq('user_id', id)
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('journals')
          .select('id, created_at')
          .eq('user_id', id)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('user_progress')
          .select('lesson_id, completed_at')
          .eq('user_id', id)
          .order('completed_at', { ascending: false })
          .limit(100),
        supabase
          .from('patient_caseload')
          .select('doctor_id')
          .eq('patient_id', id)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle()
      ]);

      if (!active) return;
      if (moodResult.error) {
        setLoadError('Your mood check-ins could not be loaded. Please refresh to try again.');
      } else {
        setMoods((moodResult.data ?? []) as MoodLog[]);
      }
      if (journalResult.error) console.warn('Progress journal history unavailable:', journalResult.error.message);
      else setJournals((journalResult.data ?? []) as JournalEntry[]);
      if (lessonResult.error) console.warn('Progress lesson history unavailable:', lessonResult.error.message);
      else setLessons((lessonResult.data ?? []) as LessonEntry[]);

      if (connectionResult.error) {
        console.warn('Progress support-team details unavailable:', connectionResult.error.message);
      } else if (connectionResult.data?.doctor_id) {
        const { data: professional, error: professionalError } = await supabase
          .from('profiles')
          .select('full_name, specialty')
          .eq('id', connectionResult.data.doctor_id)
          .maybeSingle();
        if (!active) return;
        if (professionalError) {
          console.warn('Progress support-team profile unavailable:', professionalError.message);
        } else if (professional?.full_name) {
          setSupportContact({
            name: professional.full_name,
            specialty: professional.specialty
          });
        }
      }
      setIsLoading(false);
    };

    void loadProgress();
    return () => { active = false; };
  }, []);

  const bounds = useMemo(
    () => periodBounds(period, customStart, customEnd),
    [period, customStart, customEnd]
  );
  const periodDurationMs = Math.max(bounds.end.getTime() - bounds.start.getTime() + 1, 86_400_000);
  const currentMoods = useMemo(
    () => moods.filter(log => {
      const timestamp = new Date(log.created_at).getTime();
      return timestamp >= bounds.start.getTime() && timestamp <= bounds.end.getTime();
    }),
    [moods, bounds]
  );

  useEffect(() => {
    if (isLoading || !currentMoods.length) {
      setAiReflection(null);
      setAiUnavailable(false);
      return;
    }

    const controller = new AbortController();
    const analyzeCheckIns = async () => {
      setIsAnalyzing(true);
      setAiUnavailable(false);
      try {
        const baseUrl = (import.meta.env.VITE_RENDER_BACKEND_URL || 'https://humura-ai-1.onrender.com').replace(/\/$/, '');
        const response = await fetch(`${baseUrl}/api/analyze-progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            moods: currentMoods.map(log => ({
              mood: log.mood,
              created_at: log.created_at
            })),
            journals: [],
            lang: 'en'
          })
        });
        if (!response.ok) throw new Error(`Progress insight request failed (${response.status}).`);
        const result = await response.json();
        if (typeof result.summary !== 'string' || !result.summary.trim()) {
          throw new Error('Progress insight response did not contain a summary.');
        }
        if (!controller.signal.aborted) {
          setAiReflection({
            summary: result.summary.trim(),
            recommendations: Array.isArray(result.recommendations)
              ? result.recommendations.filter((item: unknown): item is string => typeof item === 'string').slice(0, 3)
              : []
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn('AI progress reflection unavailable:', error);
          setAiReflection(null);
          setAiUnavailable(true);
        }
      } finally {
        if (!controller.signal.aborted) setIsAnalyzing(false);
      }
    };

    void analyzeCheckIns();
    return () => controller.abort();
  }, [currentMoods, isLoading]);

  const previousMoods = useMemo(
    () => moods.filter(log => {
      const timestamp = new Date(log.created_at).getTime();
      return timestamp >= bounds.start.getTime() - periodDurationMs && timestamp < bounds.start.getTime();
    }),
    [moods, bounds, periodDurationMs]
  );
  const currentAverage = averageScore(currentMoods);
  const previousAverage = averageScore(previousMoods);
  const moodDirection = currentAverage === null || previousAverage === null
    ? 'new'
    : currentAverage - previousAverage > 0.25
      ? 'up'
      : currentAverage - previousAverage < -0.25
        ? 'down'
        : 'steady';
  const moodDelta = currentAverage !== null && previousAverage !== null
    ? Math.round((currentAverage - previousAverage) * 10) / 10
    : null;
  const weeklyBounds = useMemo(() => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }, []);
  const weeklyMoods = useMemo(
    () => moods.filter(log => {
      const timestamp = new Date(log.created_at).getTime();
      return timestamp >= weeklyBounds.start.getTime() && timestamp <= weeklyBounds.end.getTime();
    }),
    [moods, weeklyBounds]
  );
  const previousWeeklyMoods = useMemo(
    () => moods.filter(log => {
      const timestamp = new Date(log.created_at).getTime();
      const previousStart = new Date(weeklyBounds.start);
      previousStart.setDate(previousStart.getDate() - 7);
      return timestamp >= previousStart.getTime() && timestamp < weeklyBounds.start.getTime();
    }),
    [moods, weeklyBounds]
  );
  const weeklyAverage = averageScore(weeklyMoods);
  const previousWeeklyAverage = averageScore(previousWeeklyMoods);
  const weeklyDirection = weeklyAverage === null || previousWeeklyAverage === null
    ? 'new'
    : weeklyAverage - previousWeeklyAverage > 0.25
      ? 'up'
      : weeklyAverage - previousWeeklyAverage < -0.25
        ? 'down'
        : 'steady';

  const trendData = useMemo(() => {
    const rangeStart = new Date(bounds.start);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(bounds.end);
    rangeEnd.setHours(0, 0, 0, 0);
    const days = Math.min(93, Math.max(1, Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000) + 1));
    const buckets: { key: string; date: Date; logs: MoodLog[]; comparisonLogs: MoodLog[] }[] = [];
    for (let offset = 0; offset < days; offset += 1) {
      const date = new Date(bounds.start);
      date.setDate(bounds.start.getDate() + offset);
      date.setHours(0, 0, 0, 0);
      const key = toDateInputValue(date);
      buckets.push({ key, date, logs: [], comparisonLogs: [] });
    }
    const bucketByKey = new Map(buckets.map(bucket => [bucket.key, bucket]));
    currentMoods.forEach(log => {
      const key = toDateInputValue(new Date(log.created_at));
      bucketByKey.get(key)?.logs.push(log);
    });
    const previousStart = bounds.start.getTime() - periodDurationMs;
    previousMoods.forEach(log => {
      const offset = Math.floor((new Date(log.created_at).getTime() - previousStart) / 86_400_000);
      if (offset >= 0 && offset < buckets.length) buckets[offset].comparisonLogs.push(log);
    });

    let grouped = buckets;
    if (chartView === 'weekly') {
      const weekly = new Map<string, { key: string; date: Date; logs: MoodLog[]; comparisonLogs: MoodLog[] }>();
      buckets.forEach(bucket => {
        const weekStart = new Date(bucket.date);
        weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
        const key = toDateInputValue(weekStart);
        if (!weekly.has(key)) weekly.set(key, { key, date: weekStart, logs: [], comparisonLogs: [] });
        weekly.get(key)!.logs.push(...bucket.logs);
        weekly.get(key)!.comparisonLogs.push(...bucket.comparisonLogs);
      });
      grouped = [...weekly.values()];
    } else if (chartView === 'monthly') {
      const monthly = new Map<string, { key: string; date: Date; logs: MoodLog[]; comparisonLogs: MoodLog[] }>();
      buckets.forEach(bucket => {
        const monthStart = new Date(bucket.date.getFullYear(), bucket.date.getMonth(), 1);
        const key = toDateInputValue(monthStart);
        if (!monthly.has(key)) monthly.set(key, { key, date: monthStart, logs: [], comparisonLogs: [] });
        monthly.get(key)!.logs.push(...bucket.logs);
        monthly.get(key)!.comparisonLogs.push(...bucket.comparisonLogs);
      });
      grouped = [...monthly.values()];
    }

    return grouped.map(bucket => ({
      ...bucket,
      average: averageScore(bucket.logs),
      previousAverage: averageScore(bucket.comparisonLogs),
      label: chartView === 'monthly'
        ? bucket.date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
        : chartView === 'weekly'
          ? dateLabel(bucket.key, { month: 'short', day: 'numeric' })
          : dateLabel(bucket.key, { weekday: 'short', day: 'numeric' }),
      count: bucket.logs.length
    }));
  }, [bounds, chartView, currentMoods, periodDurationMs, previousMoods]);

  const moodPatterns = useMemo(() => {
    const counts = new Map<string, number>();
    currentMoods.forEach(log => {
      const key = log.mood.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return sorted.map(([mood, count], index) => {
      const previousCount = previousMoods.filter(log => log.mood.toLowerCase() === mood).length;
      return {
        mood,
        count,
        share: currentMoods.length ? count / currentMoods.length : 0,
        detail: MOOD_DETAILS[mood] ?? { label: mood, emoji: '💚', score: 3 },
        trend: previousMoods.length === 0 || count === previousCount
          ? 'steady'
          : count > previousCount ? 'up' : 'down',
        isMostCommon: index === 0
      };
    });
  }, [currentMoods, previousMoods]);

  const activities = useMemo<ActivityItem[]>(() => [
    ...moods.map(log => ({
      id: `mood-${log.id}`,
      title: 'Mood check-in',
      category: 'Mood tracking',
      createdAt: log.created_at,
      icon: Heart
    })),
    ...journals.map(entry => ({
      id: `journal-${entry.id}`,
      title: 'Journal reflection',
      category: 'Personal reflection',
      createdAt: entry.created_at,
      icon: BookOpen
    })),
    ...lessons.map(lesson => ({
      id: `lesson-${lesson.lesson_id}`,
      title: 'Mental wellbeing lesson',
      category: 'Learning',
      createdAt: lesson.completed_at,
      icon: Sprout
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [journals, lessons, moods]);

  const inPeriodActivities = activities.filter(activity => {
    const timestamp = new Date(activity.createdAt).getTime();
    return timestamp >= bounds.start.getTime() && timestamp <= bounds.end.getTime();
  });
  const daysWithActivity = useMemo(() => {
    const activityDates = new Set(activities.map(activity => toDateInputValue(new Date(activity.createdAt))));
    let streak = 0;
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    if (!activityDates.has(toDateInputValue(day))) day.setDate(day.getDate() - 1);
    while (activityDates.has(toDateInputValue(day))) {
      streak += 1;
      day.setDate(day.getDate() - 1);
    }
    return streak;
  }, [activities]);

  const insights = useMemo(() => {
    const result: string[] = [];
    if (currentMoods.length === 0) {
      result.push('Your check-in history will appear here as you add mood check-ins.');
    } else if (moodPatterns[0]) {
      result.push(
        `${moodPatterns[0].detail.label} is the mood you logged most often in this period (${moodPatterns[0].count} ${moodPatterns[0].count === 1 ? 'check-in' : 'check-ins'}).`
      );
    }
    if (moodDirection === 'up' && moodDelta !== null) {
      result.push(`Your average check-in score is ${moodDelta} points higher than in the previous period.`);
    } else if (moodDirection === 'down' && moodDelta !== null) {
      result.push(`Your average check-in score is ${Math.abs(moodDelta)} points lower than in the previous period. This is one moment in a much bigger journey.`);
    } else if (moodDirection === 'steady') {
      result.push('Your average check-in score is similar to the previous period.');
    } else if (currentMoods.length > 1) {
      result.push(`You have checked in ${currentMoods.length} times. Thank you for taking a moment to notice how you feel.`);
    }
    if (inPeriodActivities.some(activity => activity.category === 'Learning') && inPeriodActivities.some(activity => activity.category === 'Personal reflection')) {
      result.push('You made time for both learning and personal reflection during this period.');
    } else if (inPeriodActivities.length > 1) {
      result.push('You showed up for your wellbeing in a few different ways. Small steps count.');
    }
    return result;
  }, [currentMoods.length, inPeriodActivities, moodDelta, moodDirection, moodPatterns]);

  const periodLabel = period === 'week' ? 'this week' : period === 'month' ? 'this month' : period === 'threeMonths' ? 'the last 3 months' : 'this selected period';
  const reflectionText = currentMoods.length === 0
    ? 'There are no mood check-ins in this period yet. Whenever you are ready, a quick check-in can help you reflect.'
    : moodDirection === 'up'
      ? `Your recent check-ins lean more positive than the previous period. You logged ${currentMoods.length} mood ${currentMoods.length === 1 ? 'check-in' : 'check-ins'} ${periodLabel}.`
      : moodDirection === 'down'
        ? `Your check-ins have felt a little different from the previous period. Be gentle with yourself; noticing is already a meaningful step.`
        : `You logged ${currentMoods.length} mood ${currentMoods.length === 1 ? 'check-in' : 'check-ins'} ${periodLabel}. Each check-in helps build a fuller picture over time.`;

  const saveGoals = useCallback((nextGoals: Goal[]) => {
    setGoals(nextGoals);
    if (!userId) return;
    try {
      localStorage.setItem(`humura-wellbeing-goals-${userId}`, JSON.stringify(nextGoals));
      setNotice(null);
    } catch {
      setNotice('Your goals could not be saved on this device. Please check your browser storage settings.');
    }
  }, [userId]);

  const createGoal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = goalTitle.trim();
    if (!title) return;
    saveGoals([{ id: crypto.randomUUID(), title, target: Math.max(1, goalTarget), progress: 0 }, ...goals]);
    setGoalTitle('');
    setGoalTarget(3);
    setIsCreatingGoal(false);
  };

  const updateGoalProgress = (goal: Goal) => {
    saveGoals(goals.map(item => item.id === goal.id
      ? { ...item, progress: Math.min(item.target, item.progress + 1) }
      : item));
  };

  const buildReport = (weekly = false) => {
    const reportMoods = weekly ? weeklyMoods : currentMoods;
    const reportActivities = weekly
      ? activities.filter(activity => {
          const timestamp = new Date(activity.createdAt).getTime();
          return timestamp >= weeklyBounds.start.getTime() && timestamp <= weeklyBounds.end.getTime();
        })
      : inPeriodActivities;
    const reportStart = weekly ? weeklyBounds.start : bounds.start;
    const reportEnd = weekly ? weeklyBounds.end : bounds.end;
    const reportAverage = averageScore(reportMoods);
    const comparisonAverage = averageScore(weekly ? previousWeeklyMoods : previousMoods);
    const reportTrend = reportAverage === null || comparisonAverage === null
      ? 'not enough check-ins to compare'
      : reportAverage - comparisonAverage > 0.25
        ? 'more positive than the previous period'
        : reportAverage - comparisonAverage < -0.25
          ? 'different from the previous period'
          : 'similar to the previous period';
    const reportInsights = weekly
      ? [
          reportMoods.length ? `${reportMoods.length} mood ${reportMoods.length === 1 ? 'check-in' : 'check-ins'} this week.` : 'No mood check-ins recorded this week.',
          `${reportActivities.length} recorded wellbeing ${reportActivities.length === 1 ? 'activity' : 'activities'} this week.`
        ]
      : aiReflection
        ? [aiReflection.summary, ...aiReflection.recommendations]
        : insights;

    return [
    `Humura AI — Your ${weekly ? 'Weekly Reflection' : 'Wellbeing Journey'}`,
    `Period: ${dateLabel(reportStart.toISOString(), { month: 'long', day: 'numeric', year: 'numeric' })} – ${dateLabel(reportEnd.toISOString(), { month: 'long', day: 'numeric', year: 'numeric' })}`,
    '',
    `Mood check-ins: ${reportMoods.length}`,
    `Recorded activities: ${reportActivities.length}`,
    `Wellbeing trend: ${reportTrend}`,
    '',
    'Patterns we noticed:',
    ...reportInsights.map(insight => `- ${insight}`),
    '',
    'This reflection is based on your activity and check-ins and is not a medical diagnosis.'
    ].join('\n');
  };

  const downloadReport = () => {
    const report = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = report.internal.pageSize.getWidth();
    const pageHeight = report.internal.pageSize.getHeight();
    const left = 18;
    const right = 18;
    const contentWidth = pageWidth - left - right;
    const bottom = pageHeight - 22;
    const safeText = (text: string) => text
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[–—]/g, '-')
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[^\x20-\x7E]/g, '');

    report.setFillColor(21, 60, 50);
    report.rect(0, 0, pageWidth, 43, 'F');
    report.setTextColor(255, 255, 255);
    report.setFont('helvetica', 'bold');
    report.setFontSize(19);
    report.text('Your Wellbeing Journey', left, 19);
    report.setFont('helvetica', 'normal');
    report.setFontSize(10);
    report.text('Humura AI  |  Personal progress report', left, 28);
    report.setTextColor(222, 241, 231);
    report.text(`Created ${new Date().toLocaleDateString()}`, left, 36);

    let y = 55;
    const lines = safeText(buildReport()).split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        y += 3;
        return;
      }

      const isHeading = trimmed.endsWith(':') || trimmed.startsWith('Humura AI');
      report.setFont('helvetica', isHeading ? 'bold' : 'normal');
      report.setFontSize(isHeading ? 11 : 10);
      report.setTextColor(isHeading ? 21 : 61, isHeading ? 60 : 83, isHeading ? 50 : 70);
      const wrapped = report.splitTextToSize(trimmed, contentWidth) as string[];
      const lineHeight = isHeading ? 6 : 5;
      if (y + wrapped.length * lineHeight > bottom) {
        report.addPage();
        y = 20;
      }
      report.text(wrapped, left, y);
      y += wrapped.length * lineHeight + (isHeading ? 2 : 1);
    });

    const pageCount = report.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      report.setPage(page);
      report.setDrawColor(220, 233, 225);
      report.line(left, pageHeight - 16, pageWidth - right, pageHeight - 16);
      report.setFont('helvetica', 'normal');
      report.setFontSize(8);
      report.setTextColor(93, 113, 102);
      report.text('Private reflection - share only when you choose.', left, pageHeight - 10);
      report.text(`${page} / ${pageCount}`, pageWidth - right, pageHeight - 10, { align: 'right' });
    }

    report.save('humura-wellbeing-report.pdf');
    setNotice('Your PDF progress report has been downloaded.');
  };

  const shareReport = async () => {
    if (!shareConsent) return;
    const text = buildReport(shareMode === 'whatsapp');
    if (shareMode === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      setShareMode(null);
      setShareConsent(false);
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My Humura AI wellbeing report', text });
      } else {
        await navigator.clipboard.writeText(text);
        setNotice('Your report is copied. You can paste it into a message to your professional.');
      }
      setShareMode(null);
      setShareConsent(false);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setShareError('We could not open sharing on this device. You can download your report instead.');
    }
  };

  const openShare = (mode: 'professional' | 'whatsapp') => {
    setShareConsent(false);
    setShareError(null);
    setShareMode(mode);
  };

  const topActivities = showAllActivities ? activities : inPeriodActivities.slice(0, 4);
  const displayedInsights = aiReflection
    ? [aiReflection.summary, ...aiReflection.recommendations]
    : insights;
  const completedLessons = lessons.filter(lesson => {
    const timestamp = new Date(lesson.completed_at).getTime();
    return timestamp >= bounds.start.getTime() && timestamp <= bounds.end.getTime();
  }).length;
  const completedGoals = goals.filter(goal => goal.progress >= goal.target).length;
  const weeklyActivityCount = activities.filter(activity => {
    const timestamp = new Date(activity.createdAt).getTime();
    return timestamp >= weeklyBounds.start.getTime() && timestamp <= weeklyBounds.end.getTime();
  }).length;
  const weeklyReflectionText = weeklyMoods.length === 0
    ? 'There are no mood check-ins this week yet. Whenever you are ready, a quick check-in can help you reflect.'
    : weeklyDirection === 'up'
      ? `Your recent check-ins lean more positive than the previous week. You logged ${weeklyMoods.length} mood ${weeklyMoods.length === 1 ? 'check-in' : 'check-ins'} this week.`
      : weeklyDirection === 'down'
        ? 'Your check-ins have felt a little different from last week. Be gentle with yourself; noticing is already a meaningful step.'
        : weeklyDirection === 'steady'
          ? `Your check-ins look similar to last week. You logged ${weeklyMoods.length} mood ${weeklyMoods.length === 1 ? 'check-in' : 'check-ins'} this week.`
          : `You logged ${weeklyMoods.length} mood ${weeklyMoods.length === 1 ? 'check-in' : 'check-ins'} this week. Each one helps build a fuller picture over time.`;
  const milestones = [
    { title: 'First check-in', description: 'You made space to check in with yourself.', earned: moods.length >= 1, icon: Heart },
    { title: 'A week of showing up', description: 'Seven days with a wellbeing activity.', earned: daysWithActivity >= 7, icon: Flame },
    { title: 'Learning along the way', description: 'Complete five wellbeing lessons.', earned: lessons.length >= 5, icon: Lightbulb },
    { title: 'A goal reached', description: 'Celebrate a personal goal you completed.', earned: completedGoals > 0, icon: Target }
  ];

  return (
    <div className="min-h-screen bg-[#F4F8F6] px-4 py-6 font-poppins text-[#153C32] sm:px-7 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-[#28745F]">
              <Sprout size={17} aria-hidden="true" />
              A space to notice how far you have come
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[#103C31] sm:text-4xl">
              Your Wellbeing Journey <span aria-hidden="true">🌱</span>
            </h1>
            <p className="mt-2 max-w-xl text-base leading-7 text-[#526B62]">
              Track your progress, understand your patterns, and celebrate every step forward.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
            <label className="sr-only" htmlFor="progress-period">Date range</label>
            <select
              id="progress-period"
              value={period}
              onChange={event => setPeriod(event.target.value as Period)}
              className="min-h-11 rounded-xl border border-[#D5E4DC] bg-white px-3 text-sm font-semibold text-[#153C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21B48D]"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="threeMonths">3 Months</option>
              <option value="custom">Custom</option>
            </select>
            <button type="button" onClick={downloadReport} className={`${buttonClass} border border-[#CADBD2] bg-white text-[#153C32] hover:bg-[#F0F7F3]`}>
              <ArrowDownToLine size={17} aria-hidden="true" />
              Download report
            </button>
            <button type="button" onClick={() => openShare('professional')} className={`${buttonClass} bg-[#153C32] text-white hover:bg-[#205B49]`}>
              <ShieldCheck size={17} aria-hidden="true" />
              Share with professional
            </button>
          </div>
        </header>

        {period === 'custom' && (
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#DCE9E2] bg-white p-4">
            <label className="grid gap-1 text-xs font-semibold text-[#526B62]">
              From
              <input type="date" value={customStart} max={customEnd} onChange={event => setCustomStart(event.target.value)} className="min-h-10 rounded-lg border border-[#D5E4DC] px-3 text-sm text-[#153C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21B48D]" />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-[#526B62]">
              To
              <input type="date" value={customEnd} min={customStart} max={toDateInputValue(new Date())} onChange={event => setCustomEnd(event.target.value)} className="min-h-10 rounded-lg border border-[#D5E4DC] px-3 text-sm text-[#153C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21B48D]" />
            </label>
            <p className="pb-2 text-xs text-[#64796F]">Choose a time window that feels useful to you.</p>
          </div>
        )}

        {(loadError || notice) && (
          <div role={loadError ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${loadError ? 'border-[#E7D7B3] bg-[#FFF9EC] text-[#654B17]' : 'border-[#CDE5D8] bg-[#EAF7F0] text-[#235A42]'}`}>
            {loadError ? <CircleHelp size={18} className="mt-0.5 shrink-0" aria-hidden="true" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />}
            <p className="flex-1">{loadError || notice}</p>
            {notice && <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message" className="rounded p-1 hover:bg-black/5"><X size={16} /></button>}
          </div>
        )}

        <section aria-labelledby="overview-heading">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 id="overview-heading" className="text-lg font-bold text-[#153C32]">A look at your wellbeing</h2>
              <p className="mt-0.5 text-sm text-[#667A71]">A gentle snapshot of your recent activity.</p>
            </div>
            <span className="hidden items-center gap-1.5 text-xs font-medium text-[#667A71] sm:inline-flex">
              <LockKeyhole size={13} aria-hidden="true" /> Just for you
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`${cardClass} p-5`}>
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#E9F5ED] text-[#28745F]"><Flower2 size={21} aria-hidden="true" /></div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${moodDirection === 'up' ? 'bg-[#E8F5EC] text-[#266A47]' : moodDirection === 'down' ? 'bg-[#F5F1E8] text-[#745D2B]' : 'bg-[#EFF4F1] text-[#556B61]'}`}>
                  {moodDirection === 'up' ? <ArrowUpRight size={14} aria-hidden="true" /> : moodDirection === 'down' ? <TrendingDown size={14} aria-hidden="true" /> : <Activity size={13} aria-hidden="true" />}
                  {moodDirection === 'up' ? 'Leaning brighter' : moodDirection === 'down' ? 'A different season' : moodDirection === 'steady' ? 'Steady' : 'Getting started'}
                </span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#526B62]">Wellbeing</h3>
              <p className="mt-1 text-2xl font-bold text-[#153C32]">{moodDirection === 'up' ? 'Improving' : moodDirection === 'down' ? 'Changing' : moodDirection === 'steady' ? 'Steady' : 'Your own pace'}</p>
              <p className="mt-1 text-xs text-[#6A7E74]">{moodDelta !== null ? `${Math.abs(moodDelta)} point ${moodDelta === 1 || moodDelta === -1 ? '' : 's'} from the previous period` : 'Based on your recent check-ins'}</p>
            </motion.article>
            <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className={`${cardClass} p-5`}>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#EEF1FB] text-[#485C9A]"><Heart size={21} aria-hidden="true" /></div>
              <h3 className="mt-4 text-sm font-semibold text-[#526B62]">Mood check-ins</h3>
              <p className="mt-1 text-2xl font-bold text-[#153C32]">{isLoading ? '—' : `${currentMoods.length} this ${period === 'week' ? 'week' : 'period'}`}</p>
              <p className="mt-1 text-xs text-[#6A7E74]">{previousMoods.length ? `${currentMoods.length - previousMoods.length >= 0 ? '+' : ''}${currentMoods.length - previousMoods.length} compared with the previous period` : 'Every check-in is a meaningful step'}</p>
            </motion.article>
            <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className={`${cardClass} p-5`}>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F8F2E8] text-[#89652B]"><Sparkles size={21} aria-hidden="true" /></div>
              <h3 className="mt-4 text-sm font-semibold text-[#526B62]">Positive activities</h3>
              <p className="mt-1 text-2xl font-bold text-[#153C32]">{isLoading ? '—' : inPeriodActivities.length}</p>
              <p className="mt-1 text-xs text-[#6A7E74]">Check-ins, reflections and lessons recorded</p>
            </motion.article>
            <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className={`${cardClass} p-5`}>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF2E6] text-[#A15E22]"><Flame size={21} aria-hidden="true" /></div>
              <h3 className="mt-4 text-sm font-semibold text-[#526B62]">Your wellness streak</h3>
              <p className="mt-1 text-2xl font-bold text-[#153C32]">{daysWithActivity} {daysWithActivity === 1 ? 'day' : 'days'} <span aria-hidden="true">🔥</span></p>
              <p className="mt-1 text-xs text-[#6A7E74]">No pressure to keep a streak—every return matters.</p>
            </motion.article>
          </div>
        </section>

        <section aria-labelledby="trend-heading" className={`${cardClass} p-5 sm:p-7`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 id="trend-heading" className="text-xl font-bold text-[#153C32]">Your Wellbeing Over Time</h2>
              <p className="mt-1 text-sm text-[#667A71]">A reflection of your own mood check-ins—not a score to measure yourself by.</p>
            </div>
            <div role="group" aria-label="Trend chart view" className="flex flex-wrap gap-1 rounded-xl bg-[#F1F6F3] p-1">
              {(['daily', 'weekly', 'monthly'] as const).map(view => (
                <button key={view} type="button" aria-pressed={chartView === view} onClick={() => setChartView(view)} className={`min-h-9 rounded-lg px-3 text-xs font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21B48D] ${chartView === view ? 'bg-white text-[#153C32] shadow-sm' : 'text-[#61756B] hover:text-[#153C32]'}`}>
                  {view}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 h-64 w-full" role="img" aria-label={`Line chart of mood check-in scores over the ${periodLabel}`}>
            {trendData.some(point => point.average !== null) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="#E8EFEB" strokeDasharray="4 5" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#61756B', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={18} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: '#61756B', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 14, borderColor: '#DCE9E2', color: '#153C32', fontSize: 12 }}
                    formatter={(value, name, item) => [
                      value === null
                        ? 'No check-in'
                        : name === 'Previous period'
                          ? `${Number(value).toFixed(1)} / 5`
                          : `${Number(value).toFixed(1)} / 5 · ${item.payload.count} ${item.payload.count === 1 ? 'check-in' : 'check-ins'}`,
                      name
                    ]}
                    labelFormatter={(_label, items) => items[0]?.payload?.date
                      ? dateLabel(items[0].payload.date.toISOString(), { month: 'long', day: 'numeric', year: 'numeric' })
                      : _label}
                  />
                  <Line type="monotone" dataKey="average" name="Average mood" stroke="#1D8062" strokeWidth={3} connectNulls={false} dot={{ r: 3, fill: '#1D8062', stroke: '#FFFFFF', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#1D8062', stroke: '#FFFFFF', strokeWidth: 2 }} />
                  {previousMoods.length > 0 && <Line type="monotone" dataKey="previousAverage" name="Previous period" stroke="#9AAFA4" strokeWidth={2} strokeDasharray="5 5" connectNulls={false} dot={false} activeDot={{ r: 5 }} />}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-2xl bg-[#F7FAF8] text-center">
                <div className="max-w-sm px-6">
                  <Heart size={26} className="mx-auto text-[#4C8B72]" aria-hidden="true" />
                  <p className="mt-2 font-semibold text-[#153C32]">Your check-ins will appear here</p>
                  <p className="mt-1 text-sm text-[#687C72]">When you log a mood, you can start noticing your own patterns over time.</p>
                  <button type="button" onClick={() => navigate('/patient/mood')} className="mt-3 text-sm font-bold text-[#21694F] underline underline-offset-4">Add a mood check-in</button>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-xs font-medium text-[#526B62]" aria-label="Chart legend">
                  <span className="inline-flex items-center gap-2"><span className="h-0.5 w-5 bg-[#1D8062]" aria-hidden="true" /> This period</span>
                  {previousMoods.length > 0 && <span className="inline-flex items-center gap-2"><span className="w-5 border-t-2 border-dashed border-[#9AAFA4]" aria-hidden="true" /> Previous period</span>}
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-[#F0F7F3] p-4 sm:flex-row sm:items-start">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#28745F]"><Lightbulb size={18} aria-hidden="true" /></div>
            <div>
              <p className="text-sm font-semibold leading-6 text-[#254D3D]">{reflectionText}</p>
              <p className="mt-1 text-xs leading-5 text-[#60766B]">This insight is based on your activity and check-ins and is not a medical diagnosis.</p>
            </div>
          </div>
          <details className="mt-3 rounded-xl border border-[#E7EFEA] px-4 py-3">
            <summary className="cursor-pointer text-xs font-semibold text-[#526B62] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21B48D]">
              Read the chart data
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[22rem] text-left text-xs">
                <caption className="sr-only">Mood check-in averages for each displayed date</caption>
                <thead><tr className="border-b border-[#E7EFEA] text-[#526B62]"><th scope="col" className="py-2 pr-4">Date</th><th scope="col" className="py-2 pr-4">Check-ins</th><th scope="col" className="py-2 pr-4">This period</th><th scope="col" className="py-2">Previous period</th></tr></thead>
                <tbody>{trendData.map(point => <tr key={point.key} className="border-b border-[#F0F4F1] text-[#334E42]"><th scope="row" className="py-2 pr-4 font-medium">{point.label}</th><td className="py-2 pr-4">{point.count}</td><td className="py-2 pr-4">{point.average === null ? 'No check-in' : `${point.average.toFixed(1)} / 5`}</td><td className="py-2">{point.previousAverage === null ? '—' : `${point.previousAverage.toFixed(1)} / 5`}</td></tr>)}</tbody>
              </table>
            </div>
          </details>
        </section>

        <div className="grid items-start gap-6 xl:grid-cols-5">
          <section aria-labelledby="insights-heading" className="overflow-hidden rounded-3xl bg-[#123F33] p-6 text-white shadow-[0_16px_34px_-22px_rgba(8,53,42,0.65)] xl:col-span-3 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#205A47] text-[#9BE0BD]"><Sparkles size={22} aria-hidden="true" /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A6D8BE]">AI insights</p>
                  <h2 id="insights-heading" className="mt-1 text-xl font-bold">Patterns We Noticed</h2>
                </div>
              </div>
              <span className="hidden items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#D8EBE1] sm:inline-flex"><LockKeyhole size={13} aria-hidden="true" /> Check-ins only</span>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#E2F0E8]">A gentle reflection of the check-ins you chose to share here. Journal entries and conversation content are not included.</p>
            {isAnalyzing && <p className="mt-3 text-xs text-[#C2DCD0]" role="status">Preparing a reflection from your mood check-ins…</p>}
            {aiUnavailable && <p className="mt-3 text-xs text-[#C2DCD0]" role="status">AI reflections are temporarily unavailable. The notes below are simple summaries of your check-in counts.</p>}
            <ul className="mt-4 space-y-3">
              {(insightsExpanded ? displayedInsights : displayedInsights.slice(0, 2)).map((insight, index) => (
                <li key={`${index}-${insight}`} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-[#F0F7F3]">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#205A47] text-[#A6E5C5]">{index + 1}</span>
                  {insight}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-5 text-[#C2DCD0]">Patterns are possibilities, not facts or diagnoses. They reflect only the information shown here.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => setInsightsExpanded(!insightsExpanded)} className={`${buttonClass} border border-white/25 text-white hover:bg-white/10`}>
                {insightsExpanded ? 'Show fewer insights' : 'View more insights'}
                {insightsExpanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
              </button>
              <button type="button" onClick={() => navigate('/patient/chat')} className={`${buttonClass} bg-[#A6E5C5] text-[#143D31] hover:bg-[#BCEBD2]`}>
                <MessageCircle size={16} aria-hidden="true" /> Ask AI about this
              </button>
            </div>
          </section>

          <section aria-labelledby="mood-patterns-heading" className={`${cardClass} p-6 xl:col-span-2`}>
            <div className="flex items-start justify-between">
              <div>
                <h2 id="mood-patterns-heading" className="text-xl font-bold text-[#153C32]">Mood Patterns</h2>
                <p className="mt-1 text-sm text-[#687C72]">From your check-ins {periodLabel}.</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#F1F6F3] text-[#28745F]"><Activity size={19} aria-hidden="true" /></div>
            </div>
            {moodPatterns.length ? (
              <div className="mt-5 space-y-2.5">
                {moodPatterns.slice(0, 5).map(pattern => (
                  <button
                    key={pattern.mood}
                    type="button"
                    aria-pressed={selectedMood === pattern.mood}
                    onClick={() => setSelectedMood(selectedMood === pattern.mood ? null : pattern.mood)}
                    className={`w-full rounded-2xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21B48D] ${selectedMood === pattern.mood ? 'border-[#3B8A6A] bg-[#F0F8F3]' : 'border-[#E7EFEA] hover:bg-[#F7FAF8]'}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-2xl" aria-hidden="true">{pattern.detail.emoji}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#25473A]">
                          {pattern.detail.label}
                          {pattern.isMostCommon && <span className="rounded-full bg-[#E8F5EC] px-2 py-0.5 text-[10px] font-bold text-[#266A47]">Most frequent</span>}
                          {!pattern.isMostCommon && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${pattern.trend === 'up' ? 'bg-[#E8F5EC] text-[#266A47]' : pattern.trend === 'down' ? 'bg-[#F5F1E8] text-[#745D2B]' : 'bg-[#EFF4F1] text-[#556B61]'}`}>{pattern.trend === 'up' ? 'Increasing' : pattern.trend === 'down' ? 'Decreasing' : 'Stable'}</span>}
                        </span>
                        <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#EAF0EC]">
                          <span className="block h-full rounded-full bg-[#52A47B]" style={{ width: `${Math.max(4, pattern.share * 100)}%` }} />
                        </span>
                      </span>
                      <span className="text-xs font-semibold text-[#61756B]">{pattern.count}</span>
                    </span>
                    <span className="sr-only">Activate to see check-in dates for {pattern.detail.label}</span>
                  </button>
                ))}
                {selectedMood && (
                  <div className="rounded-xl bg-[#F5F8F6] p-3 text-xs leading-5 text-[#526B62]" aria-live="polite">
                    <p className="font-semibold">{MOOD_DETAILS[selectedMood]?.label ?? selectedMood} check-ins</p>
                    <p>{currentMoods.filter(log => log.mood.toLowerCase() === selectedMood).map(log => dateLabel(log.created_at, { month: 'long', day: 'numeric' })).join(' · ')}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-5 rounded-2xl bg-[#F5F8F6] p-4 text-sm leading-6 text-[#687C72]">As you add check-ins, this space will help you notice which moods you have been choosing most often.</p>
            )}
            {moodPatterns.length > 0 && <p className="mt-3 text-xs leading-5 text-[#687C72]">The bars show how often each mood was logged, not how you should feel.</p>}
          </section>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section aria-labelledby="activities-heading" className={`${cardClass} p-6 sm:p-7`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="activities-heading" className="text-xl font-bold text-[#153C32]">Your Wellness Activities</h2>
                <p className="mt-1 text-sm text-[#687C72]">Small steps, in the ways that work for you.</p>
              </div>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E9F5ED] text-[#28745F]"><Wind size={19} aria-hidden="true" /></div>
            </div>
            {topActivities.length ? (
              <ul className="mt-5 divide-y divide-[#EDF2EF]">
                {topActivities.map(activity => {
                  const Icon = activity.icon;
                  return (
                    <li key={activity.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F0F7F3] text-[#28745F]"><Icon size={18} aria-hidden="true" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#25473A]">{activity.title}</p>
                        <p className="text-xs text-[#687C72]">{activity.category} · {dateLabel(activity.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <CheckCircle2 size={17} className="shrink-0 text-[#528B69]" aria-label="Recorded" />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-5 rounded-2xl bg-[#F5F8F6] p-4 text-sm leading-6 text-[#687C72]">Your recorded check-ins, reflections and lessons will appear here. There is no need to do everything at once.</p>
            )}
            <button type="button" onClick={() => setShowAllActivities(!showAllActivities)} className="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-[#21694F] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21B48D]">
              {showAllActivities ? 'Show recent activities' : 'View all activities'} <ArrowRight size={15} aria-hidden="true" />
            </button>
            {completedLessons > 0 && <p className="mt-2 text-xs text-[#687C72]">{completedLessons} lesson{completedLessons === 1 ? '' : 's'} completed in this period.</p>}
          </section>

          <section aria-labelledby="goals-heading" className={`${cardClass} p-6 sm:p-7`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="goals-heading" className="text-xl font-bold text-[#153C32]">My Goals</h2>
                <p className="mt-1 text-sm text-[#687C72]">Choose intentions that feel kind and realistic for you.</p>
              </div>
              <button type="button" onClick={() => setIsCreatingGoal(!isCreatingGoal)} className={`${buttonClass} shrink-0 border border-[#CFE2D6] bg-[#F2F8F4] px-3 text-[#205B49] hover:bg-[#E9F4ED]`}>
                <Plus size={17} aria-hidden="true" /> <span className="hidden sm:inline">Create new goal</span><span className="sm:hidden">Add goal</span>
              </button>
            </div>
            {isCreatingGoal && (
              <form onSubmit={createGoal} className="mt-4 space-y-3 rounded-2xl border border-[#DCE9E2] bg-[#F8FBF9] p-4">
                <label className="grid gap-1.5 text-xs font-semibold text-[#526B62]" htmlFor="goal-title">What would you like to work toward?
                  <input id="goal-title" autoFocus maxLength={100} value={goalTitle} onChange={event => setGoalTitle(event.target.value)} required placeholder="e.g. Make time for a breathing break" className="min-h-11 rounded-xl border border-[#D5E4DC] bg-white px-3 text-sm font-normal text-[#153C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21B48D]" />
                </label>
                <label className="grid max-w-48 gap-1.5 text-xs font-semibold text-[#526B62]" htmlFor="goal-target">A gentle target
                  <input id="goal-target" type="number" min={1} max={100} value={goalTarget} onChange={event => setGoalTarget(Number(event.target.value))} className="min-h-11 rounded-xl border border-[#D5E4DC] bg-white px-3 text-sm font-normal text-[#153C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21B48D]" />
                </label>
                <div className="flex gap-2">
                  <button type="submit" className={`${buttonClass} bg-[#153C32] text-white hover:bg-[#205B49]`}>Save goal</button>
                  <button type="button" onClick={() => setIsCreatingGoal(false)} className={`${buttonClass} border border-[#D5E4DC] bg-white text-[#526B62] hover:bg-[#F1F6F3]`}>Cancel</button>
                </div>
              </form>
            )}
            {goals.length ? (
              <ul className="mt-5 space-y-3">
                {goals.map(goal => {
                  const percentage = Math.min(100, Math.round(goal.progress / goal.target * 100));
                  return (
                    <li key={goal.id} className="rounded-2xl border border-[#E7EFEA] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold leading-5 text-[#25473A]">{goal.title}</p>
                          <p className="mt-1 text-xs text-[#687C72]">{goal.progress} of {goal.target} steps · {percentage}%</p>
                        </div>
                        {percentage === 100
                          ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#28745F]"><Check size={15} aria-hidden="true" /> Reached</span>
                          : <button type="button" onClick={() => updateGoalProgress(goal)} className="min-h-9 rounded-lg border border-[#CFE2D6] px-3 text-xs font-semibold text-[#205B49] hover:bg-[#F2F8F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21B48D]">Log a step</button>}
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EAF0EC]" role="progressbar" aria-label={`Progress on ${goal.title}`} aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full rounded-full bg-[#45946C] transition-[width] duration-500" style={{ width: `${percentage}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-[#687C72]">{percentage === 100 ? 'You made it—take a moment to celebrate.' : 'Go at your own pace. Plans can change.'}</p>
                    </li>
                  );
                })}
              </ul>
            ) : !isCreatingGoal && (
              <div className="mt-5 rounded-2xl bg-[#F5F8F6] p-4">
                <p className="text-sm font-semibold text-[#25473A]">Your goals, your way</p>
                <p className="mt-1 text-sm leading-6 text-[#687C72]">Try a few check-ins, a breathing pause, journaling, or learning something new—or create a goal that feels right for you.</p>
              </div>
            )}
            <p className="mt-3 text-xs text-[#687C72]">Goals are personal reminders, not rules. Incomplete goals are always okay.</p>
          </section>
        </div>

        <section aria-labelledby="milestones-heading" className={`${cardClass} p-6 sm:p-7`}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="milestones-heading" className="text-xl font-bold text-[#153C32]">Your Milestones <span aria-hidden="true">🎉</span></h2>
              <p className="mt-1 text-sm text-[#687C72]">Little reminders of the steps you have taken. Celebrate any way you like.</p>
            </div>
            <p className="text-xs font-medium text-[#687C72]">{milestones.filter(item => item.earned).length} of {milestones.length} reached</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {milestones.map(milestone => {
              const Icon = milestone.icon;
              return (
                <article key={milestone.title} className={`rounded-2xl border p-4 ${milestone.earned ? 'border-[#D8E9DB] bg-[#F3F8F2]' : 'border-[#E7EFEA] bg-[#FBFCFB]'}`}>
                  <div className={`grid h-10 w-10 place-items-center rounded-xl ${milestone.earned ? 'bg-[#E3F0E4] text-[#36734B]' : 'bg-[#F0F3F1] text-[#738078]'}`}><Icon size={19} aria-hidden="true" /></div>
                  <h3 className="mt-3 text-sm font-semibold text-[#25473A]">{milestone.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#687C72]">{milestone.earned ? milestone.description : 'Whenever this happens, it is worth celebrating.'}</p>
                  {milestone.earned && <p className="mt-2 text-xs font-bold text-[#36734B]">Reached</p>}
                </article>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="weekly-heading" className="overflow-hidden rounded-3xl border border-[#DBE8E0] bg-white shadow-[0_8px_24px_-20px_rgba(8,53,42,0.28)]">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#398060]">A moment to reflect</p>
              <h2 id="weekly-heading" className="mt-2 text-2xl font-bold text-[#153C32]">Your Weekly Reflection</h2>
              <p className="mt-3 text-sm leading-6 text-[#526B62]">{weeklyReflectionText}</p>
              <button type="button" onClick={() => setWeeklyExpanded(!weeklyExpanded)} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-[#21694F] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21B48D]">
                {weeklyExpanded ? 'Hide full reflection' : 'View full weekly report'}
                {weeklyExpanded ? <ChevronUp size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}
              </button>
              {weeklyExpanded && (
                <div className="mt-4 space-y-3 rounded-2xl bg-[#F4F8F5] p-4 text-sm leading-6 text-[#526B62]">
                  <p><strong className="text-[#25473A]">A positive step:</strong> {weeklyActivityCount ? `You recorded ${weeklyActivityCount} ${weeklyActivityCount === 1 ? 'wellbeing activity' : 'wellbeing activities'} this week.` : 'Taking time to pause and reflect is a positive step in itself.'}</p>
                  <p><strong className="text-[#25473A]">Something to notice:</strong> {weeklyMoods.length ? (() => {
                    const mostFrequent = new Map<string, number>();
                    weeklyMoods.forEach(log => mostFrequent.set(log.mood.toLowerCase(), (mostFrequent.get(log.mood.toLowerCase()) ?? 0) + 1));
                    const [mood] = [...mostFrequent.entries()].sort((a, b) => b[1] - a[1])[0];
                    return `${MOOD_DETAILS[mood]?.label ?? mood} appeared most often in your check-ins this week.`;
                  })() : 'There is not enough check-in data to notice a pattern yet.'}</p>
                  <p><strong className="text-[#25473A]">A gentle idea:</strong> Choose one small activity that feels manageable, like a brief breathing break, writing a few lines, or a conversation with someone you trust.</p>
                  <p className="text-xs text-[#687C72]">This reflection uses your check-in and activity dates only. No journal content is included.</p>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center gap-4 bg-[#F1F7F3] p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#28745F]"><LockKeyhole size={18} aria-hidden="true" /></div>
                <div>
                  <h3 className="text-sm font-bold text-[#25473A]">Your report stays yours</h3>
                  <p className="mt-1 text-sm leading-6 text-[#5D7267]">WhatsApp opens only after you choose to share. Review the report and confirm your consent first.</p>
                </div>
              </div>
              <button type="button" onClick={() => openShare('whatsapp')} className={`${buttonClass} w-full bg-[#153C32] text-white hover:bg-[#205B49]`}>
                <Send size={16} aria-hidden="true" /> Send weekly report via WhatsApp
              </button>
            </div>
          </div>
        </section>

        <section aria-labelledby="support-heading" className="rounded-3xl border border-[#DCE9E2] bg-[#EEF6F0] p-6 sm:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-[#28745F] shadow-sm"><HeartHandshake size={22} aria-hidden="true" /></div>
              <div>
                <h2 id="support-heading" className="text-xl font-bold text-[#153C32]">{supportContact ? 'Your Support Team' : 'Need Additional Support?'}</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-[#526B62]">
                  {supportContact
                    ? `You are connected with ${supportContact.name}${supportContact.specialty ? `, ${supportContact.specialty}` : ''}. You can reach out whenever you would like support.`
                    : "You don't have to manage your wellbeing journey alone. Connect with a mental health professional when you need additional support."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 md:shrink-0">
              <button type="button" onClick={() => navigate('/patient/professionals')} className={`${buttonClass} bg-[#153C32] text-white hover:bg-[#205B49]`}>
                {supportContact ? 'Find another professional' : 'Find a professional'}
              </button>
              <button type="button" onClick={() => navigate('/patient/meet-professional')} className={`${buttonClass} border border-[#C7DCCF] bg-white text-[#205B49] hover:bg-[#F8FBF9]`}>
                {supportContact ? 'View my support team' : 'Explore support options'}
              </button>
            </div>
          </div>
        </section>

        <p className="flex items-start gap-2 pb-3 text-xs leading-5 text-[#667A71]">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#41815F]" aria-hidden="true" />
          Your progress page offers supportive reflections—not medical advice or a diagnosis. If you need help, reaching out to a trusted person or professional is always an option.
        </p>
      </div>

      {shareMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#09261F]/55 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) { setShareMode(null); setShareConsent(false); } }}>
          <section ref={shareDialogRef} role="dialog" aria-modal="true" aria-labelledby="share-dialog-title" className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="share-dialog-title" className="text-xl font-bold text-[#153C32]">{shareMode === 'whatsapp' ? 'Share your weekly reflection' : 'Share with a professional'}</h2>
                <p className="mt-2 text-sm leading-6 text-[#526B62]">
                  {shareMode === 'whatsapp'
                    ? 'WhatsApp will open with a summary of your check-ins and activities. You choose the recipient and can review the message before sending.'
                    : 'Your report is not sent automatically. Your device will open its share options so you can choose a professional or another recipient.'}
                </p>
              </div>
              <button ref={shareCloseButtonRef} type="button" onClick={() => { setShareMode(null); setShareConsent(false); }} aria-label="Close sharing dialog" className="rounded-lg p-2 text-[#61756B] hover:bg-[#F1F6F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21B48D]"><X size={19} /></button>
            </div>
            <div className="mt-4 max-h-40 overflow-y-auto rounded-2xl border border-[#E3ECE6] bg-[#F7FAF8] p-4">
              <p className="whitespace-pre-line text-xs leading-5 text-[#526B62]">{buildReport()}</p>
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl p-2 text-sm leading-6 text-[#25473A] focus-within:ring-2 focus-within:ring-[#21B48D]">
              <input type="checkbox" checked={shareConsent} onChange={event => setShareConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-[#28745F]" />
              <span>I have reviewed this summary and consent to sharing it using the selected app. This report does not include my journal entries or conversations.</span>
            </label>
            {shareError && <p role="alert" className="mt-2 text-sm text-[#9B3D36]">{shareError}</p>}
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => { setShareMode(null); setShareConsent(false); }} className={`${buttonClass} border border-[#D5E4DC] bg-white text-[#526B62] hover:bg-[#F4F8F5]`}>Cancel</button>
              <button type="button" disabled={!shareConsent} onClick={() => void shareReport()} className={`${buttonClass} bg-[#153C32] text-white hover:bg-[#205B49] disabled:cursor-not-allowed disabled:opacity-50`}>
                <Send size={16} aria-hidden="true" /> Continue to share
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
