import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/Shell';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DoctorDashboard from './pages/DoctorDashboard';
import {
  PatientDashboard,
  AIChatPage,
  BrailleGeneratorPage,
  CommunityPage,
  EducationHubPage,
  EmergencyPage,
  IntakePage,
  MeetProfessionalPage,
  MoodLogPage,
  NotificationsPage,
  ProfessionalsPage,
  ProgressPage,
  SettingsPage,
  SignLanguagePage,
  SupportCentersPage,
  TranslatorPage,
  CheckInPage,
  SupportNavigatorPage
} from './pages/patients';
import { ProfessionalShell } from './components/professional/ProfessionalShell';
import {
  DashboardPage as ProfessionalDashboardPage,
  PatientsPage as ProfessionalPatientsPage,
  SessionsPage as ProfessionalSessionsPage,
  AlertsPage as ProfessionalAlertsPage,
  AnalyticsPage as ProfessionalAnalyticsPage,
  VideosPage as ProfessionalVideosPage,
  BraillePage as ProfessionalBraillePage,
  SettingsPage as ProfessionalSettingsPage
} from './pages/professionals';
import { supabase } from './lib/supabaseClient';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [startupError, setStartupError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let roleRequestId = 0;
    let pendingRoleUserId: string | null = null;
    let resolvedRoleUserId: string | null = null;

    const fetchRole = async (userId: string) => {
      if (resolvedRoleUserId === userId || pendingRoleUserId === userId) return;
      const requestId = ++roleRequestId;
      pendingRoleUserId = userId;
      let timeoutId: number | undefined;
      setLoading(true);
      setStartupError(null);
      try {
        const roleLookup = Promise.resolve(supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle());
        const roleTimeout = new Promise<never>((_resolve, reject) => {
          timeoutId = window.setTimeout(() => reject(new Error('Account lookup timed out.')), 12000);
        });
        const { data, error } = await Promise.race([roleLookup, roleTimeout]);
        if (error) throw error;
        if (active && requestId === roleRequestId) {
          resolvedRoleUserId = userId;
          setRole(data?.role || 'patient');
        }
      } catch (error) {
        console.error('Unable to load account role:', error);
        if (active && requestId === roleRequestId) {
          setRole(null);
          setStartupError('We could not load your account. Check your connection and try again.');
        }
      } finally {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        if (pendingRoleUserId === userId) pendingRoleUserId = null;
        if (active && requestId === roleRequestId) setLoading(false);
      }
    };

    const sessionTimeoutId = window.setTimeout(() => {
      if (active) {
        setStartupError('Account startup is taking longer than expected. Check your connection and try again.');
        setLoading(false);
      }
    }, 15000);

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) throw error;
        if (!active) return;
        setSession(session);
        if (session) void fetchRole(session.user.id);
        else setLoading(false);
      })
      .catch((error: unknown) => {
        console.error('Unable to verify the current session:', error);
        if (active) {
          setStartupError('We could not verify your session. Please refresh the page to try again.');
          setLoading(false);
        }
      })
      .finally(() => {
        window.clearTimeout(sessionTimeoutId);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return;
      setSession(nextSession);
      if (nextSession) {
        window.setTimeout(() => {
          if (active) void fetchRole(nextSession.user.id);
        }, 0);
      } else {
        roleRequestId += 1;
        pendingRoleUserId = null;
        resolvedRoleUserId = null;
        setRole(null);
        setStartupError(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      roleRequestId += 1;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F8F5] px-4 text-[#315343]">
        <p role="status" className="rounded-2xl bg-white px-6 py-4 text-sm font-semibold shadow-sm">
          Loading your account…
        </p>
      </main>
    );
  }

  if (startupError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F5F8F5] px-4 text-center text-[#315343]">
        <p role="alert" className="max-w-md rounded-2xl bg-white px-6 py-4 text-sm font-semibold shadow-sm">
          {startupError}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-[#176B4B] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#12583D]"
        >
          Try again
        </button>
      </main>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Pages */}
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />

        {/* Public Auth Pages */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<AuthPage />} />

        {/* Root Route: If no session, show Public Landing Page directly. If logged in, redirect to respective dashboard */}
        <Route 
          path="/" 
          element={
            !session 
              ? <LandingPage /> 
              : (role === 'doctor' ? <Navigate to="/professional/dashboard" replace /> : <Navigate to="/patient/dashboard" replace />)
          } 
        />

        {/* ── PATIENT SECTION (domain/patient/...) ── */}
        <Route path="/patient" element={!session ? <Navigate to="/auth" replace /> : <Shell />}>
          <Route index element={<Navigate to="/patient/dashboard" replace />} />
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="dashboards" element={<PatientDashboard />} />
          <Route path="chat" element={<AIChatPage />} />
          <Route path="education" element={<EducationHubPage />} />
          <Route path="centers" element={<SupportCentersPage />} />
          <Route path="professionals" element={<ProfessionalsPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="sign-language" element={<SignLanguagePage />} />
          <Route path="emergency" element={<EmergencyPage />} />
          <Route path="braille" element={<BrailleGeneratorPage />} />
          <Route path="translator" element={<TranslatorPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="intake" element={<IntakePage />} />
          <Route path="mood" element={<MoodLogPage />} />
          <Route path="check-in" element={<CheckInPage />} />
          <Route path="checkin" element={<CheckInPage />} />
          <Route path="support-navigator" element={<SupportNavigatorPage />} />
          <Route path="navigator" element={<SupportNavigatorPage />} />
          <Route path="meet-professional" element={<MeetProfessionalPage />} />
          <Route path="community" element={<CommunityPage />} />
        </Route>

        {/* ── PROFESSIONAL SECTION (domain/professional/...) ── */}
        <Route path="/professional" element={!session ? <Navigate to="/auth" replace /> : <ProfessionalShell />}>
          <Route index element={<Navigate to="/professional/dashboard" replace />} />
          <Route path="dashboard" element={<ProfessionalDashboardPage />} />
          <Route path="dashboards" element={<ProfessionalDashboardPage />} />
          <Route path="patients" element={<ProfessionalPatientsPage />} />
          <Route path="sessions" element={<ProfessionalSessionsPage />} />
          <Route path="alerts" element={<ProfessionalAlertsPage />} />
          <Route path="analytics" element={<ProfessionalAnalyticsPage />} />
          <Route path="videos" element={<ProfessionalVideosPage />} />
          <Route path="braille" element={<ProfessionalBraillePage />} />
          <Route path="settings" element={<ProfessionalSettingsPage />} />
        </Route>

        {/* Legacy flat route redirects to /patient/... */}
        <Route path="/chat" element={<Navigate to="/patient/chat" replace />} />
        <Route path="/education" element={<Navigate to="/patient/education" replace />} />
        <Route path="/centers" element={<Navigate to="/patient/centers" replace />} />
        <Route path="/professionals" element={<Navigate to="/patient/professionals" replace />} />
        <Route path="/progress" element={<Navigate to="/patient/progress" replace />} />
        <Route path="/notifications" element={<Navigate to="/patient/notifications" replace />} />
        <Route path="/sign-language" element={<Navigate to="/patient/sign-language" replace />} />
        <Route path="/emergency" element={<Navigate to="/patient/emergency" replace />} />
        <Route path="/braille" element={<Navigate to="/patient/braille" replace />} />
        <Route path="/translator" element={<Navigate to="/patient/translator" replace />} />
        <Route path="/settings" element={<Navigate to="/patient/settings" replace />} />
        <Route path="/intake" element={<Navigate to="/patient/intake" replace />} />
        <Route path="/mood" element={<Navigate to="/patient/mood" replace />} />
        <Route path="/check-in" element={<Navigate to="/patient/check-in" replace />} />
        <Route path="/checkin" element={<Navigate to="/patient/check-in" replace />} />
        <Route path="/support-navigator" element={<Navigate to="/patient/support-navigator" replace />} />
        <Route path="/navigator" element={<Navigate to="/patient/support-navigator" replace />} />
        <Route path="/meet-professional" element={<Navigate to="/patient/meet-professional" replace />} />
        <Route path="/community" element={<Navigate to="/patient/community" replace />} />

        {/* Legacy Doctor route redirect */}
        <Route path="/doctor" element={<Navigate to="/professional/dashboard" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
